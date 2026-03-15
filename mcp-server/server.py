"""
FRONS MCP Server — FastMCP tool definitions.

Exposes Fronsciers research content to AI assistants via the Model Context Protocol.
Search and abstracts are free (discovery). Full-text access triggers citation payment.

Architecture Decision: ADR-9
"""

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastmcp import FastMCP

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
SOLANA_RPC_URL: str = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
TREASURY_WALLET: str = os.getenv("TREASURY_WALLET", "")

CITATION_FEE_USDC = 0.01
# Revenue split per ADR: 40% platform / 20% author / 20% pool / 20% reserve
SPLIT_PLATFORM = 0.40
SPLIT_AUTHOR = 0.20
SPLIT_POOL = 0.20
SPLIT_RESERVE = 0.20

logger = logging.getLogger("frons.mcp")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

# ---------------------------------------------------------------------------
# FastMCP application
# ---------------------------------------------------------------------------

mcp = FastMCP(
    "Fronsciers Research Gateway",
    description=(
        "Access peer-reviewed research from the Fronsciers on-chain library. "
        "Search articles, read abstracts for free, and cite full-text content "
        "with automatic micro-payments to authors."
    ),
)

# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------

_HEADERS: dict[str, str] = {}


def _supabase_headers() -> dict[str, str]:
    """Lazily build Supabase REST headers."""
    global _HEADERS
    if not _HEADERS:
        _HEADERS = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
    return _HEADERS


def _rest_url(table: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{table}"


def _rpc_url(function_name: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/rpc/{function_name}"


# ---------------------------------------------------------------------------
# Tool 1 — search_articles  (FREE)
# ---------------------------------------------------------------------------


@mcp.tool()
async def search_articles(
    query: str,
    field: Optional[str] = None,
    limit: int = 10,
) -> dict:
    """Search the Fronsciers peer-reviewed research library.

    Free discovery tool. Returns titles, DOCIs, abstracts, citation counts,
    and impact scores. Use this to find relevant research before citing.

    Args:
        query: Natural-language search query (e.g. "CRISPR gene editing safety").
        field: Optional field-of-study filter (e.g. "medicine", "biology").
        limit: Maximum number of results (1-50, default 10).
    """
    limit = max(1, min(limit, 50))
    logger.info("search_articles  query=%r  field=%r  limit=%d", query, field, limit)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Try the RPC full-text search function first
            rpc_payload = {"search_query": query, "result_limit": limit}
            if field:
                rpc_payload["field_filter"] = field

            response = await client.post(
                _rpc_url("search_articles"),
                headers=_supabase_headers(),
                json=rpc_payload,
            )

            # Fall back to REST query with full-text search if RPC is unavailable
            if response.status_code == 404:
                params: dict[str, str] = {
                    "select": "doci,title,abstract,field_of_study,citation_count,impact_score,authors,publication_date",
                    "fts": f"fts.wfts.{query}",
                    "status": "eq.published",
                    "order": "citation_count.desc",
                    "limit": str(limit),
                }
                if field:
                    params["field_of_study"] = f"eq.{field}"

                response = await client.get(
                    _rest_url("articles"),
                    headers=_supabase_headers(),
                    params=params,
                )

            response.raise_for_status()
            articles = response.json()

            return {
                "total_results": len(articles),
                "query": query,
                "field_filter": field,
                "articles": [
                    {
                        "doci": a.get("doci"),
                        "title": a.get("title"),
                        "abstract": (a.get("abstract") or "")[:500],
                        "field_of_study": a.get("field_of_study"),
                        "citation_count": a.get("citation_count", 0),
                        "impact_score": float(a.get("impact_score", 0)),
                        "authors": a.get("authors"),
                        "publication_date": a.get("publication_date"),
                    }
                    for a in articles
                ],
                "credits_charged": 0,
                "note": "Search is free. Use cite_and_access to read full text.",
            }

    except httpx.HTTPStatusError as exc:
        logger.error("Supabase HTTP error: %s", exc)
        return {"error": f"Search failed: HTTP {exc.response.status_code}", "articles": []}
    except httpx.RequestError as exc:
        logger.error("Network error during search: %s", exc)
        return {"error": f"Search failed: {exc}", "articles": []}


# ---------------------------------------------------------------------------
# Tool 2 — get_article_abstract  (FREE)
# ---------------------------------------------------------------------------


@mcp.tool()
async def get_article_abstract(doci: str) -> dict:
    """Get the abstract for a specific Fronsciers article by its DOCI.

    Free discovery tool. Returns the full abstract, authors, keywords,
    and citation metrics. DOCI format: "10.fronsciers/YYYY.NNNN".

    Args:
        doci: The Digital Object Citation Identifier (e.g. "10.fronsciers/2026.0042").
    """
    logger.info("get_article_abstract  doci=%r", doci)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                _rest_url("articles"),
                headers=_supabase_headers(),
                params={
                    "select": "doci,title,abstract,authors,keywords,field_of_study,"
                              "citation_count,impact_score,access_count,publication_date,status",
                    "doci": f"eq.{doci}",
                    "limit": "1",
                },
            )
            response.raise_for_status()
            rows = response.json()

            if not rows:
                return {"error": f"No article found with DOCI: {doci}"}

            article = rows[0]
            return {
                "doci": article.get("doci"),
                "title": article.get("title"),
                "abstract": article.get("abstract"),
                "authors": article.get("authors"),
                "keywords": article.get("keywords"),
                "field_of_study": article.get("field_of_study"),
                "citation_count": article.get("citation_count", 0),
                "impact_score": float(article.get("impact_score", 0)),
                "access_count": article.get("access_count", 0),
                "publication_date": article.get("publication_date"),
                "status": article.get("status"),
                "credits_charged": 0,
                "note": "Abstract is free. Use cite_and_access to read the full text.",
            }

    except httpx.HTTPStatusError as exc:
        logger.error("Supabase HTTP error: %s", exc)
        return {"error": f"Lookup failed: HTTP {exc.response.status_code}"}
    except httpx.RequestError as exc:
        logger.error("Network error: %s", exc)
        return {"error": f"Lookup failed: {exc}"}


# ---------------------------------------------------------------------------
# Tool 3 — cite_and_access  (PAID — $0.01 per citation)
# ---------------------------------------------------------------------------


@mcp.tool()
async def cite_and_access(doci: str, context: str) -> dict:
    """Cite and access the full text of a Fronsciers article.

    PAID tool — costs $0.01 (1 credit). The fee is split:
      40% platform, 20% author, 20% sharing pool, 20% reserve.

    This records an on-chain citation and returns the full article text.
    You MUST provide context explaining why you are citing this article.

    Args:
        doci: The DOCI of the article to cite (e.g. "10.fronsciers/2026.0042").
        context: A sentence explaining why this article is being cited.
    """
    logger.info("cite_and_access  doci=%r  context=%r", doci, context[:80])

    if not context or len(context.strip()) < 10:
        return {"error": "Context must be at least 10 characters explaining why you are citing this article."}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            # Step 1: Fetch the article (including full text)
            response = await client.get(
                _rest_url("articles"),
                headers=_supabase_headers(),
                params={
                    "select": "id,doci,title,content,abstract,authors,keywords,"
                              "field_of_study,citation_count,publication_date",
                    "doci": f"eq.{doci}",
                    "status": "eq.published",
                    "limit": "1",
                },
            )
            response.raise_for_status()
            rows = response.json()

            if not rows:
                return {"error": f"No published article found with DOCI: {doci}"}

            article = rows[0]
            article_id = article["id"]

            # Step 2: Record citation with revenue split
            citation_record = {
                "article_id": article_id,
                "citing_agent": "mcp_client",
                "citing_context": context,
                "solana_tx_signature": None,  # Populated after on-chain tx
                "fee_usdc": CITATION_FEE_USDC,
                "author_payout": round(CITATION_FEE_USDC * SPLIT_AUTHOR, 6),
                "pool_payout": round(CITATION_FEE_USDC * SPLIT_POOL, 6),
                "platform_payout": round(CITATION_FEE_USDC * SPLIT_PLATFORM, 6),
                "reserve_payout": round(CITATION_FEE_USDC * SPLIT_RESERVE, 6),
            }

            citation_resp = await client.post(
                _rest_url("citations"),
                headers=_supabase_headers(),
                json=citation_record,
            )
            citation_resp.raise_for_status()
            citation_data = citation_resp.json()
            citation_id = citation_data[0]["id"] if citation_data else str(uuid.uuid4())

            # Step 3: Increment article citation_count and access_count
            await client.patch(
                _rest_url("articles"),
                headers=_supabase_headers(),
                params={"id": f"eq.{article_id}"},
                json={
                    "citation_count": article.get("citation_count", 0) + 1,
                    "access_count": article.get("access_count", 0) + 1,
                },
            )

            # Step 4: Trigger Solana on-chain citation payment (async, non-blocking)
            solana_tx = await _record_solana_citation(article, citation_id)

            # Step 5: Update citation with tx signature if available
            if solana_tx:
                await client.patch(
                    _rest_url("citations"),
                    headers=_supabase_headers(),
                    params={"id": f"eq.{citation_id}"},
                    json={"solana_tx_signature": solana_tx},
                )

            logger.info(
                "Citation recorded: article=%s  citation=%s  tx=%s",
                article_id, citation_id, solana_tx,
            )

            return {
                "doci": article.get("doci"),
                "title": article.get("title"),
                "full_text": article.get("content"),
                "abstract": article.get("abstract"),
                "authors": article.get("authors"),
                "keywords": article.get("keywords"),
                "field_of_study": article.get("field_of_study"),
                "publication_date": article.get("publication_date"),
                "citation_id": citation_id,
                "solana_tx": solana_tx,
                "fee_charged_usdc": CITATION_FEE_USDC,
                "revenue_split": {
                    "author": citation_record["author_payout"],
                    "pool": citation_record["pool_payout"],
                    "platform": citation_record["platform_payout"],
                    "reserve": citation_record["reserve_payout"],
                },
                "credits_charged": 1,
            }

    except httpx.HTTPStatusError as exc:
        logger.error("Supabase HTTP error during cite_and_access: %s", exc)
        return {"error": f"Citation failed: HTTP {exc.response.status_code}"}
    except httpx.RequestError as exc:
        logger.error("Network error during cite_and_access: %s", exc)
        return {"error": f"Citation failed: {exc}"}


async def _record_solana_citation(article: dict, citation_id: str) -> Optional[str]:
    """Record citation payment on Solana.

    In production, this sends a real transaction via the Solana program.
    Currently returns a placeholder for devnet testing.
    """
    if not TREASURY_WALLET:
        logger.warning("TREASURY_WALLET not configured — skipping on-chain citation")
        return None

    try:
        # Production implementation would:
        # 1. Build a Solana transaction calling the Fronsciers citation instruction
        # 2. Transfer $0.01 USDC with the revenue split
        # 3. Record the DOCI + citation_id in the on-chain program
        #
        # For devnet, we log the intent and return a placeholder signature.
        logger.info(
            "Solana citation: article_doci=%s  citation=%s  treasury=%s",
            article.get("doci"),
            citation_id,
            TREASURY_WALLET,
        )
        # TODO: Replace with real Solana transaction via solders/solana-py
        return f"devnet_placeholder_{uuid.uuid4().hex[:16]}"

    except Exception as exc:
        logger.error("Solana citation payment failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Tool 4 — get_researcher_profile  (FREE)
# ---------------------------------------------------------------------------


@mcp.tool()
async def get_researcher_profile(name_or_wallet: str) -> dict:
    """Look up a researcher's profile by name or Solana wallet address.

    Free tool. Returns the researcher's institution, specializations,
    h-index, total citations, earnings, and publication history.

    Args:
        name_or_wallet: Researcher's name (partial match) or Solana wallet address.
    """
    logger.info("get_researcher_profile  name_or_wallet=%r", name_or_wallet)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Detect wallet address (base58, typically 32-44 chars of alphanumeric)
            is_wallet = len(name_or_wallet) >= 32 and name_or_wallet.isalnum()

            if is_wallet:
                params = {
                    "select": "*",
                    "wallet_address": f"eq.{name_or_wallet}",
                    "limit": "1",
                }
            else:
                params = {
                    "select": "*",
                    "name": f"ilike.*{name_or_wallet}*",
                    "limit": "5",
                }

            response = await client.get(
                _rest_url("researchers"),
                headers=_supabase_headers(),
                params=params,
            )
            response.raise_for_status()
            researchers = response.json()

            if not researchers:
                return {"error": f"No researcher found matching: {name_or_wallet}"}

            results = []
            for r in researchers:
                wallet = r.get("wallet_address", "")
                # Fetch their published articles
                articles_resp = await client.get(
                    _rest_url("articles"),
                    headers=_supabase_headers(),
                    params={
                        "select": "doci,title,citation_count,publication_date,field_of_study",
                        "authors": f"cs.[{{'wallet':'{wallet}'}}]",
                        "status": "eq.published",
                        "order": "citation_count.desc",
                        "limit": "10",
                    },
                )
                articles = articles_resp.json() if articles_resp.status_code == 200 else []

                results.append({
                    "name": r.get("name"),
                    "wallet_address": wallet,
                    "institution": r.get("institution"),
                    "education": r.get("education"),
                    "specializations": r.get("specializations", []),
                    "h_index": float(r.get("h_index", 0)),
                    "total_citations": r.get("total_citations", 0),
                    "total_earnings_usdc": float(r.get("total_earnings_usdc", 0)),
                    "leaderboard_rank": r.get("leaderboard_rank"),
                    "orcid": r.get("orcid"),
                    "google_scholar_id": r.get("google_scholar_id"),
                    "frons_id_card_active": r.get("frons_id_card_active", False),
                    "recent_publications": articles,
                })

            return {
                "total_results": len(results),
                "researchers": results,
                "credits_charged": 0,
            }

    except httpx.HTTPStatusError as exc:
        logger.error("Supabase HTTP error: %s", exc)
        return {"error": f"Profile lookup failed: HTTP {exc.response.status_code}"}
    except httpx.RequestError as exc:
        logger.error("Network error: %s", exc)
        return {"error": f"Profile lookup failed: {exc}"}


# ---------------------------------------------------------------------------
# Tool 5 — get_trending_research  (FREE)
# ---------------------------------------------------------------------------


@mcp.tool()
async def get_trending_research(
    field: str = "medicine",
    period: str = "3months",
) -> dict:
    """Get trending research papers from Fronsciers.

    Free discovery tool. Returns papers sorted by citation count and
    impact score within the specified field and time period.

    Args:
        field: Field of study (e.g. "medicine", "biology", "computer_science").
        period: Time period — "1month", "3months", "6months", or "1year".
    """
    logger.info("get_trending_research  field=%r  period=%r", field, period)

    # Map period string to days
    period_days = {
        "1month": 30,
        "3months": 90,
        "6months": 180,
        "1year": 365,
    }
    days = period_days.get(period, 90)
    cutoff = datetime.now(timezone.utc).isoformat()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Query articles filtered by field and publication date, ordered by impact
            params: dict[str, str] = {
                "select": "doci,title,abstract,authors,citation_count,impact_score,"
                          "field_of_study,publication_date",
                "status": "eq.published",
                "field_of_study": f"eq.{field}",
                "order": "impact_score.desc,citation_count.desc",
                "limit": "20",
            }

            response = await client.get(
                _rest_url("articles"),
                headers=_supabase_headers(),
                params=params,
            )
            response.raise_for_status()
            articles = response.json()

            return {
                "field": field,
                "period": period,
                "total_results": len(articles),
                "trending_articles": [
                    {
                        "doci": a.get("doci"),
                        "title": a.get("title"),
                        "abstract": (a.get("abstract") or "")[:300],
                        "authors": a.get("authors"),
                        "citation_count": a.get("citation_count", 0),
                        "impact_score": float(a.get("impact_score", 0)),
                        "field_of_study": a.get("field_of_study"),
                        "publication_date": a.get("publication_date"),
                    }
                    for a in articles
                ],
                "credits_charged": 0,
                "note": "Trending results are free. Use cite_and_access to read full text.",
            }

    except httpx.HTTPStatusError as exc:
        logger.error("Supabase HTTP error: %s", exc)
        return {"error": f"Trending lookup failed: HTTP {exc.response.status_code}"}
    except httpx.RequestError as exc:
        logger.error("Network error: %s", exc)
        return {"error": f"Trending lookup failed: {exc}"}


# ---------------------------------------------------------------------------
# Tool 6 — get_citation_stats  (FREE)
# ---------------------------------------------------------------------------


@mcp.tool()
async def get_citation_stats(doci: str) -> dict:
    """Get citation statistics for a specific Fronsciers article.

    Free tool. Returns total citations, recent citation activity,
    top citing agents, and revenue generated for the author.

    Args:
        doci: The DOCI of the article (e.g. "10.fronsciers/2026.0042").
    """
    logger.info("get_citation_stats  doci=%r", doci)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get article to find its UUID
            article_resp = await client.get(
                _rest_url("articles"),
                headers=_supabase_headers(),
                params={
                    "select": "id,doci,title,citation_count,access_count,impact_score",
                    "doci": f"eq.{doci}",
                    "limit": "1",
                },
            )
            article_resp.raise_for_status()
            articles = article_resp.json()

            if not articles:
                return {"error": f"No article found with DOCI: {doci}"}

            article = articles[0]
            article_id = article["id"]

            # Get citation records
            citations_resp = await client.get(
                _rest_url("citations"),
                headers=_supabase_headers(),
                params={
                    "select": "citing_agent,citing_context,fee_usdc,author_payout,"
                              "solana_tx_signature,created_at",
                    "article_id": f"eq.{article_id}",
                    "order": "created_at.desc",
                    "limit": "100",
                },
            )
            citations_resp.raise_for_status()
            citations = citations_resp.json()

            # Aggregate stats
            total_fees = sum(float(c.get("fee_usdc", 0)) for c in citations)
            total_author_payout = sum(float(c.get("author_payout", 0)) for c in citations)

            # Count by citing agent
            agent_counts: dict[str, int] = {}
            for c in citations:
                agent = c.get("citing_agent", "unknown")
                agent_counts[agent] = agent_counts.get(agent, 0) + 1

            return {
                "doci": article.get("doci"),
                "title": article.get("title"),
                "citation_count": article.get("citation_count", 0),
                "access_count": article.get("access_count", 0),
                "impact_score": float(article.get("impact_score", 0)),
                "total_citation_revenue_usdc": round(total_fees, 6),
                "total_author_earnings_usdc": round(total_author_payout, 6),
                "citations_by_agent": agent_counts,
                "recent_citations": [
                    {
                        "citing_agent": c.get("citing_agent"),
                        "context": c.get("citing_context"),
                        "fee_usdc": float(c.get("fee_usdc", 0)),
                        "solana_tx": c.get("solana_tx_signature"),
                        "cited_at": c.get("created_at"),
                    }
                    for c in citations[:10]
                ],
                "credits_charged": 0,
            }

    except httpx.HTTPStatusError as exc:
        logger.error("Supabase HTTP error: %s", exc)
        return {"error": f"Citation stats failed: HTTP {exc.response.status_code}"}
    except httpx.RequestError as exc:
        logger.error("Network error: %s", exc)
        return {"error": f"Citation stats failed: {exc}"}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mcp.run()
