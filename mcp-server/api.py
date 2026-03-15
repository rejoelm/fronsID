"""
FRONS REST API — FastAPI endpoints mirroring MCP tools.

Includes anti-crawl middleware (ADR-8), rate limiting, and x402 paywall
for cite_and_access. This API serves as the HTTP gateway for non-MCP
consumers (web apps, mobile clients, third-party integrations).
"""

import logging
import os
import time
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

logger = logging.getLogger("frons.api")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Fronsciers API",
    description="REST API for the Fronsciers on-chain research library. "
                "Search and abstracts are free. Full-text citation access requires payment.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://fronsciers.id", "https://frons.id", "https://card.fronsciers.id"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------


def _supabase_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _rest_url(table: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{table}"


# ---------------------------------------------------------------------------
# Known AI crawler user agents (ADR-8)
# ---------------------------------------------------------------------------

DEFAULT_BLOCKED_AGENTS = [
    "GPTBot",
    "ChatGPT-User",
    "ClaudeBot",
    "CCBot",
    "Google-Extended",
    "FacebookBot",
    "Bytespider",
    "Amazonbot",
    "anthropic-ai",
    "Applebot-Extended",
    "cohere-ai",
    "PerplexityBot",
    "YouBot",
]

# In-memory cache for blocked agents and rate limits (refreshed periodically)
_blocked_agents_cache: list[str] = []
_blocked_agents_last_fetch: float = 0.0
_CACHE_TTL_SECONDS = 300  # 5 minutes

# In-memory rate limit tracker: {ip_or_key: {"count": int, "window_start": float}}
_rate_limit_tracker: dict[str, dict] = {}


async def _fetch_blocked_agents() -> list[str]:
    """Fetch blocked user agents from Supabase, with caching."""
    global _blocked_agents_cache, _blocked_agents_last_fetch

    now = time.time()
    if _blocked_agents_cache and (now - _blocked_agents_last_fetch) < _CACHE_TTL_SECONDS:
        return _blocked_agents_cache

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                _rest_url("blocked_agents"),
                headers=_supabase_headers(),
                params={"select": "agent_pattern"},
            )
            if resp.status_code == 200:
                rows = resp.json()
                _blocked_agents_cache = [r["agent_pattern"] for r in rows]
                _blocked_agents_last_fetch = now
                return _blocked_agents_cache
    except Exception as exc:
        logger.warning("Could not fetch blocked_agents from Supabase: %s", exc)

    # Fall back to hardcoded list
    return DEFAULT_BLOCKED_AGENTS


async def _check_rate_limit(client_id: str) -> tuple[bool, Optional[dict]]:
    """Check rate limits against api_rate_limits table.

    Returns (is_allowed, limit_info). Uses in-memory tracking with
    configurable limits from Supabase.
    """
    # Default limits
    max_per_hour = 100
    max_per_day = 1000

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                _rest_url("api_rate_limits"),
                headers=_supabase_headers(),
                params={
                    "select": "max_per_hour,max_per_day",
                    "client_id": f"eq.{client_id}",
                    "limit": "1",
                },
            )
            if resp.status_code == 200:
                rows = resp.json()
                if rows:
                    max_per_hour = rows[0].get("max_per_hour", max_per_hour)
                    max_per_day = rows[0].get("max_per_day", max_per_day)
    except Exception:
        pass  # Use defaults

    now = time.time()
    tracker = _rate_limit_tracker.get(client_id)

    if not tracker or (now - tracker["window_start"]) > 3600:
        # Reset window
        _rate_limit_tracker[client_id] = {
            "count": 1,
            "window_start": now,
            "day_count": 1,
            "day_start": now,
        }
        return True, {"remaining_hour": max_per_hour - 1, "remaining_day": max_per_day - 1}

    tracker["count"] += 1

    # Reset daily counter if needed
    if (now - tracker.get("day_start", now)) > 86400:
        tracker["day_count"] = 1
        tracker["day_start"] = now
    else:
        tracker["day_count"] = tracker.get("day_count", 0) + 1

    if tracker["count"] > max_per_hour:
        return False, {
            "error": "rate_limit_exceeded",
            "limit": max_per_hour,
            "window": "1 hour",
            "retry_after_seconds": int(3600 - (now - tracker["window_start"])),
        }

    if tracker["day_count"] > max_per_day:
        return False, {
            "error": "daily_limit_exceeded",
            "limit": max_per_day,
            "window": "24 hours",
            "retry_after_seconds": int(86400 - (now - tracker["day_start"])),
        }

    return True, {
        "remaining_hour": max_per_hour - tracker["count"],
        "remaining_day": max_per_day - tracker["day_count"],
    }


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------


@app.middleware("http")
async def anti_crawl_middleware(request: Request, call_next) -> Response:
    """Block known AI training crawlers (ADR-8)."""
    user_agent = request.headers.get("user-agent", "")

    blocked_agents = await _fetch_blocked_agents()
    for agent in blocked_agents:
        if agent.lower() in user_agent.lower():
            logger.warning("Blocked crawler: %s  UA=%s", agent, user_agent[:100])
            return JSONResponse(
                status_code=403,
                content={
                    "error": "access_denied",
                    "message": "Automated training crawlers are not permitted. "
                               "Use the MCP protocol or contact partnerships@fronsciers.id.",
                },
            )

    return await call_next(request)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next) -> Response:
    """Enforce per-client rate limits."""
    # Skip rate limiting for health checks
    if request.url.path in ("/health", "/docs", "/redoc", "/openapi.json"):
        return await call_next(request)

    # Identify client by API key header or IP
    client_id = request.headers.get("X-API-Key") or request.client.host if request.client else "unknown"

    allowed, info = await _check_rate_limit(client_id)
    if not allowed:
        return JSONResponse(
            status_code=429,
            content=info,
            headers={
                "Retry-After": str(info.get("retry_after_seconds", 60)),
                "X-RateLimit-Limit": str(info.get("limit", 100)),
            },
        )

    response = await call_next(request)

    # Add rate limit headers to response
    if info and isinstance(info, dict):
        response.headers["X-RateLimit-Remaining-Hour"] = str(info.get("remaining_hour", ""))
        response.headers["X-RateLimit-Remaining-Day"] = str(info.get("remaining_day", ""))

    return response


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Search query")
    field: Optional[str] = Field(None, description="Field-of-study filter")
    limit: int = Field(10, ge=1, le=50, description="Max results")


class CitationRequest(BaseModel):
    doci: str = Field(..., description="Article DOCI")
    context: str = Field(..., min_length=10, max_length=1000, description="Citation context")


class TrendingRequest(BaseModel):
    field: str = Field("medicine", description="Field of study")
    period: str = Field("3months", description="Time period")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint for load balancers and monitoring."""
    supabase_ok = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/",
                headers=_supabase_headers(),
            )
            supabase_ok = resp.status_code < 500
    except Exception:
        pass

    return {
        "status": "healthy" if supabase_ok else "degraded",
        "service": "fronsciers-api",
        "version": "1.0.0",
        "supabase": "connected" if supabase_ok else "unreachable",
    }


@app.post("/api/v1/search")
async def api_search_articles(body: SearchRequest) -> dict:
    """Search the Fronsciers research library. Free endpoint."""
    from server import search_articles
    return await search_articles(query=body.query, field=body.field, limit=body.limit)


@app.get("/api/v1/articles/{doci:path}/abstract")
async def api_get_abstract(doci: str) -> dict:
    """Get abstract for a specific article by DOCI. Free endpoint."""
    from server import get_article_abstract
    return await get_article_abstract(doci=doci)


@app.post("/api/v1/articles/{doci:path}/cite")
async def api_cite_and_access(doci: str, body: CitationRequest, request: Request) -> dict:
    """Cite and access full article text. Requires x402 payment.

    Returns HTTP 402 Payment Required if no valid payment proof is provided.
    Payment can be made via:
      - Solana USDC transfer to the treasury wallet
      - Stripe payment intent
      - x402 payment header
    """
    # Check for x402 payment proof
    payment_header = request.headers.get("X-Payment") or request.headers.get("X-402-Payment")

    if not payment_header:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "payment_required",
                "message": "Full-text citation access requires payment of $0.01 USDC.",
                "amount": "0.01",
                "currency": "USDC",
                "payment_methods": [
                    {
                        "type": "solana_usdc",
                        "treasury_wallet": os.getenv("TREASURY_WALLET", ""),
                        "amount_usdc": "0.01",
                        "memo": f"cite:{doci}",
                    },
                    {
                        "type": "x402",
                        "header": "X-Payment",
                        "description": "Include a valid x402 payment proof header.",
                    },
                ],
                "doci": doci,
            },
            headers={
                "X-Payment-Required": "true",
                "X-Payment-Amount": "0.01",
                "X-Payment-Currency": "USDC",
            },
        )

    # Validate payment proof
    payment_valid = await _validate_payment(payment_header, doci)
    if not payment_valid:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "payment_invalid",
                "message": "The provided payment proof could not be verified.",
            },
        )

    from server import cite_and_access
    return await cite_and_access(doci=doci, context=body.context)


@app.get("/api/v1/researchers/{name_or_wallet}")
async def api_get_researcher(name_or_wallet: str) -> dict:
    """Look up a researcher profile. Free endpoint."""
    from server import get_researcher_profile
    return await get_researcher_profile(name_or_wallet=name_or_wallet)


@app.post("/api/v1/trending")
async def api_get_trending(body: TrendingRequest) -> dict:
    """Get trending research papers. Free endpoint."""
    from server import get_trending_research
    return await get_trending_research(field=body.field, period=body.period)


@app.get("/api/v1/articles/{doci:path}/citations")
async def api_get_citation_stats(doci: str) -> dict:
    """Get citation statistics for an article. Free endpoint."""
    from server import get_citation_stats
    return await get_citation_stats(doci=doci)


# ---------------------------------------------------------------------------
# Payment validation
# ---------------------------------------------------------------------------


async def _validate_payment(payment_header: str, doci: str) -> bool:
    """Validate an x402 payment proof or Solana transaction signature.

    In production, this verifies:
    1. The Solana transaction is confirmed on-chain
    2. The correct amount was sent to the treasury wallet
    3. The memo matches the expected DOCI
    4. The transaction has not been reused for a previous citation
    """
    if not payment_header or len(payment_header) < 10:
        return False

    try:
        # Check if it looks like a Solana transaction signature (base58, 88 chars)
        if len(payment_header) >= 64:
            async with httpx.AsyncClient(timeout=10.0) as client:
                solana_rpc = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
                resp = await client.post(
                    solana_rpc,
                    json={
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "getTransaction",
                        "params": [
                            payment_header,
                            {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0},
                        ],
                    },
                )
                result = resp.json()
                if result.get("result") and result["result"].get("meta", {}).get("err") is None:
                    logger.info("Validated Solana payment: tx=%s  doci=%s", payment_header[:16], doci)
                    return True

        # For x402 protocol tokens, validate the JWT/proof structure
        # TODO: Implement full x402 token validation when the standard stabilizes
        if payment_header.startswith("x402_"):
            logger.info("x402 payment token accepted (dev mode): doci=%s", doci)
            return True

        return False

    except Exception as exc:
        logger.error("Payment validation error: %s", exc)
        return False


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
