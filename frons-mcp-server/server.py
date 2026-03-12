"""
FRONS MCP Server — AI Gateway for the FRONS Research Platform.

Exposes research tools via the Model Context Protocol (MCP) so that any
MCP-compatible AI client can search, cite, and access peer-reviewed
scientific articles stored on the FRONS platform.

Tools are divided into FREE (open access) and PAID (triggers citation
recording + micropayment to the original author).
"""

from __future__ import annotations

import os
from typing import Optional

from dotenv import load_dotenv
from fastmcp import FastMCP
from supabase import create_client, Client

load_dotenv()

# ---------------------------------------------------------------------------
# Supabase client
# ---------------------------------------------------------------------------

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_KEY", "")


def _get_supabase() -> Client:
    """Return a Supabase client, raising early on missing config."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in the environment."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ---------------------------------------------------------------------------
# FastMCP server
# ---------------------------------------------------------------------------

mcp = FastMCP(
    "FRONS Research Platform",
    description=(
        "AI gateway for the FRONS decentralised research platform. "
        "Search, cite, and access peer-reviewed scientific articles. "
        "Authors earn micropayments every time their work is cited."
    ),
)


# ---------------------------------------------------------------------------
# FREE tools
# ---------------------------------------------------------------------------


@mcp.tool()
async def search_articles(
    query: str,
    field: Optional[str] = None,
    limit: int = 10,
) -> dict:
    """Search the FRONS articles database.

    Uses the ``search_articles`` Postgres function in Supabase to perform
    full-text search across titles, abstracts, and keywords.

    Args:
        query: Natural-language search query.
        field: Optional discipline filter (e.g. "medicine", "physics").
        limit: Maximum number of results to return (default 10, max 50).

    Returns:
        A dict with ``results`` (list of article summaries) and ``count``.
    """
    limit = min(max(1, limit), 50)
    sb = _get_supabase()

    params: dict = {"search_query": query, "result_limit": limit}
    if field:
        params["field_filter"] = field

    response = sb.rpc("search_articles", params).execute()
    articles = response.data or []

    return {
        "results": articles,
        "count": len(articles),
        "query": query,
        "field": field,
    }


@mcp.tool()
async def get_article_abstract(doci: str) -> dict:
    """Retrieve the abstract of an article by its DOCI (Decentralised Object Content Identifier).

    This is a FREE operation — no payment is required to read abstracts.

    Args:
        doci: The unique DOCI identifier of the article.

    Returns:
        A dict containing the article metadata and abstract.
    """
    sb = _get_supabase()

    response = (
        sb.table("articles")
        .select("doci, title, abstract, authors, field, keywords, published_at, citation_count")
        .eq("doci", doci)
        .single()
        .execute()
    )

    if not response.data:
        return {"error": "Article not found", "doci": doci}

    return {"article": response.data}


@mcp.tool()
async def get_researcher_profile(name_or_wallet: str) -> dict:
    """Look up a researcher by name or wallet address.

    Args:
        name_or_wallet: The researcher's display name or blockchain wallet address.

    Returns:
        A dict with researcher profile information and their published articles.
    """
    sb = _get_supabase()

    # Try wallet address first (exact match)
    response = (
        sb.table("researchers")
        .select("*")
        .eq("wallet_address", name_or_wallet)
        .execute()
    )

    if not response.data:
        # Fall back to name search (case-insensitive partial match)
        response = (
            sb.table("researchers")
            .select("*")
            .ilike("name", f"%{name_or_wallet}%")
            .execute()
        )

    if not response.data:
        return {"error": "Researcher not found", "query": name_or_wallet}

    return {"researchers": response.data, "count": len(response.data)}


@mcp.tool()
async def get_trending_research(
    field: str = "medicine",
    period: str = "3months",
) -> dict:
    """Get trending research articles for a given field and time period.

    Args:
        field: The research discipline (e.g. "medicine", "physics", "biology").
        period: Time window — one of "1week", "1month", "3months", "1year".

    Returns:
        A dict with trending articles sorted by citation velocity.
    """
    sb = _get_supabase()

    response = sb.rpc(
        "get_trending_articles",
        {"field_filter": field, "time_period": period},
    ).execute()

    articles = response.data or []

    return {
        "trending": articles,
        "count": len(articles),
        "field": field,
        "period": period,
    }


@mcp.tool()
async def get_citation_stats(doci: str) -> dict:
    """Get citation count and statistics for an article.

    Args:
        doci: The unique DOCI identifier of the article.

    Returns:
        A dict with citation count, recent citations, and citing articles.
    """
    sb = _get_supabase()

    # Fetch the article's citation count
    article_resp = (
        sb.table("articles")
        .select("doci, title, citation_count")
        .eq("doci", doci)
        .single()
        .execute()
    )

    if not article_resp.data:
        return {"error": "Article not found", "doci": doci}

    # Fetch recent citing articles
    citations_resp = (
        sb.table("citations")
        .select("citing_doci, cited_at, context")
        .eq("cited_doci", doci)
        .order("cited_at", desc=True)
        .limit(20)
        .execute()
    )

    return {
        "article": article_resp.data,
        "recent_citations": citations_resp.data or [],
        "total_citations": article_resp.data.get("citation_count", 0),
    }


# ---------------------------------------------------------------------------
# PAID tools
# ---------------------------------------------------------------------------


@mcp.tool()
async def cite_and_access(doci: str, context: str) -> dict:
    """Cite an article and access its full content.

    **This is a PAID operation.** It triggers:
    1. A citation record linking the citing context to the cited article.
    2. A micropayment to the article's author(s) via the FRONS payment rail.

    The caller must supply the ``context`` — the sentence or paragraph in
    which the citation is being used — so the platform can verify the
    citation is genuine and contextually appropriate.

    Args:
        doci: The unique DOCI identifier of the article to cite.
        context: The text passage where this citation is being used.

    Returns:
        A dict with the full article content and a citation receipt.
    """
    if not context or len(context.strip()) < 10:
        return {
            "error": "Citation context is required and must be at least 10 characters.",
            "doci": doci,
        }

    sb = _get_supabase()

    # Record the citation and trigger payment via Supabase RPC.
    # The ``record_citation_and_pay`` function handles:
    #   - inserting into the citations table
    #   - incrementing citation_count on the article
    #   - initiating the micropayment to the author's wallet
    citation_resp = sb.rpc(
        "record_citation_and_pay",
        {"article_doci": doci, "citation_context": context},
    ).execute()

    if not citation_resp.data:
        return {"error": "Failed to record citation", "doci": doci}

    # Fetch full article content (only available after payment)
    article_resp = (
        sb.table("articles")
        .select("*")
        .eq("doci", doci)
        .single()
        .execute()
    )

    if not article_resp.data:
        return {"error": "Article not found after citation", "doci": doci}

    return {
        "article": article_resp.data,
        "citation_receipt": citation_resp.data,
        "payment_status": "completed",
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mcp.run()
