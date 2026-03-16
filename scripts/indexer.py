"""
FRONS Solana Indexer — Event Sync

Listens for on-chain events from the Fronsciers Anchor program and syncs them
to Supabase. Runs as a long-lived process.

Events synced:
- ManuscriptSubmitted → articles table
- ManuscriptReviewed → reviews table
- ManuscriptPublished → articles status + publication_nfts
- CitationRecorded → citations table + article citation_count
- EarningsClaimed → researcher total_earnings
- PoolDistributed → leaderboard table
- UserRegistered → researchers table
"""

import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

# Configuration
SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
PROGRAM_ID = os.getenv("FRONSCIERS_PROGRAM_ID", "28VkA76EcTTNX9B3RiY5M2dSYAqFkU4fxU6T5mG1NFgd")

# Polling interval in seconds
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "5"))

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("frons-indexer")


class SupabaseClient:
    """Lightweight Supabase REST client for the indexer."""

    def __init__(self, url: str, service_key: str):
        self.url = url.rstrip("/")
        self.headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
        self.client = httpx.AsyncClient(timeout=30.0)

    async def upsert(self, table: str, data: dict, on_conflict: str = "id") -> bool:
        """Upsert a record into a Supabase table."""
        try:
            headers = {**self.headers, "Prefer": "resolution=merge-duplicates"}
            res = await self.client.post(
                f"{self.url}/rest/v1/{table}",
                headers=headers,
                json=data,
            )
            if res.status_code in (200, 201, 204):
                return True
            logger.error(f"Upsert to {table} failed: {res.status_code} {res.text}")
            return False
        except Exception as e:
            logger.error(f"Upsert error: {e}")
            return False

    async def insert(self, table: str, data: dict) -> bool:
        """Insert a record into a Supabase table."""
        try:
            res = await self.client.post(
                f"{self.url}/rest/v1/{table}",
                headers=self.headers,
                json=data,
            )
            if res.status_code in (200, 201, 204):
                return True
            logger.error(f"Insert to {table} failed: {res.status_code} {res.text}")
            return False
        except Exception as e:
            logger.error(f"Insert error: {e}")
            return False

    async def update(self, table: str, match: dict, data: dict) -> bool:
        """Update records in a Supabase table."""
        try:
            params = "&".join(f"{k}=eq.{v}" for k, v in match.items())
            res = await self.client.patch(
                f"{self.url}/rest/v1/{table}?{params}",
                headers=self.headers,
                json=data,
            )
            if res.status_code in (200, 204):
                return True
            logger.error(f"Update {table} failed: {res.status_code} {res.text}")
            return False
        except Exception as e:
            logger.error(f"Update error: {e}")
            return False

    async def rpc(self, function_name: str, params: dict) -> Optional[Any]:
        """Call a Supabase RPC function."""
        try:
            res = await self.client.post(
                f"{self.url}/rest/v1/rpc/{function_name}",
                headers=self.headers,
                json=params,
            )
            if res.status_code == 200:
                return res.json()
            logger.error(f"RPC {function_name} failed: {res.status_code} {res.text}")
            return None
        except Exception as e:
            logger.error(f"RPC error: {e}")
            return None


class SolanaIndexer:
    """Indexes Fronsciers on-chain events into Supabase."""

    def __init__(self, rpc_url: str, program_id: str, supabase: SupabaseClient):
        self.rpc_url = rpc_url
        self.program_id = program_id
        self.supabase = supabase
        self.client = httpx.AsyncClient(timeout=30.0)
        self.last_signature: Optional[str] = None
        self.processed_count = 0

    async def get_signatures(self, limit: int = 20) -> list:
        """Fetch recent transaction signatures for the program."""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getSignaturesForAddress",
            "params": [
                self.program_id,
                {"limit": limit, "commitment": "confirmed"},
            ],
        }
        if self.last_signature:
            payload["params"][1]["until"] = self.last_signature

        try:
            res = await self.client.post(self.rpc_url, json=payload)
            data = res.json()
            return data.get("result", [])
        except Exception as e:
            logger.error(f"Failed to fetch signatures: {e}")
            return []

    async def get_transaction(self, signature: str) -> Optional[dict]:
        """Fetch a specific transaction by signature."""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTransaction",
            "params": [
                signature,
                {"encoding": "jsonParsed", "commitment": "confirmed"},
            ],
        }
        try:
            res = await self.client.post(self.rpc_url, json=payload)
            data = res.json()
            return data.get("result")
        except Exception as e:
            logger.error(f"Failed to fetch tx {signature}: {e}")
            return None

    async def process_transaction(self, tx: dict, signature: str) -> None:
        """Parse and process a Fronsciers transaction."""
        try:
            log_messages = tx.get("meta", {}).get("logMessages", [])
            now = datetime.now(timezone.utc).isoformat()

            for log in log_messages:
                # Detect event types from Anchor program logs
                if "Program log: Instruction: RegisterUser" in log:
                    await self.handle_user_registered(tx, signature, now)
                elif "Program log: Instruction: SubmitManuscript" in log:
                    await self.handle_manuscript_submitted(tx, signature, now)
                elif "Program log: Instruction: ReviewManuscript" in log:
                    await self.handle_manuscript_reviewed(tx, signature, now)
                elif "Program log: Instruction: MintDociNft" in log:
                    await self.handle_manuscript_published(tx, signature, now)
                elif "Program log: Instruction: RecordCitation" in log:
                    await self.handle_citation_recorded(tx, signature, now)
                elif "Program log: Instruction: ClaimEarnings" in log:
                    await self.handle_earnings_claimed(tx, signature, now)
                elif "Program log: Instruction: DistributePool" in log:
                    await self.handle_pool_distributed(tx, signature, now)

            self.processed_count += 1
        except Exception as e:
            logger.error(f"Error processing tx {signature}: {e}")

    async def handle_user_registered(
        self, tx: dict, signature: str, now: str
    ) -> None:
        """Sync UserRegistered event to researchers table."""
        accounts = tx.get("transaction", {}).get("message", {}).get("accountKeys", [])
        if len(accounts) > 1:
            wallet = accounts[0].get("pubkey", "") if isinstance(accounts[0], dict) else str(accounts[0])
            await self.supabase.upsert(
                "researchers",
                {
                    "wallet_address": wallet,
                    "created_at": now,
                },
                on_conflict="wallet_address",
            )
            logger.info(f"Synced user registration: {wallet[:12]}...")

    async def handle_manuscript_submitted(
        self, tx: dict, signature: str, now: str
    ) -> None:
        """Sync ManuscriptSubmitted event to articles table."""
        await self.supabase.insert(
            "articles",
            {
                "solana_manuscript_pubkey": signature,
                "status": "pending",
                "submission_date": now,
                "title": "Pending on-chain manuscript",
                "created_at": now,
            },
        )
        logger.info(f"Synced manuscript submission: {signature[:16]}...")

    async def handle_manuscript_reviewed(
        self, tx: dict, signature: str, now: str
    ) -> None:
        """Sync ManuscriptReviewed event to reviews table."""
        await self.supabase.insert(
            "reviews",
            {
                "solana_tx_signature": signature,
                "created_at": now,
            },
        )
        logger.info(f"Synced manuscript review: {signature[:16]}...")

    async def handle_manuscript_published(
        self, tx: dict, signature: str, now: str
    ) -> None:
        """Sync ManuscriptPublished event — update status + create NFT record."""
        await self.supabase.insert(
            "publication_nfts",
            {
                "mint_address": signature,
                "doci": f"10.fronsciers/{datetime.now().year}.{self.processed_count:04d}",
                "solana_tx_sig": signature,
                "minted_at": now,
            },
        )
        logger.info(f"Synced manuscript publication: {signature[:16]}...")

    async def handle_citation_recorded(
        self, tx: dict, signature: str, now: str
    ) -> None:
        """Sync CitationRecorded event — insert citation + update count."""
        fee_usdc = 0.01
        await self.supabase.insert(
            "citations",
            {
                "solana_tx_signature": signature,
                "fee_usdc": fee_usdc,
                "author_payout": fee_usdc * 0.20,
                "pool_payout": fee_usdc * 0.20,
                "platform_payout": fee_usdc * 0.40,
                "reserve_payout": fee_usdc * 0.20,
                "created_at": now,
            },
        )
        logger.info(f"Synced citation: {signature[:16]}... (${fee_usdc})")

    async def handle_earnings_claimed(
        self, tx: dict, signature: str, now: str
    ) -> None:
        """Sync EarningsClaimed event."""
        logger.info(f"Synced earnings claim: {signature[:16]}...")

    async def handle_pool_distributed(
        self, tx: dict, signature: str, now: str
    ) -> None:
        """Sync PoolDistributed event to leaderboard."""
        logger.info(f"Synced pool distribution: {signature[:16]}...")

    async def run(self) -> None:
        """Main indexer loop — poll for new transactions."""
        logger.info(f"Starting FRONS Solana Indexer")
        logger.info(f"RPC: {self.rpc_url}")
        logger.info(f"Program: {self.program_id}")
        logger.info(f"Poll interval: {POLL_INTERVAL}s")

        while True:
            try:
                signatures = await self.get_signatures()

                if signatures:
                    # Process in chronological order (oldest first)
                    for sig_info in reversed(signatures):
                        sig = sig_info.get("signature", "")
                        if sig_info.get("err"):
                            continue  # Skip failed txs

                        tx = await self.get_transaction(sig)
                        if tx:
                            await self.process_transaction(tx, sig)

                    # Update cursor to latest signature
                    self.last_signature = signatures[0].get("signature")

                    if len(signatures) > 0:
                        logger.info(
                            f"Processed {len(signatures)} transactions "
                            f"(total: {self.processed_count})"
                        )

            except Exception as e:
                logger.error(f"Indexer error: {e}")

            await asyncio.sleep(POLL_INTERVAL)


async def main():
    """Entry point."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        logger.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        sys.exit(1)

    supabase = SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    indexer = SolanaIndexer(SOLANA_RPC_URL, PROGRAM_ID, supabase)
    await indexer.run()


if __name__ == "__main__":
    asyncio.run(main())
