"""
Evidence Cascade — 4-tier evidence retrieval orchestrator for FRONS.

The cascade searches progressively broader sources and **never fabricates**
references.  Each tier returns sources with confidence scores so the caller
can assess reliability.

Tier 1: FRONS (Fronsciers DB) — authors earn micropayments.
Tier 2: PubMed (NCBI E-utilities) — free, publicly indexed biomedical lit.
Tier 3: Scopus (Elsevier API) — broader multidisciplinary coverage.
Tier 4: Honest admission — "insufficient evidence found".
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from enum import IntEnum
from typing import Optional

import httpx
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_KEY", "")
PUBMED_API_KEY: str = os.environ.get("PUBMED_API_KEY", "")
SCOPUS_API_KEY: str = os.environ.get("SCOPUS_API_KEY", "")

PUBMED_ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
SCOPUS_SEARCH_URL = "https://api.elsevier.com/content/search/scopus"

HTTP_TIMEOUT = 15.0  # seconds


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------


class Tier(IntEnum):
    FRONS = 1
    PUBMED = 2
    SCOPUS = 3
    INSUFFICIENT = 4


@dataclass
class Source:
    """A single evidence source returned by the cascade."""

    title: str
    authors: list[str]
    identifier: str          # DOCI, PMID, or Scopus EID
    source_tier: Tier
    confidence: float        # 0.0 – 1.0
    abstract: str = ""
    url: str = ""
    field: str = ""
    year: Optional[int] = None

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "authors": self.authors,
            "identifier": self.identifier,
            "source_tier": self.source_tier.name,
            "confidence": round(self.confidence, 3),
            "abstract": self.abstract,
            "url": self.url,
            "field": self.field,
            "year": self.year,
        }


@dataclass
class CascadeResult:
    """Aggregated result of an evidence cascade search."""

    query: str
    sources: list[Source] = field(default_factory=list)
    tiers_searched: list[str] = field(default_factory=list)
    highest_tier_with_results: Optional[str] = None
    insufficient_evidence: bool = False

    def to_dict(self) -> dict:
        return {
            "query": self.query,
            "sources": [s.to_dict() for s in self.sources],
            "tiers_searched": self.tiers_searched,
            "highest_tier_with_results": self.highest_tier_with_results,
            "total_sources": len(self.sources),
            "insufficient_evidence": self.insufficient_evidence,
        }


# ---------------------------------------------------------------------------
# Tier 1 — FRONS (Fronsciers DB)
# ---------------------------------------------------------------------------


async def _search_frons(query: str, limit: int = 10) -> list[Source]:
    """Search the FRONS Supabase database.  Authors earn money when their
    articles are later cited through ``cite_and_access``."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []

    sb: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    response = sb.rpc(
        "search_articles",
        {"search_query": query, "result_limit": limit},
    ).execute()

    sources: list[Source] = []
    for row in response.data or []:
        sources.append(
            Source(
                title=row.get("title", ""),
                authors=row.get("authors", []),
                identifier=row.get("doci", ""),
                source_tier=Tier.FRONS,
                confidence=min(float(row.get("relevance_score", 0.5)), 1.0),
                abstract=row.get("abstract", ""),
                url=f"https://frons.pub/article/{row.get('doci', '')}",
                field=row.get("field", ""),
                year=row.get("published_year"),
            )
        )
    return sources


# ---------------------------------------------------------------------------
# Tier 2 — PubMed (NCBI E-utilities)
# ---------------------------------------------------------------------------


async def _search_pubmed(query: str, limit: int = 10) -> list[Source]:
    """Search PubMed via the NCBI E-utilities REST API."""
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        # Step 1 — esearch to get PMIDs
        esearch_params: dict = {
            "db": "pubmed",
            "term": query,
            "retmax": limit,
            "retmode": "json",
            "sort": "relevance",
        }
        if PUBMED_API_KEY:
            esearch_params["api_key"] = PUBMED_API_KEY

        try:
            search_resp = await client.get(PUBMED_ESEARCH_URL, params=esearch_params)
            search_resp.raise_for_status()
        except httpx.HTTPError:
            return []

        search_data = search_resp.json()
        id_list: list[str] = (
            search_data.get("esearchresult", {}).get("idlist", [])
        )
        if not id_list:
            return []

        # Step 2 — efetch to get article details
        efetch_params: dict = {
            "db": "pubmed",
            "id": ",".join(id_list),
            "retmode": "xml",
            "rettype": "abstract",
        }
        if PUBMED_API_KEY:
            efetch_params["api_key"] = PUBMED_API_KEY

        try:
            fetch_resp = await client.get(PUBMED_EFETCH_URL, params=efetch_params)
            fetch_resp.raise_for_status()
        except httpx.HTTPError:
            return []

        return _parse_pubmed_xml(fetch_resp.text)


def _parse_pubmed_xml(xml_text: str) -> list[Source]:
    """Lightweight XML parsing for PubMed efetch results.

    Uses the stdlib ``xml.etree.ElementTree`` to avoid adding lxml as a
    dependency.
    """
    import xml.etree.ElementTree as ET

    sources: list[Source] = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return sources

    for article_el in root.iter("PubmedArticle"):
        medline = article_el.find("MedlineCitation")
        if medline is None:
            continue

        pmid_el = medline.find("PMID")
        pmid = pmid_el.text if pmid_el is not None else ""

        art = medline.find("Article")
        if art is None:
            continue

        title_el = art.find("ArticleTitle")
        title = title_el.text if title_el is not None else ""

        abstract_el = art.find("Abstract/AbstractText")
        abstract = abstract_el.text if abstract_el is not None else ""

        authors: list[str] = []
        author_list = art.find("AuthorList")
        if author_list is not None:
            for author_el in author_list.findall("Author"):
                last = author_el.findtext("LastName", "")
                fore = author_el.findtext("ForeName", "")
                if last:
                    authors.append(f"{last} {fore}".strip())

        year: Optional[int] = None
        year_el = art.find("Journal/JournalIssue/PubDate/Year")
        if year_el is not None and year_el.text:
            try:
                year = int(year_el.text)
            except ValueError:
                pass

        sources.append(
            Source(
                title=title or "",
                authors=authors,
                identifier=f"PMID:{pmid}",
                source_tier=Tier.PUBMED,
                confidence=0.7,  # PubMed results are reliable but not ranked
                abstract=abstract or "",
                url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                year=year,
            )
        )

    return sources


# ---------------------------------------------------------------------------
# Tier 3 — Scopus (Elsevier API)
# ---------------------------------------------------------------------------


async def _search_scopus(query: str, limit: int = 10) -> list[Source]:
    """Search Scopus via the Elsevier API."""
    if not SCOPUS_API_KEY:
        return []

    headers = {
        "X-ELS-APIKey": SCOPUS_API_KEY,
        "Accept": "application/json",
    }
    params = {
        "query": query,
        "count": limit,
        "sort": "relevancy",
    }

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        try:
            resp = await client.get(SCOPUS_SEARCH_URL, headers=headers, params=params)
            resp.raise_for_status()
        except httpx.HTTPError:
            return []

        data = resp.json()

    entries = (
        data.get("search-results", {}).get("entry", [])
    )

    sources: list[Source] = []
    for entry in entries:
        eid = entry.get("eid", "")
        title = entry.get("dc:title", "")
        creator = entry.get("dc:creator", "")
        cover_date = entry.get("prism:coverDate", "")

        year: Optional[int] = None
        if cover_date:
            try:
                year = int(cover_date[:4])
            except (ValueError, IndexError):
                pass

        sources.append(
            Source(
                title=title,
                authors=[creator] if creator else [],
                identifier=f"SCOPUS:{eid}",
                source_tier=Tier.SCOPUS,
                confidence=0.6,
                url=entry.get("prism:url", ""),
                year=year,
            )
        )

    return sources


# ---------------------------------------------------------------------------
# Tier 4 — Honest admission
# ---------------------------------------------------------------------------


def _insufficient_evidence(query: str) -> CascadeResult:
    """Return an honest 'insufficient evidence' result.  Never fabricate."""
    return CascadeResult(
        query=query,
        sources=[],
        tiers_searched=[t.name for t in Tier],
        highest_tier_with_results=None,
        insufficient_evidence=True,
    )


# ---------------------------------------------------------------------------
# Public API — cascade orchestrator
# ---------------------------------------------------------------------------


async def evidence_cascade(
    query: str,
    *,
    min_results: int = 3,
    max_results: int = 10,
    skip_tiers: Optional[list[int]] = None,
) -> CascadeResult:
    """Run the 4-tier evidence cascade for *query*.

    The cascade proceeds through tiers sequentially.  If a tier returns
    at least ``min_results`` sources, the cascade stops early.  Results
    from earlier tiers are always preferred (higher confidence) and are
    never discarded even if later tiers are also searched.

    Args:
        query: The natural-language research question or search terms.
        min_results: Minimum sources needed to stop the cascade early.
        max_results: Cap on total sources returned.
        skip_tiers: Optional list of tier numbers (1–3) to skip.

    Returns:
        A ``CascadeResult`` with aggregated sources and metadata.
    """
    skip = set(skip_tiers or [])
    result = CascadeResult(query=query)

    tier_functions = [
        (Tier.FRONS, _search_frons),
        (Tier.PUBMED, _search_pubmed),
        (Tier.SCOPUS, _search_scopus),
    ]

    for tier, search_fn in tier_functions:
        if tier.value in skip:
            continue

        result.tiers_searched.append(tier.name)

        try:
            sources = await search_fn(query, limit=max_results)
        except Exception:
            # Never crash the cascade; just move to next tier.
            sources = []

        if sources:
            result.sources.extend(sources)
            if result.highest_tier_with_results is None:
                result.highest_tier_with_results = tier.name

            if len(result.sources) >= min_results:
                break

    # Tier 4 — if nothing found at all, be honest.
    if not result.sources:
        result.tiers_searched.append(Tier.INSUFFICIENT.name)
        result.insufficient_evidence = True

    # Cap total results
    result.sources = result.sources[:max_results]

    return result
