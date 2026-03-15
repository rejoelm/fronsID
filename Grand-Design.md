# FRONS & FRONSCIERS — Grand Design

> **Single source of truth for the FRONS ecosystem.**
> This document describes WHAT the platform is and WHY it exists.
> For HOW to build it, see `CLAUDE.md`.
> Compiled from 9 design sessions, 11,213 lines of specifications.

---

## 1. VISION

Science is broken. Researchers publish papers that disappear behind paywalls. AI companies train on their work without payment. Patient data sits in hospital silos, useless to the researchers who could save lives with it. Indonesian scientists — the primary audience for FRONS — face all of these problems at once, compounded by limited infrastructure and currency barriers.

FRONS fixes this with two products, a personal data vault, and a physical identity card — all connected by Solana blockchain for payments, verification, and true data ownership.

### The Products

**Fronsciers** (fronsciers.id) — An on-chain peer-reviewed research library. Scientists publish papers, earn citations, and get paid when AI uses their work. Every AI citation triggers a $0.01 micro-payment. This is the world's first research library where citations generate income for authors.

**Frons.id** — An evidence-based AI chat engine with zero hallucinations. It uses a 4-tier evidence cascade: first searching Fronsciers (which pays authors), then PubMed, then Scopus, and finally making an honest admission if evidence is insufficient. It never fabricates sources. It charges credits per question.

**My Vault** — An encrypted personal data vault. Think Google Drive, but with client-side AES-256-GCM encryption — the platform literally cannot see your data. Medical records, research datasets, manuscripts. Stored on Walrus decentralized storage with integrity proofs on Solana.

**Fronsciers NFC Card** — A physical card with NTAG 424 DNA chip. Tap it on any phone to see a researcher's public portfolio — publications, citations, earnings, datasets. Rolling CMAC authentication prevents cloning. It's a business card for scientists.

**Admin Console** — An isolated high-security admin portal for the core team. Manages protocol parameters, seeds evidence, monitors analytics.

### Core Principles

1. **Invisible Blockchain** — Users never see gas fees, wallet addresses, or seed phrases. SOL gas is escrowed from subscription payments. Privy handles wallet creation silently.
2. **Zero-Knowledge Vault** — Platform cannot read user data. All encryption happens in the browser. Even metadata (file names, tags) is encrypted.
3. **Synthetic Data Only** — AI and researchers access only synthetic datasets generated from originals. Privacy preserved via k-anonymity + differential privacy.
4. **Every Citation Pays** — On-chain micro-payments for every AI access to research content.
5. **Honest AI** — Better to admit "insufficient evidence" than to hallucinate.

---

## 2. TARGET MARKET

### Primary: Indonesian Researchers and Clinicians

Indonesia has 4,600+ universities, 250,000+ researchers, and a healthcare system serving 275 million people. Indonesian researchers face unique challenges: limited access to expensive journal subscriptions, difficulty earning from publications, and fragmented clinical data. FRONS addresses all three.

### Secondary: Global Independent Researchers

Researchers worldwide who publish outside traditional journal systems. They need discoverable, citable, and monetizable publications. Fronsciers gives them an alternative to the traditional publishing oligopoly.

### Tertiary: Patients and Healthcare Consumers

Patients who want evidence-based health information without hallucinations. Frons.id provides this through the evidence cascade, with transparent source citations and confidence scores.

---

## 3. MONETIZATION

### How FRONS Makes Money

**Subscription revenue** — Six tiers from free to $99.99/month enterprise. Subscriptions cover infrastructure: vault storage, SOL gas escrow, file limits, team seats. 20% annual discount.

**Credit revenue** — Credits power the AI chat and data access. 1 credit = $0.01 USD. AI chat costs 3–10 credits per question. Dataset downloads cost 5–10 credits. Platform keeps 40% of all credit spending.

**Submission fees** — $50 USDC per manuscript submission. Split: 40% platform, 30% sharing pool, 10% author deposit, 20% reserve.

**AI citation fees** — $0.01 per citation via MCP. Split: 40% platform, 20% author, 20% sharing pool, 20% reserve. This is passive income that grows with AI adoption.

### Revenue Split (The Core Economics)

```
Submission Fee ($50 USDC):
  40% → Platform treasury
  30% → Monthly sharing pool (distributed to top researchers)
  10% → Author deposit (returned if published)
  20% → Protocol reserve

AI Citation Fee ($0.01 USDC):
  40% → Platform treasury
  20% → Author (direct to their vault)
  20% → Monthly sharing pool
  20% → Protocol reserve

AI Chat Credit (3–10 credits, $0.03–$0.10):
  40% → Platform treasury
  20% → Authors (if Fronsciers papers cited)
  20% → Monthly sharing pool
  20% → Protocol reserve
```

### Payment Rails

FRONS supports three payment methods to maximize accessibility:

**Stripe** (Global) — Google Pay, Apple Pay, Visa/Mastercard, bank transfer. Standard international payment processing.

**Xendit** (Indonesia) — QRIS (0.63% fee — cheapest in market), Bank VA, GoPay, OVO, DANA, ShopeePay. This is critical for Indonesian adoption. Most target users prefer QRIS or e-wallet payments.

**USDC on Solana** (Crypto) — Direct transfer to treasury wallet. ~$0.001 transaction fee. For crypto-native researchers and institutions.

---

## 4. SUBSCRIPTION TIERS

| Tier | Price/mo | Credits | Vault | Files | SOL Gas | Seats |
|---|---|---|---|---|---|---|
| Free | $0 | 20 | 100MB | 3 | — | 1 |
| Starter | $0.99 | 100 | 1GB | 50 | $0.30 | 1 |
| Researcher | $3.99 | 500 | 5GB | 500 | $0.60 | 1 |
| Pro | $9.99 | 1,500 | 25GB | Unlimited | $1.50 | 1 |
| Institution | $29.99 | 5,000 | 100GB | Unlimited | $5.00 | 10 |
| Enterprise | $99.99 | 20,000 | 1TB | Unlimited | $15.00 | 50 |

Annual billing: 20% discount on all paid tiers.

---

## 5. THE EVIDENCE CASCADE

This is the heart of Frons.id. When a user asks a question, the system searches for evidence in this exact order:

**Tier 1: Fronsciers** — Search the on-chain library first. If relevant papers found, cite them. Each citation triggers a $0.01 payment to the author. This is the monetization engine — Fronsciers papers get priority because citing them generates revenue for researchers.

**Tier 2: PubMed** — If Fronsciers has insufficient evidence, search PubMed via NCBI E-utilities API. Cite with PMID. Free to access but doesn't pay Fronsciers authors.

**Tier 3: Scopus** — If PubMed is insufficient, search Scopus via Elsevier API. Cite with Scopus ID. Requires API key.

**Tier 4: Honest Admission** — If none of the above provide sufficient evidence: "Based on available evidence, I cannot provide a definitive answer to this question. Here's what I do know: [partial context from earlier tiers]." The response is flagged with `is_honest_admission=true`. Never hallucinate. No source = no claim.

Every response includes a confidence score (0.0–1.0), a source list with identifiers, and a credit charge breakdown.

---

## 6. THE VAULT (Zero-Knowledge Encryption)

### What It Is

A Google Drive-like file manager where every file is encrypted in the user's browser before upload. The server stores only encrypted blobs. Even file names and tags are encrypted. The platform cannot read, search, or analyze user data.

### How Encryption Works

```
User passphrase + wallet signature
    → PBKDF2 (100,000 iterations, SHA-512) → master key
    → HKDF("file-encryption") → File Encryption Key (FEK)
    → HKDF("metadata-encryption") → Metadata Encryption Key (MEK)

Per file:
    Random 96-bit nonce + FEK → AES-256-GCM → encrypted blob + auth tag
    File name + tags + description → MEK → encrypted metadata
```

### Upload Flow

1. User selects file in browser
2. Browser computes SHA-256 hash of original
3. Browser encrypts with FEK (AES-256-GCM)
4. Browser encrypts metadata with MEK
5. Encrypted blob → Walrus (decentralized storage)
6. Metadata → Supabase (encrypted fields only)
7. SHA-256 hash → Solana (integrity proof)
8. Gas deducted from user's escrow

### Recovery

12-word recovery phrase generated at vault setup. Phrase → deterministic seed → wallet signature → same PBKDF2 derivation → same FEK and MEK → all files decryptable.

### Sharing

File owner generates a time-limited, scope-limited access token. Recipient (e.g., a doctor) scans a QR code → decrypts only the specific shared file. No access to other vault contents. Access logged on-chain.

---

## 7. SYNTHETIC DATA PIPELINE

### Why

Researchers need data. Patients need privacy. Synthetic data satisfies both.

### Three-Stage Pipeline

**Stage 1: STRIP** — Remove direct identifiers (names, IDs, phone numbers). Generalize quasi-identifiers (exact age → 5-year bands, exact address → district level).

**Stage 2: PERTURB** — Add calibrated Laplace noise (ε=1.0 differential privacy). Preserve statistical distributions. Maintain correlations between variables.

**Stage 3: COMPRESS** — Type optimization (float64 → float32 where safe). Output as Parquet with Snappy compression. Typical 75% size reduction.

### Privacy Guarantees

- k-anonymity with k≥5 (every record is indistinguishable from at least 4 others)
- ε-differential privacy with ε=1.0 (adding/removing one record changes output negligibly)
- No re-identification possible from synthetic output

---

## 8. NFC CARD

### Physical Specifications

- NTAG 424 DNA chip (military-grade NFC authentication)
- Rolling CMAC (Cipher-based Message Authentication Code) — each tap generates a unique cryptographic signature
- Counter increments prevent replay attacks
- Card UID is unique and non-clonable

### Tap Flow

1. Recipient taps phone on card
2. Phone reads NFC URL: `card.fronsciers.id/p/{slug}?cmac={value}&ctr={counter}`
3. Server validates CMAC against stored SUN key and counter
4. If valid: display public profile with publications, citations, earnings
5. If invalid (clone attempt): show error
6. Tap logged with timestamp, location, user-agent

### Public Profile Shows

- Display name, title, institution
- Published papers with DOCI links
- Citation count and h-index
- Published synthetic datasets
- Total earnings (optional)
- On-chain verification badge (Soulbound Token)

---

## 9. MCP SERVER (AI Gateway)

### Purpose

The MCP server makes Fronsciers content available to all AI assistants (Claude, GPT, Perplexity, etc.) via the Model Context Protocol. This is how citations generate revenue.

### Tool Design

| Tool | Cost | Purpose |
|---|---|---|
| `search_articles` | Free | Discovery — search the library |
| `get_article_abstract` | Free | Teaser — read the abstract |
| `cite_and_access` | $0.01 | Revenue — full text, triggers citation payment |
| `get_researcher_profile` | Free | Directory — look up researchers |
| `get_trending_research` | Free | Discovery — trending papers by field |
| `get_citation_stats` | Free | Analytics — citation data for a paper |

Search and abstracts are free because they drive discovery. Full-text access costs $0.01 because that's the value exchange — AI gets content, author gets paid.

### Anti-Crawl Protection

Known AI training bots are blocked: GPTBot, ChatGPT-User, Google-Extended, ClaudeBot, CCBot, Bytespider, PerplexityBot, Scrapy. API rate limiting: per-hour and per-day caps per API key/IP. Full-text access requires x402 payment. Robots.txt blocks unauthorized crawling.

---

## 10. DESIGN SYSTEM

### Brand Identity

The FRONS brand is built around a scholarly white bear mascot — approachable, trustworthy, academic. The bear wears glasses, a navy blazer, and an orange-striped tie, with pink cheeks. This mascot appears across all products in various poses.

### Color Palette

| Color | Hex | Usage |
|---|---|---|
| Navy | #2C337A | Primary buttons, text, headers |
| Lavender | #E5E0FE | Backgrounds, borders, active states |
| Pink | #FFC6DE | Accents, highlights |
| Orange | #FB7720 | CTAs, earning badges, popular tags |
| Off-white | #F8F8FD | Page backgrounds |
| Green | #10b981 | Success, active status |
| Red | #ef4444 | Error, rejected |
| Amber | #f59e0b | Warning, pending |

### Typography

DM Sans across all products. H1 at 70px navy with -3 letter-spacing. H2 at 40px navy. Body at 16px gray-700. Consistent across web, NFC card profile, and admin dashboard.

### Mascot Appearances

Hero section (waving), vault sidebar (reading), upload banner (encouraging), footer (small logo), admin sidebar (professional), loading states (reading animation), error pages (confused), empty states (searching).

---

## 11. TECHNOLOGY DECISIONS

| Decision | Chosen | Over | Reasoning |
|---|---|---|---|
| Blockchain | Solana | Ethereum | Sub-cent fees ($0.001 vs $5+), sub-second settlement. Critical for $0.01 micro-payments. |
| Database | Supabase | Custom PostgreSQL | Built-in FTS, RLS, real-time, auth, free tier. No vendor lock-in. |
| File Storage | Walrus | IPFS | Programmable, 4.5x replication (not 100x), cost-effective, Solana-native. |
| Encryption | Client-side AES-256-GCM | Server-side | Zero-knowledge. Platform can't be compelled to reveal data. |
| Synthetic Data | Laplace + k-anonymity | Simple anonymization | Formal privacy guarantees. Researchers get useful data; patients get privacy. |
| Revenue Model | Subscription + credits | Pure subscription | Subscriptions cover infrastructure; credits price AI compute fairly. |
| NFC Chip | NTAG 424 DNA | Standard NFC | Military-grade. Rolling CMAC prevents cloning. |
| Auth | Privy | Custom wallet | Users never see wallets, seed phrases, or gas. |
| Font | DM Sans | Various | Consistent, readable, works across all products and languages. |
| Indonesian Payments | Xendit/QRIS | Stripe-only | 0.63% fee, supports all local e-wallets. Essential for target market. |
| AI Evidence Order | Fronsciers → PubMed → Scopus → Honest | Random/equal | Fronsciers first = authors earn money. Honest last = never hallucinate. |
| Mascot | Scholarly bear | Abstract logo | Creates warmth and trust for an academic audience. Memorable brand. |

---

## 12. REPOSITORY STRUCTURE

The codebase is organized as a monorepo with independent applications:

```
frons-platform/
├── CLAUDE.md              — Build instructions (for Claude Code)
├── Grand-Design.md        — This file (project spec)
│
├── apps/
│   ├── frons-fe-main/     — Fronsciers Library (Next.js, port 3000)
│   ├── frons-chat-main/   — Frons.id AI Chat + Vault (Next.js, port 3002)
│   ├── frons-card-main/   — NFC Card profiles (Next.js, port 3003)
│   ├── frons-admin-main/  — Admin Console (Next.js, port 3004)
│   ├── frons-j-fe/        — FRONS-J journal management (Next.js)
│   └── mcp-server/        — AI Gateway (Python/FastMCP)
│
├── programs/
│   └── fronsciers/        — Solana smart contract (Anchor/Rust)
│
├── packages/
│   └── supabase/
│       └── migrations/    — 24 SQL migration files
│
├── scripts/
│   ├── indexer.py         — Solana → Supabase event sync
│   ├── synthetic_pipeline.py — Privacy-preserving data generation
│   └── e2e_test.py        — End-to-end integration test
│
└── docs/                  — Architecture documents from design sessions
```

Each frontend app is independent but shares Privy auth, Supabase data layer, and Solana payment layer.

---

## 13. SECURITY MODEL

### Access Control

| Entity | Sees | Cannot See |
|---|---|---|
| Data Owner | Everything (own data) | Other users' data |
| Frons AI Chat | Synthetic data only | Original data, patient IDs |
| Fronsciers Users | Synthetic data (download) | Original data, metadata |
| Doctor (QR share) | Specific shared files only | Other vault files |
| NFC Tap Recipient | Public profile + papers | Vault, clinical, personal |
| Platform Admin | Encrypted blobs + stats | Decryption keys, plaintext |
| Attacker (breach) | Encrypted blobs | Anything useful |

### Key Security Properties

- **Vault**: Zero-knowledge. Server breach reveals only encrypted blobs.
- **Payments**: All USDC amounts use 6 decimals (Solana standard). Atomic credit operations prevent double-spend.
- **Auth**: Privy-managed wallets with social recovery. No seed phrase exposure.
- **API**: Rate limiting, x402 paywall, blocked bot list.
- **NFC**: Rolling CMAC, counter-based replay prevention, SUN authentication.

---

## 14. ROADMAP

### Phase 1: Foundation (Months 1–3)
Database, smart contract, auth, payments. The boring infrastructure that everything else depends on.

### Phase 2: Core Products (Months 3–6)
Fronsciers library, Frons.id AI chat, My Vault. The three products that define FRONS.

### Phase 3: Ecosystem (Months 6–9)
NFC cards, admin console, MCP server, synthetic data pipeline. The connective tissue.

### Phase 4: Scale (Months 9–12)
Bahasa Indonesia i18n, institutional onboarding, FRONS-J journal management, mobile apps, marketing.

---

## 15. GLOSSARY

| Term | Definition |
|---|---|
| DOCI | Digital Object Citation Identifier — Fronsciers' equivalent of DOI (e.g., 10.fronsciers/2026.0042) |
| Evidence Cascade | The 4-tier search system: Fronsciers → PubMed → Scopus → honest admission |
| FEK | File Encryption Key — derived from master key via HKDF, used for vault file encryption |
| MEK | Metadata Encryption Key — derived from master key via HKDF, used for file name/tag encryption |
| MCP | Model Context Protocol — the standard for connecting AI assistants to external tools |
| Sharing Pool | Monthly USDC pool distributed to top researchers based on impact scores |
| SBT | Soulbound Token — non-transferable NFT used for researcher credential verification |
| SUN | Secure Unique NFC — the authentication message generated by NTAG 424 DNA on each tap |
| x402 | HTTP payment middleware — blocks full-text access until citation fee is paid |
