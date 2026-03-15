# FRONS Ecosystem Monorepo

Welcome to the FRONS Ecosystem — a comprehensive suite of Web3 applications and smart contracts revolutionizing scientific research, peer review, and academic publishing on the Solana blockchain.

## Documentation

| Document | Purpose |
|---|---|
| `CLAUDE.md` | **Build instructions for Claude Code.** Every architecture decision, code snippet, database migration, and build phase needed to construct the entire platform. Written as imperative instructions with copy-paste-ready code. |
| `Grand-Design.md` | **Project specification and source of truth.** Describes WHAT the platform is, WHY it exists, and HOW the business works. Read this first to understand the vision. |

## Products

### 1. Fronsciers Library (`/frons-fe-main`)
Decentralized research library where independent researchers submit manuscripts, undergo peer review, and publish on-chain. Every AI citation triggers a $0.01 micro-payment to the author.

### 2. Frons.id AI Chat + Vault (`/frons-chat-main`)
Evidence-based AI chat engine with zero hallucinations (4-tier evidence cascade) and an encrypted personal data vault (client-side AES-256-GCM). Integrated with Privy gasless transactions.

### 3. FRONS-J Journal Management (`/frons-j-fe`)
"Shopify for Journals" — OJS-compatible journal management system for academic institutions to create and manage their own decentralized journals.

### 4. NFC Profile Cards (`/frons-card-main`)
Public-facing researcher profiles linked to physical NTAG 424 DNA NFC cards. Displays verified academic portfolios with on-chain publication data and Soulbound verification badges.

### 5. Admin Console (`/frons-admin-main`)
Isolated high-security admin portal for managing Solana protocol parameters, monitoring ecosystem analytics, and seeding evidence into the AI database.

### 6. MCP Server (`/mcp-server`)
AI gateway exposing Fronsciers content to all AI assistants via Model Context Protocol. Free search + paid full-text access = authors earn from AI citations.

### 7. Smart Contract (`/programs/fronsciers`)
Solana/Anchor program handling manuscript submissions, peer review, DOCI NFT minting, citation payments, and revenue distribution.

## Web3 Integration

Unified authentication via **Privy** across all products. Researchers connect via Email, Google, or Solana wallets. **Metaplex Token Metadata** provides true cryptographic ownership of publications (DOCI NFTs). All payments in USDC on Solana with sub-cent transaction fees.

## Quick Start

```bash
# Run any frontend locally
cd apps/frons-chat-main
npm install
npm run dev

# Run the MCP server
cd apps/mcp-server
pip install -r requirements.txt
python server.py
```

Ensure `.env.local` files carry the correct `NEXT_PUBLIC_PRIVY_APP_ID` for authentication continuity across all apps.
