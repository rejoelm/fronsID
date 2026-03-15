"""
FRONS Evidence Cascade — 4-tier search orchestrator.

ADR-1: Evidence cascade searches Fronsciers first because that earns authors
money. External sources (PubMed, Scopus) are fallbacks. Honest admission
("insufficient evidence") is the final tier. This ordering is non-negotiable
— it is the core monetization mechanism.

Tier 1: Fronsciers (Supabase full-text search)
Tier 2: PubMed (NCBI E-utilities API)
Tier 3: Scopus (Elsevier API)
Tier 4: Honest Admission

Credits charged:
  - Tier 1 only:  3 credits ($0.03)
  - Tier 1+2:     5 credits ($0.05)
  - Tier 1+2+3:   7 credits ($0.07)
  - Honest admit: 3 credits ($0.03)
"""

import logging
import os
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("frons.cascade")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
PUBMED_API_KEY: str = os.getenv("PUBMED_API_KEY", "")
SCOPUS_API_KEY: str = os.getenv("SCOPUS_API_KEY", "")

PUBMED_ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
SCOPUS_SEARCH_URL = "https://api.elsevier.com/content/search/scopus"

# Confidence thresholds
TIER1_CONFIDENCE_THRESHOLD = 0.7  # Fronsciers results sufficient
TIER2_CONFIDENCE_THRESHOLD = 0.5  # PubMed adds enough confidence
TIER3_CONFIDENCE_THRESHOLD = 0.3  # Scopus provides minimal evidence

# Credit costs per tier depth
TIER_CREDITS = {
    1: 3,   # Fronsciers only
    2: 5,   # + PubMed
    3: 7,   # + Scopus
    4: 3,   # Honest admission (still costs credits for compute)
}

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------


@dataclass
class Source:
    """A single evidence source from any tier."""
    title: str
    url: Optional[str] = None
    doci: Optional[str] = None
    pubmed_id: Optional[str] = None
    scopus_id: Optional[str] = None
    abstract: Optional[str] = None
    authors: Optional[list] = None
    journal: Optional[str] = None
    year: Optional[str] = None
    tier: int = 1
    relevance_score: float = 0.0


@dataclass
class CascadeResult:
    """Result from the evidence cascade."""
    confidence_score: float = 0.0
    sources: list[Source] = field(default_factory=list)
    credits_charged: int = 0
    is_honest_admission: bool = False
    tiers_searched: list[int] = field(default_factory=list)
    honest_admission_reason: Optional[str] = None
    summary: Optional[str] = None


# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------


def _supabase_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


def _rest_url(table: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{table}"


def _rpc_url(function_name: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/rpc/{function_name}"


# ---------------------------------------------------------------------------
# Tier 1: Search Fronsciers (Supabase)
# ---------------------------------------------------------------------------


async def _search_fronsciers(
    query: str,
    client: httpx.AsyncClient,
    limit: int = 10,
) -> list[Source]:
    """Search the Fronsciers database via Supabase full-text search."""
    logger.info("Tier 1: Searching Fronsciers for %r", query)

    try:
        # Try RPC function first
        resp = await client.post(
            _rpc_url("search_articles"),
            headers=_supabase_headers(),
            json={"search_query": query, "result_limit": limit},
        )

        # Fall back to REST query
        if resp.status_code == 404:
            resp = await client.get(
                _rest_url("articles"),
                headers=_supabase_headers(),
                params={
                    "select": "doci,title,abstract,authors,field_of_study,"
                              "citation_count,impact_score,publication_date",
                    "fts": f"fts.wfts.{query}",
                    "status": "eq.published",
                    "order": "impact_score.desc,citation_count.desc",
                    "limit": str(limit),
                },
            )

        if resp.status_code != 200:
            logger.warning("Fronsciers search returned HTTP %d", resp.status_code)
            return []

        articles = resp.json()
        sources = []
        for i, a in enumerate(articles):
            # Simple relevance heuristic based on position and impact
            position_score = max(0, 1.0 - (i * 0.1))
            impact = float(a.get("impact_score", 0))
            citations = int(a.get("citation_count", 0))
            relevance = position_score * 0.5 + min(impact / 100, 0.3) + min(citations / 50, 0.2)

            sources.append(Source(
                title=a.get("title", "Untitled"),
                doci=a.get("doci"),
                url=f"https://fronsciers.id/article/{a.get('doci', '')}",
                abstract=(a.get("abstract") or "")[:500],
                authors=a.get("authors"),
                year=a.get("publication_date", "")[:4] if a.get("publication_date") else None,
                tier=1,
                relevance_score=round(relevance, 3),
            ))

        logger.info("Tier 1: Found %d Fronsciers results", len(sources))
        return sources

    except Exception as exc:
        logger.error("Tier 1 Fronsciers search failed: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Tier 2: Search PubMed (NCBI E-utilities)
# ---------------------------------------------------------------------------


async def _search_pubmed(
    query: str,
    client: httpx.AsyncClient,
    limit: int = 10,
) -> list[Source]:
    """Search PubMed via NCBI E-utilities API."""
    logger.info("Tier 2: Searching PubMed for %r", query)

    try:
        # Step 1: ESearch to get PMIDs
        esearch_params: dict[str, str] = {
            "db": "pubmed",
            "term": query,
            "retmode": "json",
            "retmax": str(limit),
            "sort": "relevance",
        }
        if PUBMED_API_KEY:
            esearch_params["api_key"] = PUBMED_API_KEY

        search_resp = await client.get(
            PUBMED_ESEARCH_URL,
            params=esearch_params,
            timeout=15.0,
        )
        if search_resp.status_code != 200:
            logger.warning("PubMed ESearch returned HTTP %d", search_resp.status_code)
            return []

        search_data = search_resp.json()
        id_list = search_data.get("esearchresult", {}).get("idlist", [])

        if not id_list:
            logger.info("Tier 2: No PubMed results")
            return []

        # Step 2: EFetch to get article details
        efetch_params: dict[str, str] = {
            "db": "pubmed",
            "id": ",".join(id_list),
            "retmode": "xml",
            "rettype": "abstract",
        }
        if PUBMED_API_KEY:
            efetch_params["api_key"] = PUBMED_API_KEY

        fetch_resp = await client.get(
            PUBMED_EFETCH_URL,
            params=efetch_params,
            timeout=15.0,
        )
        if fetch_resp.status_code != 200:
            logger.warning("PubMed EFetch returned HTTP %d", fetch_resp.status_code)
            return []

        # Parse XML response
        sources = _parse_pubmed_xml(fetch_resp.text)
        logger.info("Tier 2: Found %d PubMed results", len(sources))
        return sources

    except Exception as exc:
        logger.error("Tier 2 PubMed search failed: %s", exc)
        return []


def _parse_pubmed_xml(xml_text: str) -> list[Source]:
    """Parse PubMed EFetch XML into Source objects."""
    sources: list[Source] = []

    try:
        root = ET.fromstring(xml_text)
        for i, article_el in enumerate(root.findall(".//PubmedArticle")):
            medline = article_el.find("MedlineCitation")
            if medline is None:
                continue

            pmid_el = medline.find("PMID")
            pmid = pmid_el.text if pmid_el is not None else None

            article = medline.find("Article")
            if article is None:
                continue

            # Title
            title_el = article.find("ArticleTitle")
            title = title_el.text if title_el is not None else "Untitled"

            # Abstract
            abstract_parts = []
            abstract_el = article.find("Abstract")
            if abstract_el is not None:
                for text_el in abstract_el.findall("AbstractText"):
                    if text_el.text:
                        label = text_el.get("Label", "")
                        prefix = f"{label}: " if label else ""
                        abstract_parts.append(f"{prefix}{text_el.text}")
            abstract = " ".join(abstract_parts)[:500]

            # Authors
            authors = []
            author_list = article.find("AuthorList")
            if author_list is not None:
                for author_el in author_list.findall("Author"):
                    last = author_el.findtext("LastName", "")
                    first = author_el.findtext("ForeName", "")
                    if last:
                        authors.append(f"{last} {first}".strip())

            # Journal
            journal_el = article.find("Journal/Title")
            journal = journal_el.text if journal_el is not None else None

            # Year
            pub_date = article.find("Journal/JournalIssue/PubDate")
            year = None
            if pub_date is not None:
                year_el = pub_date.find("Year")
                year = year_el.text if year_el is not None else None

            # Relevance score based on position
            relevance = round(max(0, 0.8 - (i * 0.08)), 3)

            sources.append(Source(
                title=title or "Untitled",
                pubmed_id=pmid,
                url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else None,
                abstract=abstract,
                authors=authors[:5],  # Limit to first 5 authors
                journal=journal,
                year=year,
                tier=2,
                relevance_score=relevance,
            ))

    except ET.ParseError as exc:
        logger.error("Failed to parse PubMed XML: %s", exc)

    return sources


# ---------------------------------------------------------------------------
# Tier 3: Search Scopus (Elsevier API)
# ---------------------------------------------------------------------------


async def _search_scopus(
    query: str,
    client: httpx.AsyncClient,
    limit: int = 10,
) -> list[Source]:
    """Search Scopus via the Elsevier API."""
    logger.info("Tier 3: Searching Scopus for %r", query)

    if not SCOPUS_API_KEY:
        logger.warning("Tier 3: SCOPUS_API_KEY not configured, skipping")
        return []

    try:
        resp = await client.get(
            SCOPUS_SEARCH_URL,
            headers={
                "X-ELS-APIKey": SCOPUS_API_KEY,
                "Accept": "application/json",
            },
            params={
                "query": f"TITLE-ABS-KEY({query})",
                "count": str(limit),
                "sort": "relevancy",
                "field": "dc:title,dc:creator,prism:coverDate,prism:publicationName,"
                         "dc:description,dc:identifier,citedby-count,eid",
            },
            timeout=15.0,
        )

        if resp.status_code != 200:
            logger.warning("Scopus search returned HTTP %d", resp.status_code)
            return []

        data = resp.json()
        entries = data.get("search-results", {}).get("entry", [])

        if not entries or (len(entries) == 1 and entries[0].get("@_fa") == "false"):
            logger.info("Tier 3: No Scopus results")
            return []

        sources = []
        for i, entry in enumerate(entries):
            scopus_id = entry.get("dc:identifier", "").replace("SCOPUS_ID:", "")
            eid = entry.get("eid", "")
            title = entry.get("dc:title", "Untitled")

            # Extract year from cover date
            cover_date = entry.get("prism:coverDate", "")
            year = cover_date[:4] if cover_date else None

            # Build Scopus URL
            url = None
            for link in entry.get("link", []):
                if link.get("@ref") == "scopus":
                    url = link.get("@href")
                    break

            relevance = round(max(0, 0.6 - (i * 0.06)), 3)

            sources.append(Source(
                title=title,
                scopus_id=scopus_id or eid,
                url=url,
                abstract=(entry.get("dc:description") or "")[:500],
                authors=[entry.get("dc:creator", "Unknown")],
                journal=entry.get("prism:publicationName"),
                year=year,
                tier=3,
                relevance_score=relevance,
            ))

        logger.info("Tier 3: Found %d Scopus results", len(sources))
        return sources

    except Exception as exc:
        logger.error("Tier 3 Scopus search failed: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Confidence scoring
# ---------------------------------------------------------------------------


def _compute_confidence(sources: list[Source]) -> float:
    """Compute overall confidence score from available sources.

    Factors:
    - Number of sources
    - Source relevance scores
    - Tier diversity (Fronsciers weighted highest)
    - Cross-tier corroboration
    """
    if not sources:
        return 0.0

    # Weighted relevance sum — Fronsciers sources weighted 2x
    weighted_sum = 0.0
    for s in sources:
        weight = 2.0 if s.tier == 1 else 1.0
        weighted_sum += s.relevance_score * weight

    # Normalize by max possible (if all sources were perfect tier-1)
    max_possible = len(sources) * 2.0
    base_score = min(weighted_sum / max_possible, 1.0)

    # Bonus for multiple tiers (cross-corroboration)
    tiers_present = set(s.tier for s in sources)
    tier_bonus = len(tiers_present) * 0.05

    # Bonus for having enough sources
    count_bonus = min(len(sources) / 10, 0.15)

    confidence = min(base_score + tier_bonus + count_bonus, 1.0)
    return round(confidence, 3)


# ---------------------------------------------------------------------------
# Main cascade orchestrator
# ---------------------------------------------------------------------------


async def evidence_cascade(question: str, user_id: str) -> dict:
    """Execute the 4-tier evidence cascade for a research question.

    The cascade searches sources in order of priority (ADR-1):
      1. Fronsciers — earns authors money, always searched first
      2. PubMed — largest biomedical literature database
      3. Scopus — broadest academic database
      4. Honest Admission — if insufficient evidence exists

    Args:
        question: The research question to answer.
        user_id: The user's wallet address or ID (for credit charging).

    Returns:
        dict with confidence_score, sources, credits_charged,
        is_honest_admission flag, and tiers_searched.
    """
    logger.info("Evidence cascade started: question=%r  user=%s", question[:80], user_id)

    result = CascadeResult()
    all_sources: list[Source] = []

    async with httpx.AsyncClient() as client:
        # --- Tier 1: Fronsciers ---
        result.tiers_searched.append(1)
        tier1_sources = await _search_fronsciers(question, client)
        all_sources.extend(tier1_sources)

        confidence = _compute_confidence(all_sources)
        logger.info("After Tier 1: %d sources, confidence=%.3f", len(all_sources), confidence)

        if confidence >= TIER1_CONFIDENCE_THRESHOLD:
            result.confidence_score = confidence
            result.sources = all_sources
            result.credits_charged = TIER_CREDITS[1]
            result.summary = (
                f"Found {len(tier1_sources)} relevant articles in the Fronsciers library. "
                f"Confidence: {confidence:.0%}."
            )
            return _cascade_result_to_dict(result)

        # --- Tier 2: PubMed ---
        result.tiers_searched.append(2)
        tier2_sources = await _search_pubmed(question, client)
        all_sources.extend(tier2_sources)

        confidence = _compute_confidence(all_sources)
        logger.info("After Tier 2: %d sources, confidence=%.3f", len(all_sources), confidence)

        if confidence >= TIER2_CONFIDENCE_THRESHOLD:
            result.confidence_score = confidence
            result.sources = all_sources
            result.credits_charged = TIER_CREDITS[2]
            result.summary = (
                f"Found {len(tier1_sources)} Fronsciers and {len(tier2_sources)} PubMed articles. "
                f"Confidence: {confidence:.0%}."
            )
            return _cascade_result_to_dict(result)

        # --- Tier 3: Scopus ---
        result.tiers_searched.append(3)
        tier3_sources = await _search_scopus(question, client)
        all_sources.extend(tier3_sources)

        confidence = _compute_confidence(all_sources)
        logger.info("After Tier 3: %d sources, confidence=%.3f", len(all_sources), confidence)

        if confidence >= TIER3_CONFIDENCE_THRESHOLD:
            result.confidence_score = confidence
            result.sources = all_sources
            result.credits_charged = TIER_CREDITS[3]
            result.summary = (
                f"Found {len(tier1_sources)} Fronsciers, {len(tier2_sources)} PubMed, "
                f"and {len(tier3_sources)} Scopus articles. Confidence: {confidence:.0%}."
            )
            return _cascade_result_to_dict(result)

        # --- Tier 4: Honest Admission ---
        result.tiers_searched.append(4)
        result.is_honest_admission = True
        result.confidence_score = confidence
        result.sources = all_sources  # Return whatever we found, even if low confidence
        result.credits_charged = TIER_CREDITS[4]

        if not all_sources:
            result.honest_admission_reason = (
                "No relevant peer-reviewed evidence was found across Fronsciers, "
                "PubMed, or Scopus for this question. This does not mean no evidence "
                "exists — it may not yet be indexed in these databases."
            )
        else:
            result.honest_admission_reason = (
                f"Found {len(all_sources)} articles across {len(result.tiers_searched) - 1} databases, "
                f"but confidence ({confidence:.0%}) is below the threshold for a reliable answer. "
                f"The sources below may be partially relevant but should not be treated as "
                f"definitive evidence for this specific question."
            )

        result.summary = result.honest_admission_reason
        logger.info("Tier 4: Honest admission. confidence=%.3f  sources=%d", confidence, len(all_sources))

        return _cascade_result_to_dict(result)


def _cascade_result_to_dict(result: CascadeResult) -> dict:
    """Convert CascadeResult dataclass to a serializable dict."""
    return {
        "confidence_score": result.confidence_score,
        "sources": [
            {
                "title": s.title,
                "url": s.url,
                "doci": s.doci,
                "pubmed_id": s.pubmed_id,
                "scopus_id": s.scopus_id,
                "abstract": s.abstract,
                "authors": s.authors,
                "journal": s.journal,
                "year": s.year,
                "tier": s.tier,
                "tier_name": {1: "Fronsciers", 2: "PubMed", 3: "Scopus"}.get(s.tier, "Unknown"),
                "relevance_score": s.relevance_score,
            }
            for s in result.sources
        ],
        "credits_charged": result.credits_charged,
        "is_honest_admission": result.is_honest_admission,
        "honest_admission_reason": result.honest_admission_reason,
        "tiers_searched": result.tiers_searched,
        "summary": result.summary,
    }
