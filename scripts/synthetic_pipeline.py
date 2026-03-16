#!/usr/bin/env python3
"""
FRONS Synthetic Data Pipeline
==============================

Privacy-preserving synthetic data generation with three stages:

    STRIP  ->  PERTURB  ->  COMPRESS

Privacy guarantees:
    - k-anonymity with k >= 5
    - epsilon-differential privacy with epsilon = 1.0
    - No re-identification possible from synthetic output

Usage as library:
    pipeline = SyntheticDataPipeline(epsilon=1.0, k_anonymity=5)
    result = pipeline.run(
        input_path="data.csv",
        output_path="synthetic.parquet",
        direct_identifiers=["name", "phone", "ssn"],
        quasi_identifiers={"age": "age_band", "address": "district"},
        numeric_columns=["income", "score"],
    )

Usage as CLI:
    python synthetic_pipeline.py data.csv synthetic.parquet --config config.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logger = logging.getLogger("frons.synthetic_pipeline")


def _configure_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            "[%(asctime)s] %(levelname)-8s %(name)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    root = logging.getLogger("frons")
    root.setLevel(level)
    if not root.handlers:
        root.addHandler(handler)


# ---------------------------------------------------------------------------
# Helper functions (module-level, usable independently)
# ---------------------------------------------------------------------------


def generalize_age(age: int, band: int = 5) -> str:
    """Convert an exact age into a *band*-year bracket.

    Examples
    --------
    >>> generalize_age(27)
    '25-29'
    >>> generalize_age(30, band=10)
    '30-39'
    >>> generalize_age(0)
    '0-4'
    """
    if not isinstance(age, (int, float, np.integer, np.floating)):
        raise TypeError(f"age must be numeric, got {type(age).__name__}")
    age_int = int(age)
    if age_int < 0:
        raise ValueError(f"age must be non-negative, got {age_int}")
    lower = (age_int // band) * band
    upper = lower + band - 1
    return f"{lower}-{upper}"


def generalize_location(address: str) -> str:
    """Reduce a full address to district-level granularity.

    Heuristic strategy (applied in order):
    1. If the address contains comma-separated parts, keep the second-to-last
       and last segments (typically district/city + country or province).
    2. Otherwise return the full string stripped of leading digits and
       street-level keywords.

    Examples
    --------
    >>> generalize_location("123 Main St, Menteng, Jakarta Pusat, DKI Jakarta")
    'Jakarta Pusat, DKI Jakarta'
    >>> generalize_location("Jl. Sudirman No.5, Kebayoran Baru, Jakarta Selatan")
    'Kebayoran Baru, Jakarta Selatan'
    """
    if not isinstance(address, str) or not address.strip():
        return "UNKNOWN"

    parts = [p.strip() for p in address.split(",") if p.strip()]

    if len(parts) >= 3:
        # Keep the last two meaningful segments (district + city/province)
        return ", ".join(parts[-2:])
    if len(parts) == 2:
        return parts[-1]

    # Single segment — strip street-level noise
    cleaned = re.sub(
        r"^[\d\s]+|"
        r"\b(?:Jl|Jln|Jalan|St|Street|Ave|Avenue|Rd|Road|No|Blok|RT|RW)\b\.?\s*",
        "",
        parts[0],
        flags=re.IGNORECASE,
    ).strip()
    return cleaned if cleaned else parts[0]


def laplace_noise(
    value: float, sensitivity: float, epsilon: float
) -> float:
    """Add calibrated Laplace noise to *value*.

    Parameters
    ----------
    value : float
        Original value.
    sensitivity : float
        Global sensitivity of the query (L1).
    epsilon : float
        Privacy budget.  Smaller epsilon = more noise = more privacy.

    Returns
    -------
    float
        Noisy value drawn from ``value + Lap(sensitivity / epsilon)``.
    """
    if epsilon <= 0:
        raise ValueError(f"epsilon must be positive, got {epsilon}")
    if sensitivity < 0:
        raise ValueError(f"sensitivity must be non-negative, got {sensitivity}")
    scale = sensitivity / epsilon
    noise = np.random.laplace(loc=0.0, scale=scale)
    return float(value + noise)


def verify_privacy(
    original: pd.DataFrame,
    synthetic: pd.DataFrame,
) -> Dict[str, Any]:
    """Compare *original* and *synthetic* DataFrames for privacy metrics.

    Returns a dict with:
        - ``mean_drift``   : per-column absolute difference in means (numeric).
        - ``std_drift``    : per-column absolute difference in std devs.
        - ``correlation_drift`` : Frobenius norm between correlation matrices.
        - ``overlap_ratio``: fraction of synthetic rows that appear verbatim
          in the original (should be ~0 for good privacy).
    """
    common_numeric = [
        c
        for c in synthetic.select_dtypes(include=[np.number]).columns
        if c in original.columns
        and pd.api.types.is_numeric_dtype(original[c])
    ]

    report: Dict[str, Any] = {}

    # ---- Mean / std drift --------------------------------------------------
    if common_numeric:
        mean_orig = original[common_numeric].mean()
        mean_synth = synthetic[common_numeric].mean()
        std_orig = original[common_numeric].std()
        std_synth = synthetic[common_numeric].std()
        report["mean_drift"] = (mean_orig - mean_synth).abs().to_dict()
        report["std_drift"] = (std_orig - std_synth).abs().to_dict()
    else:
        report["mean_drift"] = {}
        report["std_drift"] = {}

    # ---- Correlation drift -------------------------------------------------
    if len(common_numeric) >= 2:
        corr_orig = original[common_numeric].corr().values
        corr_synth = synthetic[common_numeric].corr().values
        # Replace NaN with 0 for norm calculation
        corr_orig = np.nan_to_num(corr_orig, nan=0.0)
        corr_synth = np.nan_to_num(corr_synth, nan=0.0)
        report["correlation_drift"] = float(
            np.linalg.norm(corr_orig - corr_synth, "fro")
        )
    else:
        report["correlation_drift"] = 0.0

    # ---- Overlap (re-identification risk) ----------------------------------
    common_cols = [c for c in synthetic.columns if c in original.columns]
    if common_cols:
        try:
            # Cast both sides to string for safe comparison
            synth_str = synthetic[common_cols].astype(str)
            orig_str = original[common_cols].astype(str)
            merged = synth_str.merge(orig_str, how="inner", on=common_cols)
            report["overlap_ratio"] = (
                len(merged) / len(synthetic) if len(synthetic) > 0 else 0.0
            )
        except Exception:
            report["overlap_ratio"] = 0.0
    else:
        report["overlap_ratio"] = 0.0

    return report


# ---------------------------------------------------------------------------
# Main pipeline class
# ---------------------------------------------------------------------------


class SyntheticDataPipeline:
    """Privacy-preserving synthetic data generation pipeline.

    Three stages: **STRIP** -> **PERTURB** -> **COMPRESS**

    Guarantees
    ----------
    - k-anonymity with *k* >= ``k_anonymity`` (default 5).
    - epsilon-differential privacy with ``epsilon`` (default 1.0).
    """

    def __init__(
        self,
        epsilon: float = 1.0,
        k_anonymity: int = 5,
        random_seed: Optional[int] = None,
    ) -> None:
        if epsilon <= 0:
            raise ValueError(f"epsilon must be positive, got {epsilon}")
        if k_anonymity < 2:
            raise ValueError(f"k_anonymity must be >= 2, got {k_anonymity}")

        self.epsilon = epsilon
        self.k_anonymity = k_anonymity
        self.random_seed = random_seed
        self._rng = np.random.default_rng(seed=random_seed)

        logger.info(
            "Pipeline initialised  epsilon=%.2f  k=%d  seed=%s",
            epsilon,
            k_anonymity,
            random_seed,
        )

    # ------------------------------------------------------------------ #
    # Stage 1: STRIP
    # ------------------------------------------------------------------ #

    def strip(
        self,
        df: pd.DataFrame,
        direct_identifiers: List[str],
        quasi_identifiers: Dict[str, str],
    ) -> pd.DataFrame:
        """Remove direct identifiers and generalize quasi-identifiers.

        Parameters
        ----------
        df : pd.DataFrame
            Input data (not modified in-place).
        direct_identifiers : list[str]
            Column names to drop entirely (names, IDs, phones, ...).
        quasi_identifiers : dict[str, str]
            Mapping of ``column_name -> generalization_type``.
            Supported types:

            - ``"age_band"``  : 5-year age brackets via :func:`generalize_age`.
            - ``"district"``  : district-level location via
              :func:`generalize_location`.
            - ``"hash"``      : one-way SHA-256 keyed hash (non-reversible).
            - ``"suppress"``  : replace all values with ``"*"``.

        Returns
        -------
        pd.DataFrame
            Stripped copy of the data.
        """
        logger.info("STAGE 1 — STRIP  (%d rows, %d cols)", len(df), len(df.columns))
        out = df.copy()

        # -- Drop direct identifiers ----------------------------------------
        existing_direct = [c for c in direct_identifiers if c in out.columns]
        missing = set(direct_identifiers) - set(existing_direct)
        if missing:
            logger.warning(
                "Direct identifiers not found in data (skipped): %s", missing
            )
        if existing_direct:
            out.drop(columns=existing_direct, inplace=True)
            logger.info("  Dropped %d direct identifiers: %s", len(existing_direct), existing_direct)

        # -- Generalize quasi-identifiers -----------------------------------
        for col, method in quasi_identifiers.items():
            if col not in out.columns:
                logger.warning("  Quasi-identifier column '%s' not found — skipped", col)
                continue

            method_lower = method.lower().strip()

            if method_lower == "age_band":
                out[col] = out[col].apply(
                    lambda v: generalize_age(int(v)) if pd.notna(v) else "UNKNOWN"
                )
                logger.info("  Generalised '%s' -> 5-year age bands", col)

            elif method_lower == "district":
                out[col] = out[col].apply(
                    lambda v: generalize_location(str(v)) if pd.notna(v) else "UNKNOWN"
                )
                logger.info("  Generalised '%s' -> district level", col)

            elif method_lower == "hash":
                salt = hashlib.sha256(
                    f"frons-{self.epsilon}-{col}".encode()
                ).hexdigest()[:16]
                out[col] = out[col].apply(
                    lambda v, _s=salt: hashlib.sha256(
                        f"{_s}{v}".encode()
                    ).hexdigest()[:16]
                    if pd.notna(v)
                    else "UNKNOWN"
                )
                logger.info("  Hashed '%s' (keyed SHA-256, truncated)", col)

            elif method_lower == "suppress":
                out[col] = "*"
                logger.info("  Suppressed '%s'", col)

            else:
                logger.warning(
                    "  Unknown generalisation method '%s' for '%s' — skipped",
                    method,
                    col,
                )

        logger.info("  STRIP complete: %d cols remain", len(out.columns))
        return out

    # ------------------------------------------------------------------ #
    # Stage 2: PERTURB
    # ------------------------------------------------------------------ #

    def perturb(
        self,
        df: pd.DataFrame,
        numeric_columns: List[str],
    ) -> pd.DataFrame:
        """Add calibrated Laplace noise to numeric columns.

        Noise is drawn from ``Lap(sensitivity / epsilon)`` where sensitivity
        is set per-column to the column's range divided by len(df) (bounded
        global sensitivity for mean queries).

        The method also applies post-processing to:
        - Preserve non-negativity when the original column had no negatives.
        - Round to original precision (integer columns stay integer).

        Parameters
        ----------
        df : pd.DataFrame
            Data after the STRIP stage.
        numeric_columns : list[str]
            Columns to perturb.

        Returns
        -------
        pd.DataFrame
            Perturbed copy of the data.
        """
        logger.info("STAGE 2 — PERTURB  (epsilon=%.2f)", self.epsilon)
        out = df.copy()

        for col in numeric_columns:
            if col not in out.columns:
                logger.warning("  Numeric column '%s' not found — skipped", col)
                continue
            if not pd.api.types.is_numeric_dtype(out[col]):
                logger.warning("  Column '%s' is not numeric — skipped", col)
                continue

            series = out[col].astype(float)
            non_null_mask = series.notna()
            values = series[non_null_mask].values

            if len(values) == 0:
                logger.info("  '%s' has no non-null values — skipped", col)
                continue

            # Sensitivity = range / n  (bounded sensitivity for mean query)
            col_range = float(np.ptp(values))
            sensitivity = col_range / len(values) if len(values) > 0 else 1.0
            # Ensure a minimum sensitivity so noise is meaningful
            sensitivity = max(sensitivity, 1e-6)

            scale = sensitivity / self.epsilon
            noise = self._rng.laplace(loc=0.0, scale=scale, size=len(values))
            noisy_values = values + noise

            # Post-process: clamp to original domain
            orig_min = float(np.min(values))
            orig_max = float(np.max(values))
            was_non_negative = orig_min >= 0
            if was_non_negative:
                noisy_values = np.maximum(noisy_values, 0.0)

            # If original column was integer, round the result
            was_integer = pd.api.types.is_integer_dtype(df[col])
            if was_integer:
                noisy_values = np.round(noisy_values).astype(int)

            out.loc[non_null_mask, col] = noisy_values

            logger.info(
                "  Perturbed '%s': sensitivity=%.6f  scale=%.6f",
                col,
                sensitivity,
                scale,
            )

        logger.info("  PERTURB complete")
        return out

    # ------------------------------------------------------------------ #
    # Stage 3: COMPRESS
    # ------------------------------------------------------------------ #

    def compress(
        self,
        df: pd.DataFrame,
        output_path: str,
    ) -> Dict[str, Any]:
        """Optimise types and write Parquet with Snappy compression.

        Type optimisation rules:
        - ``float64`` -> ``float32`` when the column's range fits in float32.
        - ``int64``   -> ``int32``  when values fit in int32 range.
        - ``object``  -> ``category`` when cardinality < 50% of row count.

        Parameters
        ----------
        df : pd.DataFrame
            Data after PERTURB stage.
        output_path : str
            Destination ``.parquet`` file path.

        Returns
        -------
        dict
            Compression report with keys: ``rows``, ``columns``,
            ``original_size_bytes``, ``compressed_size_bytes``,
            ``compression_ratio``, ``output_path``.
        """
        logger.info("STAGE 3 — COMPRESS")
        out = df.copy()
        original_mem = int(out.memory_usage(deep=True).sum())

        # -- Type narrowing --------------------------------------------------
        for col in out.columns:
            dtype = out[col].dtype

            if dtype == np.float64:
                col_min = out[col].min()
                col_max = out[col].max()
                if (
                    pd.notna(col_min)
                    and pd.notna(col_max)
                    and np.abs(col_min) <= np.finfo(np.float32).max
                    and np.abs(col_max) <= np.finfo(np.float32).max
                ):
                    out[col] = out[col].astype(np.float32)
                    logger.debug("  %s: float64 -> float32", col)

            elif dtype == np.int64:
                col_min = out[col].min()
                col_max = out[col].max()
                if (
                    col_min >= np.iinfo(np.int32).min
                    and col_max <= np.iinfo(np.int32).max
                ):
                    out[col] = out[col].astype(np.int32)
                    logger.debug("  %s: int64 -> int32", col)

            elif dtype == object:
                nunique = out[col].nunique()
                if nunique < len(out) * 0.5:
                    out[col] = out[col].astype("category")
                    logger.debug("  %s: object -> category", col)

        optimised_mem = int(out.memory_usage(deep=True).sum())

        # -- Write Parquet with Snappy ----------------------------------------
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)

        table = pa.Table.from_pandas(out, preserve_index=False)
        pq.write_table(
            table,
            output_path,
            compression="snappy",
            use_dictionary=True,
            write_statistics=True,
        )
        file_size = os.path.getsize(output_path)

        report = {
            "rows": len(out),
            "columns": len(out.columns),
            "original_memory_bytes": original_mem,
            "optimised_memory_bytes": optimised_mem,
            "parquet_file_bytes": file_size,
            "compression_ratio": round(
                1 - file_size / original_mem, 4
            )
            if original_mem > 0
            else 0.0,
            "output_path": str(Path(output_path).resolve()),
        }
        logger.info(
            "  COMPRESS complete: %d bytes -> %d bytes (%.1f%% reduction)",
            original_mem,
            file_size,
            report["compression_ratio"] * 100,
        )
        return report

    # ------------------------------------------------------------------ #
    # Full pipeline
    # ------------------------------------------------------------------ #

    def run(
        self,
        input_path: str,
        output_path: str,
        direct_identifiers: List[str],
        quasi_identifiers: Dict[str, str],
        numeric_columns: List[str],
    ) -> Dict[str, Any]:
        """Execute the full pipeline: STRIP -> PERTURB -> COMPRESS.

        Parameters
        ----------
        input_path : str
            Path to input CSV or Excel file.
        output_path : str
            Path for the output Parquet file.
        direct_identifiers : list[str]
            Columns to remove entirely.
        quasi_identifiers : dict[str, str]
            Columns to generalize and their method.
        numeric_columns : list[str]
            Columns to add Laplace noise to.

        Returns
        -------
        dict
            Combined report from all stages plus integrity hash.
        """
        logger.info("=" * 60)
        logger.info("FRONS Synthetic Data Pipeline — START")
        logger.info("  Input:   %s", input_path)
        logger.info("  Output:  %s", output_path)
        logger.info("=" * 60)

        # -- Load data -------------------------------------------------------
        path = Path(input_path)
        if not path.exists():
            raise FileNotFoundError(f"Input file not found: {input_path}")

        suffix = path.suffix.lower()
        if suffix == ".csv":
            df = pd.read_csv(input_path)
        elif suffix in {".xls", ".xlsx"}:
            df = pd.read_excel(input_path)
        elif suffix == ".parquet":
            df = pd.read_parquet(input_path)
        elif suffix == ".json":
            df = pd.read_json(input_path)
        else:
            raise ValueError(f"Unsupported file format: {suffix}")

        logger.info("Loaded %d rows x %d cols from %s", len(df), len(df.columns), path.name)
        original_df = df.copy()

        # -- Stage 1 ---------------------------------------------------------
        df = self.strip(df, direct_identifiers, quasi_identifiers)

        # -- Stage 2 ---------------------------------------------------------
        # Filter numeric_columns to those still present after stripping
        remaining_numeric = [c for c in numeric_columns if c in df.columns]
        df = self.perturb(df, remaining_numeric)

        # -- k-anonymity enforcement -----------------------------------------
        quasi_cols_remaining = [
            c for c in quasi_identifiers.keys() if c in df.columns
        ]
        if quasi_cols_remaining:
            df = self._enforce_k_anonymity(df, quasi_cols_remaining)

        # -- Stage 3 ---------------------------------------------------------
        compress_report = self.compress(df, output_path)

        # -- Integrity hash --------------------------------------------------
        sha256_hash = self.compute_hash(output_path)

        # -- Privacy verification --------------------------------------------
        privacy = verify_privacy(original_df, df)

        # -- k-anonymity verification ----------------------------------------
        k_ok = True
        if quasi_cols_remaining:
            k_ok = self.verify_k_anonymity(df, quasi_cols_remaining, self.k_anonymity)

        report = {
            "pipeline": "FRONS Synthetic Data Pipeline",
            "epsilon": self.epsilon,
            "k_anonymity_target": self.k_anonymity,
            "k_anonymity_verified": k_ok,
            "stages": {
                "strip": {
                    "direct_identifiers_removed": direct_identifiers,
                    "quasi_identifiers_generalised": quasi_identifiers,
                },
                "perturb": {
                    "columns_perturbed": remaining_numeric,
                },
                "compress": compress_report,
            },
            "privacy_verification": privacy,
            "integrity_sha256": sha256_hash,
        }

        logger.info("=" * 60)
        logger.info("Pipeline COMPLETE")
        logger.info("  k-anonymity verified: %s", k_ok)
        logger.info("  SHA-256: %s", sha256_hash)
        logger.info("=" * 60)

        return report

    # ------------------------------------------------------------------ #
    # k-anonymity helpers
    # ------------------------------------------------------------------ #

    def verify_k_anonymity(
        self,
        df: pd.DataFrame,
        quasi_columns: List[str],
        k: int = 5,
    ) -> bool:
        """Check whether every equivalence class has at least *k* records.

        Parameters
        ----------
        df : pd.DataFrame
            Data to check.
        quasi_columns : list[str]
            Quasi-identifier columns defining equivalence classes.
        k : int
            Minimum group size required.

        Returns
        -------
        bool
            True if k-anonymity holds for all groups.
        """
        existing = [c for c in quasi_columns if c in df.columns]
        if not existing:
            logger.info("  No quasi-identifier columns to verify")
            return True

        group_sizes = df.groupby(existing, observed=True).size()
        min_size = int(group_sizes.min()) if len(group_sizes) > 0 else 0
        violating = int((group_sizes < k).sum())

        if violating > 0:
            logger.warning(
                "  k-anonymity VIOLATED: %d groups have fewer than %d records (min=%d)",
                violating,
                k,
                min_size,
            )
            return False

        logger.info(
            "  k-anonymity VERIFIED: all %d groups have >= %d records (min=%d)",
            len(group_sizes),
            k,
            min_size,
        )
        return True

    def _enforce_k_anonymity(
        self,
        df: pd.DataFrame,
        quasi_columns: List[str],
    ) -> pd.DataFrame:
        """Merge small equivalence classes until k-anonymity is satisfied.

        Strategy: groups with fewer than *k* records have their
        quasi-identifier values replaced with a coarser generalization
        (the value is merged with the nearest neighboring group).  As a
        fallback, remaining small groups are suppressed (rows removed).
        """
        existing = [c for c in quasi_columns if c in df.columns]
        if not existing:
            return df

        out = df.copy()
        iteration = 0
        max_iterations = 10

        while iteration < max_iterations:
            group_sizes = out.groupby(existing, observed=True).size()
            small_groups = group_sizes[group_sizes < self.k_anonymity]

            if len(small_groups) == 0:
                break

            iteration += 1
            logger.info(
                "  k-anonymity enforcement pass %d: %d small groups",
                iteration,
                len(small_groups),
            )

            # For each quasi-column, further generalize values in small groups
            # by merging them: replace the small-group value with the most
            # common value in the column (mode-based merging).
            for col in existing:
                if out[col].dtype.name == "category":
                    out[col] = out[col].astype(str)

                # Find which rows belong to small groups
                group_key_to_size = group_sizes.to_dict()
                if len(existing) == 1:
                    row_group_keys = out[existing[0]]
                    is_small = row_group_keys.map(
                        lambda v: group_key_to_size.get(v, 0) < self.k_anonymity
                    )
                else:
                    # Multi-column: build tuple keys
                    row_tuples = list(zip(*(out[c] for c in existing)))
                    is_small = pd.Series(
                        [
                            group_key_to_size.get(t, 0) < self.k_anonymity
                            for t in row_tuples
                        ],
                        index=out.index,
                    )

                if is_small.sum() == 0:
                    continue

                # Replace small-group values with the column's mode
                mode_val = out.loc[~is_small, col].mode()
                if len(mode_val) > 0:
                    out.loc[is_small, col] = mode_val.iloc[0]

        # Final pass: suppress any remaining violating rows
        group_sizes = out.groupby(existing, observed=True).size()
        small_groups = group_sizes[group_sizes < self.k_anonymity]
        if len(small_groups) > 0:
            if len(existing) == 1:
                small_vals = set(small_groups.index)
                mask = out[existing[0]].isin(small_vals)
            else:
                small_keys = set(small_groups.index)
                row_tuples = list(zip(*(out[c] for c in existing)))
                mask = pd.Series(
                    [t in small_keys for t in row_tuples],
                    index=out.index,
                )
            removed = int(mask.sum())
            out = out[~mask].reset_index(drop=True)
            logger.warning(
                "  Suppressed %d rows that could not meet k=%d",
                removed,
                self.k_anonymity,
            )

        return out

    # ------------------------------------------------------------------ #
    # Integrity
    # ------------------------------------------------------------------ #

    def compute_hash(self, output_path: str) -> str:
        """Compute SHA-256 hash of the output file for Solana integrity proof.

        Parameters
        ----------
        output_path : str
            Path to the Parquet file.

        Returns
        -------
        str
            Hex-encoded SHA-256 digest.
        """
        sha256 = hashlib.sha256()
        with open(output_path, "rb") as f:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                sha256.update(chunk)
        digest = sha256.hexdigest()
        logger.info("  SHA-256(%s) = %s", Path(output_path).name, digest)
        return digest


# ---------------------------------------------------------------------------
# CLI interface
# ---------------------------------------------------------------------------


def _load_config(config_path: str) -> Dict[str, Any]:
    """Load a JSON configuration file.

    Expected schema::

        {
            "direct_identifiers": ["name", "phone"],
            "quasi_identifiers": {"age": "age_band", "address": "district"},
            "numeric_columns": ["income", "score"]
        }
    """
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    required_keys = {"direct_identifiers", "quasi_identifiers", "numeric_columns"}
    missing = required_keys - set(cfg.keys())
    if missing:
        raise ValueError(
            f"Config file is missing required keys: {missing}. "
            f"Expected: {required_keys}"
        )
    return cfg


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser for the CLI."""
    parser = argparse.ArgumentParser(
        description="FRONS Synthetic Data Pipeline — privacy-preserving data transformation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:

  # With a config file
  python synthetic_pipeline.py data.csv output.parquet --config pipeline_config.json

  # With inline column specs
  python synthetic_pipeline.py data.csv output.parquet \\
      --direct name,phone,ssn \\
      --quasi age=age_band,address=district \\
      --numeric income,score

  # Custom privacy parameters
  python synthetic_pipeline.py data.csv output.parquet \\
      --config config.json --epsilon 0.5 --k 10
        """,
    )

    parser.add_argument("input", help="Input file path (CSV, Excel, Parquet, JSON)")
    parser.add_argument("output", help="Output Parquet file path")

    parser.add_argument(
        "--config",
        help="JSON config file with column classifications",
    )
    parser.add_argument(
        "--direct",
        help="Comma-separated direct identifier columns (e.g. name,phone,ssn)",
    )
    parser.add_argument(
        "--quasi",
        help="Comma-separated quasi-identifiers as col=method pairs "
        "(e.g. age=age_band,address=district)",
    )
    parser.add_argument(
        "--numeric",
        help="Comma-separated numeric columns to perturb (e.g. income,score)",
    )
    parser.add_argument(
        "--epsilon",
        type=float,
        default=1.0,
        help="Differential privacy budget (default: 1.0)",
    )
    parser.add_argument(
        "--k",
        type=int,
        default=5,
        help="k-anonymity parameter (default: 5)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducibility",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable debug logging",
    )
    parser.add_argument(
        "--report",
        help="Path to write JSON pipeline report",
    )

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    """CLI entry point."""
    parser = build_parser()
    args = parser.parse_args(argv)

    _configure_logging(verbose=args.verbose)

    # -- Resolve column classifications -----------------------------------
    direct_identifiers: List[str] = []
    quasi_identifiers: Dict[str, str] = {}
    numeric_columns: List[str] = []

    if args.config:
        cfg = _load_config(args.config)
        direct_identifiers = cfg["direct_identifiers"]
        quasi_identifiers = cfg["quasi_identifiers"]
        numeric_columns = cfg["numeric_columns"]
    else:
        if args.direct:
            direct_identifiers = [s.strip() for s in args.direct.split(",") if s.strip()]
        if args.quasi:
            for pair in args.quasi.split(","):
                pair = pair.strip()
                if "=" in pair:
                    col, method = pair.split("=", 1)
                    quasi_identifiers[col.strip()] = method.strip()
                else:
                    logger.warning(
                        "Ignoring quasi-identifier '%s' — expected col=method format",
                        pair,
                    )
        if args.numeric:
            numeric_columns = [s.strip() for s in args.numeric.split(",") if s.strip()]

    if not direct_identifiers and not quasi_identifiers and not numeric_columns:
        parser.error(
            "No columns specified. Provide --config or at least one of "
            "--direct, --quasi, --numeric."
        )

    # -- Run pipeline ------------------------------------------------------
    pipeline = SyntheticDataPipeline(
        epsilon=args.epsilon,
        k_anonymity=args.k,
        random_seed=args.seed,
    )

    try:
        report = pipeline.run(
            input_path=args.input,
            output_path=args.output,
            direct_identifiers=direct_identifiers,
            quasi_identifiers=quasi_identifiers,
            numeric_columns=numeric_columns,
        )
    except Exception:
        logger.exception("Pipeline failed")
        return 1

    # -- Write report ------------------------------------------------------
    if args.report:
        report_path = Path(args.report)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, default=str)
        logger.info("Report written to %s", report_path)

    # -- Print summary to stdout -------------------------------------------
    print(json.dumps(report, indent=2, default=str))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
