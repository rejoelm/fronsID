# CLAUDE.md — FRONS & FRONSCIERS Complete Project Specification

> **This is the single source of truth for the entire FRONS platform.**
> Every architecture decision, database table, smart contract instruction,
> API endpoint, and UI component is documented here.
> Compiled from 9 design sessions, 11,213 lines of specifications.

---

## 1. PROJECT OVERVIEW

### What Is FRONS?

FRONS is an ecosystem of two products, a personal data vault, and a physical NFC identity card — all connected by Solana blockchain for payments, verification, and true data ownership.

**Fronsciers** (fronsciers.id) — On-chain peer-reviewed research library. Scientists publish papers, earn citations, and get paid when AI uses their work. Every AI citation triggers a $0.01 micro-payment split 40% platform / 20% author / 20% sharing pool / 20% reserve.

**Frons.id** — Evidence-based AI chat engine with zero hallucinations. Uses a 4-tier evidence cascade (Fronsciers → PubMed → Scopus → honest admission). Never fabricates sources. Charges credits per question (3-10 credits, $0.03-$0.10).

**My Vault** — Encrypted personal data vault. Google Drive-like interface for medical records, research datasets, manuscripts. Client-side AES-256-GCM encryption — the platform never sees plaintext data. Stored on Walrus decentralized storage with SHA-256 proof on Solana.

**Fronsciers NFC Card** — Physical card with NTAG 424 DNA chip. Tap on any phone → public research portfolio. Recipients see published work at a glance but cannot access private vault data. Rolling CMAC authentication prevents cloning.

### Core Design Principles

1. **Invisible Blockchain** — Users never see gas fees, wallet addresses, or seed phrases. SOL gas is escrowed from subscription payments. Privy handles wallet creation silently.
2. **Zero-Knowledge Vault** — Platform cannot read user data. All encryption happens in the browser. Even metadata (file names, tags) is encrypted.
3. **Synthetic Data Only** — AI and researchers access only synthetic datasets generated from originals. Privacy preserved via k-anonymity + differential privacy.
4. **Every Citation Pays** — On-chain micro-payments for every AI access to research content.
5. **Honest AI** — Better to admit "insufficient evidence" than to hallucinate.

---

## 2. SYSTEM ARCHITECTURE

```
                         Users (Researchers, Patients, Doctors)
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
              ┌─────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
              │ Frons.id   │   │ Fronsciers  │   │ NFC Card    │
              │ (AI Chat)  │   │ (Library)   │   │ (Profile)   │
              │ Next.js    │   │ Next.js     │   │ Next.js     │
              └─────┬──────┘   └──────┬──────┘   └──────┬──────┘
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
              ┌─────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
              │ MCP Server │   │ Supabase    │   │ Solana      │
              │ (FastMCP)  │   │ (Database)  │   │ (Payments)  │
              │ Python     │   │ PostgreSQL  │   │ Anchor/Rust │
              └─────┬──────┘   └──────┬──────┘   └──────┬──────┘
                    │                  │                  │
              ┌─────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
              │ External   │   │ Walrus      │   │ Jupiter     │
              │ APIs       │   │ (Files)     │   │ (SOL swap)  │
              │ PubMed     │   │ Decentralized│  │ Auto gas    │
              │ Scopus     │   │ Encrypted   │   │ purchase    │
              │ CrossRef   │   │ Storage     │   │             │
              └────────────┘   └─────────────┘   └─────────────┘
```

---

## 3. TECH STACK

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Blockchain | Solana | Latest | Payments, NFTs, citations, proofs |
| Smart Contract | Rust + Anchor | 0.31.0 | On-chain logic |
| Database | Supabase (PostgreSQL) | Latest | Full-text search, metadata, users, analytics |
| Frontend | Next.js + React + Tailwind | 15 / 19 / v4 | Web application |
| AI Gateway | Python + FastMCP | 3.11+ | MCP server for Claude/AI access |
| API Paywall | x402 HTTP middleware | Custom | Pay-per-citation |
| Auth | Privy | Latest | Embedded wallets, social login |
| Encrypted Storage | Walrus | Mainnet | Decentralized file storage |
| NFC | NTAG 424 DNA | — | Physical card authentication |
| Payments | Stripe + Xendit + USDC | Latest | Global + Indonesia + crypto |
| Frontend Hosting | Vercel | Latest | CDN + serverless |
| Server Hosting | Railway | Latest | MCP server + indexer |

---

## 4. DATABASE SCHEMA (Supabase — 24 Migrations)

### Migration 001: articles
```sql
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doci TEXT UNIQUE,                           -- "10.fronsciers/2026.0042"
    title TEXT NOT NULL,
    abstract TEXT,
    content TEXT,                               -- full text for search/AI
    authors JSONB,                              -- [{wallet, name, affiliation}]
    keywords TEXT[],
    field_of_study TEXT,
    ipfs_hash TEXT,
    walrus_blob_id TEXT,
    solana_manuscript_pubkey TEXT,
    solana_doci_mint TEXT,                      -- NFT mint address
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending','in_review','accepted','rejected','published')),
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    publication_date TIMESTAMPTZ,
    citation_count INTEGER DEFAULT 0,
    access_count INTEGER DEFAULT 0,
    impact_score NUMERIC(8,4) DEFAULT 0,
    journal_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search with weighted ranking
ALTER TABLE articles ADD COLUMN fts tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(abstract, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'C')
    ) STORED;
CREATE INDEX articles_fts_idx ON articles USING GIN(fts);
CREATE INDEX idx_articles_doci ON articles (doci);
CREATE INDEX idx_articles_status ON articles (status);
```

### Migration 002: researchers
```sql
CREATE TABLE researchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    privy_user_id TEXT,
    name TEXT,
    email TEXT,
    institution TEXT,
    education TEXT,
    specializations TEXT[] DEFAULT '{}',
    h_index NUMERIC(6,2) DEFAULT 0,
    total_citations INTEGER DEFAULT 0,
    total_earnings_usdc NUMERIC(12,2) DEFAULT 0,
    leaderboard_rank INTEGER,
    frons_id_card_active BOOLEAN DEFAULT FALSE,
    orcid TEXT,
    google_scholar_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_researchers_wallet ON researchers (wallet_address);
```

### Migration 003: citations
```sql
CREATE TABLE citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id),
    citing_agent TEXT,                          -- "claude", "gpt-4", "perplexity"
    citing_context TEXT,
    solana_tx_signature TEXT,
    fee_usdc NUMERIC(10,6),
    author_payout NUMERIC(10,6),
    pool_payout NUMERIC(10,6),
    platform_payout NUMERIC(10,6),
    reserve_payout NUMERIC(10,6),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_citations_article ON citations (article_id, created_at DESC);
```

### Migration 004: leaderboard
```sql
CREATE TABLE leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period TEXT NOT NULL,                       -- "2026-03"
    researcher_id UUID REFERENCES researchers(id),
    impact_score NUMERIC(8,4),
    citation_count INTEGER,
    pcs_score NUMERIC(8,4),                    -- Peer Citation Score
    sss_score NUMERIC(8,4),                    -- Staking Significance Score
    tis_score NUMERIC(8,4),                    -- Time-based Influence Score
    pool_payout_usdc NUMERIC(12,2) DEFAULT 0,
    rank INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(period, researcher_id)
);
```

### Migration 005: reviews
```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id),
    reviewer_id UUID NOT NULL REFERENCES researchers(id),
    decision TEXT CHECK (decision IN ('accepted','rejected','revise')),
    feedback TEXT,
    solana_tx_signature TEXT,
    is_ai_review BOOLEAN DEFAULT FALSE,
    ai_confidence_score NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, reviewer_id)
);
```

### Migration 006: row_level_security
```sql
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Public read on articles and leaderboard
CREATE POLICY "Public read articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read leaderboard" ON leaderboard FOR SELECT USING (true);

-- Users manage own profile
CREATE POLICY "Users read own profile" ON researchers FOR SELECT
    USING (wallet_address = auth.uid()::text);
CREATE POLICY "Users update own profile" ON researchers FOR UPDATE
    USING (wallet_address = auth.uid()::text);

-- Service role for write operations
CREATE POLICY "Service manages articles" ON articles FOR ALL
    USING (auth.role() = 'service_role');
CREATE POLICY "Service manages citations" ON citations FOR ALL
    USING (auth.role() = 'service_role');
CREATE POLICY "Service manages reviews" ON reviews FOR ALL
    USING (auth.role() = 'service_role');
```

### Migration 007: search_function
```sql
-- 3-tier search with ranking
CREATE OR REPLACE FUNCTION search_articles(
    search_query TEXT,
    max_results INTEGER DEFAULT 20
) RETURNS TABLE (
    id UUID, doci TEXT, title TEXT, abstract TEXT,
    authors JSONB, citation_count INTEGER,
    impact_score NUMERIC, rank REAL
) AS $$
BEGIN
    -- Tier 1: Exact DOCI match
    IF search_query ~ '^10\.fronsciers/' THEN
        RETURN QUERY
        SELECT a.id, a.doci, a.title, a.abstract, a.authors,
               a.citation_count, a.impact_score, 1.0::REAL
        FROM articles a WHERE a.doci = search_query AND a.status = 'published';
        IF FOUND THEN RETURN; END IF;
    END IF;

    -- Tier 2: Full-text search
    RETURN QUERY
    SELECT a.id, a.doci, a.title, a.abstract, a.authors,
           a.citation_count, a.impact_score,
           ts_rank(a.fts, websearch_to_tsquery('english', search_query))
    FROM articles a
    WHERE a.fts @@ websearch_to_tsquery('english', search_query)
        AND a.status = 'published'
    ORDER BY ts_rank(a.fts, websearch_to_tsquery('english', search_query)) DESC
    LIMIT max_results;

    IF NOT FOUND THEN
        -- Tier 3: ILIKE fallback
        RETURN QUERY
        SELECT a.id, a.doci, a.title, a.abstract, a.authors,
               a.citation_count, a.impact_score, 0.1::REAL
        FROM articles a
        WHERE (a.title ILIKE '%' || search_query || '%'
            OR a.abstract ILIKE '%' || search_query || '%')
            AND a.status = 'published'
        ORDER BY a.citation_count DESC
        LIMIT max_results;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### Migration 008: journals
```sql
CREATE TABLE journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    issn TEXT UNIQUE,
    scope TEXT,
    editor_wallet TEXT NOT NULL,
    submission_fee_usdc NUMERIC(10,2) DEFAULT 50,
    review_type TEXT DEFAULT 'double_blind'
        CHECK (review_type IN ('single_blind','double_blind','open')),
    min_reviewers INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES journals(id),
    user_id UUID NOT NULL REFERENCES researchers(id),
    role TEXT NOT NULL CHECK (role IN ('editor','associate_editor','reviewer','author')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(journal_id, user_id, role)
);
```

### Migration 009: encrypted_manuscripts
```sql
CREATE TABLE manuscript_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id),
    user_id UUID NOT NULL REFERENCES researchers(id),
    encrypted_document_key TEXT NOT NULL,       -- AES key encrypted with user's pubkey
    key_type TEXT DEFAULT 'aes-256-gcm',
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    UNIQUE(article_id, user_id)
);

CREATE TABLE manuscript_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id),
    user_id UUID NOT NULL REFERENCES researchers(id),
    access_type TEXT CHECK (access_type IN ('author','reviewer','editor','admin')),
    manuscript_storage_path TEXT,
    granted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 010: data_commons
```sql
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID NOT NULL REFERENCES researchers(id),
    title TEXT NOT NULL,
    description TEXT,
    columns_schema JSONB,                      -- [{name, type, is_identifier, is_quasi}]
    row_count INTEGER,
    format TEXT CHECK (format IN ('csv','xlsx','json','parquet')),
    size_bytes BIGINT,
    license TEXT DEFAULT 'CC-BY-4.0',
    access_level TEXT DEFAULT 'synthetic_only'
        CHECK (access_level IN ('public','synthetic_only','restricted','private')),
    walrus_blob_id TEXT,
    encryption_key_hash TEXT,
    sha256_hash TEXT,
    solana_tx_sig TEXT,
    data_doi TEXT UNIQUE,
    tags TEXT[] DEFAULT '{}',
    field_of_study TEXT,
    download_count INTEGER DEFAULT 0,
    total_revenue_usdc NUMERIC(10,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dataset_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES datasets(id),
    accessor_id UUID REFERENCES researchers(id),
    access_type TEXT CHECK (access_type IN ('preview','download','api_query','ai_chat')),
    credits_charged INTEGER DEFAULT 0,
    revenue_to_uploader NUMERIC(10,4) DEFAULT 0,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 011: credential_tokens
```sql
CREATE TABLE credential_types (
    id TEXT PRIMARY KEY,                       -- 'verified_researcher', 'medical_professional'
    display_name TEXT NOT NULL,
    requirements TEXT,
    verification_method TEXT                   -- 'orcid_api', 'manual_review', 'ai_check'
);

INSERT INTO credential_types VALUES
    ('verified_researcher', 'Verified Researcher', '≥1 indexed publication', 'orcid_api'),
    ('frons_scholar', 'FRONS Scholar', 'Academic email + CV', 'manual_review'),
    ('medical_professional', 'Medical Professional', 'STR/SIP license', 'manual_review'),
    ('senior_reviewer', 'Senior Reviewer', '≥10 completed reviews', 'automatic'),
    ('institution_admin', 'Institution Admin', 'Verified by FRONS', 'manual_review');

CREATE TABLE user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES researchers(id),
    credential_type TEXT NOT NULL REFERENCES credential_types(id),
    solana_sbt_mint TEXT,                      -- Soulbound token mint address
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    verification_data JSONB,                   -- {orcid, publications_count, etc.}
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending','verified','revoked','expired')),
    UNIQUE(user_id, credential_type)
);
```

### Migration 012: publication_nfts
```sql
CREATE TABLE publication_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id),
    mint_address TEXT UNIQUE NOT NULL,
    doci TEXT NOT NULL,
    metadata_uri TEXT,
    authors_split JSONB,                       -- [{wallet, share_bps}]
    minted_at TIMESTAMPTZ DEFAULT NOW(),
    solana_tx_sig TEXT
);

CREATE TABLE nft_revenue_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_id UUID NOT NULL REFERENCES publication_nfts(id),
    citation_id UUID REFERENCES citations(id),
    amount_usdc NUMERIC(10,6),
    distributed_to JSONB,                      -- [{wallet, amount}]
    solana_tx_sig TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 013: reviewer_discovery
```sql
CREATE TABLE reviewer_expertise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES researchers(id),
    fields TEXT[] NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    max_reviews_per_month INTEGER DEFAULT 5,
    is_available BOOLEAN DEFAULT TRUE,
    response_rate NUMERIC(5,2) DEFAULT 100,
    avg_review_days NUMERIC(5,1),
    completed_reviews INTEGER DEFAULT 0,
    UNIQUE(user_id)
);

CREATE TABLE review_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id),
    reviewer_id UUID NOT NULL REFERENCES researchers(id),
    status TEXT DEFAULT 'invited'
        CHECK (status IN ('invited','accepted','declined','in_progress','completed','expired')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    deadline TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(article_id, reviewer_id)
);
```

### Migration 014: ai_review_fallback
```sql
CREATE TABLE ai_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id),
    priority INTEGER DEFAULT 0,
    reason TEXT,                                -- 'insufficient_human_reviewers', 'express_review'
    status TEXT DEFAULT 'queued'
        CHECK (status IN ('queued','processing','completed','failed')),
    assigned_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE ai_review_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES ai_review_queue(id),
    article_id UUID NOT NULL REFERENCES articles(id),
    model_used TEXT DEFAULT 'claude-sonnet-4-20250514',
    confidence_score NUMERIC(5,2),
    decision TEXT CHECK (decision IN ('accept','reject','revise','uncertain')),
    feedback_text TEXT,
    methodology_score NUMERIC(5,2),
    novelty_score NUMERIC(5,2),
    clarity_score NUMERIC(5,2),
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 015: platform_settings
```sql
CREATE TABLE platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID
);

CREATE TABLE admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES researchers(id),
    role TEXT NOT NULL CHECK (role IN ('super_admin','content_admin','finance_admin','support')),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID,
    UNIQUE(user_id, role)
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES researchers(id),
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 016: anti_crawl
```sql
CREATE TABLE blocked_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern TEXT NOT NULL UNIQUE,               -- regex pattern to match
    agent_name TEXT,                            -- "GPTBot", "ChatGPT-User"
    blocked_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO blocked_agents (pattern, agent_name) VALUES
    ('GPTBot', 'OpenAI GPTBot'),
    ('ChatGPT-User', 'ChatGPT User Agent'),
    ('Google-Extended', 'Google AI Training'),
    ('ClaudeBot', 'Anthropic ClaudeBot'),
    ('CCBot', 'Common Crawl'),
    ('Bytespider', 'ByteDance Spider'),
    ('PerplexityBot', 'Perplexity AI'),
    ('Scrapy', 'Scrapy Framework');

CREATE TABLE api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key TEXT,
    ip_address INET,
    requests_this_hour INTEGER DEFAULT 0,
    requests_this_day INTEGER DEFAULT 0,
    last_request_at TIMESTAMPTZ DEFAULT NOW(),
    is_blocked BOOLEAN DEFAULT FALSE
);
```

### Migration 017: search_analytics
```sql
CREATE TABLE search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    search_tier TEXT,                           -- 'doci_exact', 'fts', 'ilike'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_queries_date ON search_queries (created_at DESC);
```

### Migration 018: evidence_cascade
```sql
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES researchers(id),
    title TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id),
    role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    sources JSONB,                             -- [{source, doci/pmid, title, confidence}]
    credits_charged INTEGER DEFAULT 0,
    tool_calls_count INTEGER DEFAULT 0,
    fronsciers_sources_cited INTEGER DEFAULT 0,
    pubmed_sources_cited INTEGER DEFAULT 0,
    scopus_sources_cited INTEGER DEFAULT 0,
    confidence_score NUMERIC(5,2),
    is_honest_admission BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_conv ON chat_messages (conversation_id, created_at);
```

### Migration 019: credit_system
```sql
CREATE TABLE credit_balances (
    user_id UUID PRIMARY KEY REFERENCES researchers(id),
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    lifetime_purchased INTEGER DEFAULT 0,
    lifetime_earned INTEGER DEFAULT 0,
    lifetime_spent INTEGER DEFAULT 0,
    last_topped_up_at TIMESTAMPTZ,
    last_spent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES researchers(id),
    amount INTEGER NOT NULL,                   -- positive = credit, negative = debit
    balance_after INTEGER NOT NULL,
    tx_type TEXT NOT NULL CHECK (tx_type IN (
        'purchase','signup_bonus','monthly_refill','review_bonus',
        'chat_spend','data_access','data_query','vault_upload',
        'refund','admin_grant','promo_code','referral_bonus'
    )),
    payment_provider TEXT CHECK (payment_provider IN ('stripe','xendit','usdc_solana','admin',NULL)),
    payment_ref TEXT,
    payment_method TEXT,
    payment_currency TEXT,
    payment_amount NUMERIC(12,2),
    payment_amount_usd NUMERIC(10,4),
    chat_conversation_id UUID,
    chat_message_index INTEGER,
    tool_calls_count INTEGER,
    fronsciers_sources_cited INTEGER DEFAULT 0,
    external_sources_cited INTEGER DEFAULT 0,
    rev_platform NUMERIC(10,6) DEFAULT 0,
    rev_author NUMERIC(10,6) DEFAULT 0,
    rev_sharing_pool NUMERIC(10,6) DEFAULT 0,
    rev_protocol_reserve NUMERIC(10,6) DEFAULT 0,
    dataset_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ct_user ON credit_transactions (user_id, created_at DESC);
CREATE INDEX idx_ct_type ON credit_transactions (tx_type);

CREATE TABLE pending_crypto_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_ref TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES researchers(id),
    package_id TEXT NOT NULL,
    expected_amount_usdc NUMERIC(10,4) NOT NULL,
    treasury_token_account TEXT NOT NULL,
    credits_on_confirm INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','confirmed','expired','failed')),
    solana_tx TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    credits_granted INTEGER NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Atomic credit deduction (prevents negative balance, race conditions)
CREATE OR REPLACE FUNCTION spend_credits(
    p_user_id UUID, p_amount INTEGER, p_tx_type TEXT,
    p_chat_conversation_id UUID DEFAULT NULL,
    p_chat_message_index INTEGER DEFAULT NULL,
    p_tool_calls INTEGER DEFAULT NULL,
    p_fronsciers_cited INTEGER DEFAULT 0,
    p_external_cited INTEGER DEFAULT 0,
    p_dataset_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_bal INTEGER; v_new INTEGER; v_usd NUMERIC;
    v_rp NUMERIC; v_ra NUMERIC; v_rs NUMERIC; v_rr NUMERIC;
BEGIN
    SELECT balance INTO v_bal FROM credit_balances
    WHERE user_id = p_user_id FOR UPDATE;
    IF v_bal IS NULL THEN
        RETURN '{"success":false,"error":"NO_ACCOUNT"}'::jsonb;
    END IF;
    IF v_bal < p_amount THEN
        RETURN jsonb_build_object('success',false,'error','INSUFFICIENT_CREDITS',
            'balance',v_bal,'required',p_amount);
    END IF;
    v_new := v_bal - p_amount;
    v_usd := p_amount * 0.01;
    v_rp := v_usd * 0.40;
    IF p_fronsciers_cited > 0 THEN
        v_ra := p_fronsciers_cited * 0.01;
        v_rs := (v_usd - v_rp - v_ra) * 0.50;
        v_rr := v_usd - v_rp - v_ra - v_rs;
    ELSE
        v_ra := 0; v_rs := v_usd * 0.30; v_rr := v_usd * 0.30;
    END IF;
    UPDATE credit_balances SET balance=v_new,
        lifetime_spent=lifetime_spent+p_amount,
        last_spent_at=NOW(), updated_at=NOW()
    WHERE user_id=p_user_id;
    INSERT INTO credit_transactions (user_id,amount,balance_after,tx_type,
        payment_amount_usd,chat_conversation_id,chat_message_index,
        tool_calls_count,fronsciers_sources_cited,external_sources_cited,
        dataset_id,rev_platform,rev_author,rev_sharing_pool,rev_protocol_reserve)
    VALUES (p_user_id,-p_amount,v_new,p_tx_type,v_usd,
        p_chat_conversation_id,p_chat_message_index,p_tool_calls,
        p_fronsciers_cited,p_external_cited,p_dataset_id,
        v_rp,v_ra,v_rs,v_rr);
    RETURN jsonb_build_object('success',true,'credits_spent',p_amount,
        'balance_remaining',v_new,'cost_usd',v_usd);
END; $$ LANGUAGE plpgsql;

-- Add credits after payment
CREATE OR REPLACE FUNCTION add_credits(
    p_user_id UUID, p_amount INTEGER, p_tx_type TEXT,
    p_payment_provider TEXT DEFAULT NULL,
    p_payment_ref TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT NULL,
    p_payment_currency TEXT DEFAULT NULL,
    p_payment_amount NUMERIC DEFAULT NULL,
    p_payment_amount_usd NUMERIC DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE v_new INTEGER;
BEGIN
    INSERT INTO credit_balances (user_id,balance,lifetime_purchased)
    VALUES (p_user_id,p_amount,p_amount)
    ON CONFLICT (user_id) DO UPDATE SET
        balance = credit_balances.balance + p_amount,
        lifetime_purchased = credit_balances.lifetime_purchased +
            CASE WHEN p_tx_type='purchase' THEN p_amount ELSE 0 END,
        lifetime_earned = credit_balances.lifetime_earned +
            CASE WHEN p_tx_type!='purchase' THEN p_amount ELSE 0 END,
        last_topped_up_at=NOW(), updated_at=NOW()
    RETURNING balance INTO v_new;
    INSERT INTO credit_transactions (user_id,amount,balance_after,tx_type,
        payment_provider,payment_ref,payment_method,
        payment_currency,payment_amount,payment_amount_usd)
    VALUES (p_user_id,p_amount,v_new,p_tx_type,
        p_payment_provider,p_payment_ref,p_payment_method,
        p_payment_currency,p_payment_amount,p_payment_amount_usd);
    RETURN jsonb_build_object('success',true,'credits_added',p_amount,
        'new_balance',v_new);
END; $$ LANGUAGE plpgsql;
```

### Migration 020: platform_settings_seed
```sql
INSERT INTO platform_settings (key, value) VALUES
    ('credit_value_usd', '0.01'),
    ('citation_fee_credits', '1'),
    ('review_bonus_credits', '30'),
    ('referral_bonus_credits', '50'),
    ('signup_bonus_credits', '20'),
    ('tier_starter_price_usd', '0.99'),
    ('tier_researcher_price_usd', '3.99'),
    ('tier_pro_price_usd', '9.99'),
    ('tier_institution_price_usd', '29.99'),
    ('tier_enterprise_price_usd', '99.99'),
    ('annual_discount_percent', '20'),
    ('gas_allocation_starter_sol', '0.002'),
    ('gas_allocation_researcher_sol', '0.004'),
    ('gas_allocation_pro_sol', '0.010'),
    ('gas_allocation_institution_sol', '0.033'),
    ('gas_allocation_enterprise_sol', '0.100'),
    ('walrus_storage_cost_per_gb_month', '0.004'),
    ('signup_sponsor_budget_sol', '0.003'),
    ('max_free_tier_files', '3'),
    ('max_free_tier_storage_mb', '100'),
    ('submission_fee_bps_platform', '4000'),
    ('submission_fee_bps_pool', '3000'),
    ('submission_fee_bps_author', '1000'),
    ('submission_fee_bps_reserve', '2000')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Migration 021: subscriptions_and_gas
```sql
CREATE TABLE subscriptions (
    user_id UUID PRIMARY KEY REFERENCES researchers(id),
    tier TEXT NOT NULL DEFAULT 'free'
        CHECK (tier IN ('free','starter','researcher','pro','institution','enterprise')),
    billing_cycle TEXT DEFAULT 'monthly'
        CHECK (billing_cycle IN ('monthly','annual')),
    payment_provider TEXT,
    payment_method TEXT,
    external_subscription_id TEXT,
    vault_limit_bytes BIGINT DEFAULT 104857600,  -- 100MB free
    vault_used_bytes BIGINT DEFAULT 0,
    file_count INTEGER DEFAULT 0,
    file_limit INTEGER DEFAULT 3,
    monthly_nft_mints_used INTEGER DEFAULT 0,
    monthly_nft_limit INTEGER DEFAULT 0,
    monthly_tx_limit INTEGER DEFAULT 10,
    api_calls_used INTEGER DEFAULT 0,
    api_calls_limit INTEGER DEFAULT 0,
    team_seats INTEGER DEFAULT 1,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active'
        CHECK (status IN ('active','past_due','canceled','trialing')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gas_escrow (
    user_id UUID PRIMARY KEY REFERENCES researchers(id),
    sol_balance_lamports BIGINT NOT NULL DEFAULT 0,
    lifetime_deposited_lamports BIGINT DEFAULT 0,
    lifetime_spent_lamports BIGINT DEFAULT 0,
    tx_count_this_month INTEGER DEFAULT 0,
    monthly_tx_limit INTEGER DEFAULT 10,
    escrow_pda_address TEXT,
    last_deposit_at TIMESTAMPTZ,
    last_spent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gas_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES researchers(id),
    lamports_spent BIGINT NOT NULL,
    solana_tx_sig TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'account_setup','file_upload_hash','nft_mint','citation_record',
        'file_share_grant','data_nft_mint','walrus_storage','payout_settlement'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gas_tx_user ON gas_transactions (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION check_gas_budget(
    p_user_id UUID, p_estimated_lamports BIGINT
) RETURNS JSONB AS $$
DECLARE v_bal BIGINT; v_tx INTEGER; v_lim INTEGER;
BEGIN
    SELECT sol_balance_lamports, tx_count_this_month, monthly_tx_limit
    INTO v_bal, v_tx, v_lim FROM gas_escrow WHERE user_id = p_user_id;
    IF v_bal IS NULL THEN RETURN '{"ok":false,"error":"NO_ESCROW"}'::jsonb; END IF;
    IF v_tx >= v_lim THEN RETURN '{"ok":false,"error":"TX_LIMIT_REACHED"}'::jsonb; END IF;
    IF v_bal < p_estimated_lamports THEN
        RETURN jsonb_build_object('ok',false,'error','LOW_GAS',
            'balance',v_bal,'needed',p_estimated_lamports);
    END IF;
    RETURN '{"ok":true}'::jsonb;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION spend_gas(
    p_user_id UUID, p_lamports BIGINT, p_tx_sig TEXT, p_action TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE gas_escrow SET
        sol_balance_lamports = sol_balance_lamports - p_lamports,
        lifetime_spent_lamports = lifetime_spent_lamports + p_lamports,
        tx_count_this_month = tx_count_this_month + 1,
        last_spent_at = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id;
    INSERT INTO gas_transactions (user_id, lamports_spent, solana_tx_sig, action_type)
    VALUES (p_user_id, p_lamports, p_tx_sig, p_action);
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reset_monthly_counters() RETURNS VOID AS $$
BEGIN
    UPDATE gas_escrow SET tx_count_this_month = 0;
    UPDATE subscriptions SET monthly_nft_mints_used = 0, api_calls_used = 0;
END; $$ LANGUAGE plpgsql;
```

### Migration 022: nfc_cards
```sql
CREATE TABLE nfc_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES researchers(id),
    card_uid TEXT UNIQUE NOT NULL,
    card_serial TEXT UNIQUE,
    profile_slug TEXT UNIQUE NOT NULL,
    sun_key TEXT NOT NULL,
    cmac_counter INTEGER DEFAULT 0,
    last_tap_at TIMESTAMPTZ,
    total_taps INTEGER DEFAULT 0,
    show_email BOOLEAN DEFAULT FALSE,
    show_institution BOOLEAN DEFAULT TRUE,
    show_citations BOOLEAN DEFAULT TRUE,
    show_earnings BOOLEAN DEFAULT TRUE,
    show_datasets BOOLEAN DEFAULT TRUE,
    custom_bio TEXT,
    status TEXT DEFAULT 'active'
        CHECK (status IN ('active','disabled','lost','replaced')),
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public_profiles (
    user_id UUID PRIMARY KEY REFERENCES researchers(id),
    display_name TEXT NOT NULL,
    title TEXT,
    institution TEXT,
    location TEXT,
    specializations TEXT[] DEFAULT '{}',
    papers_published INTEGER DEFAULT 0,
    total_citations INTEGER DEFAULT 0,
    datasets_published INTEGER DEFAULT 0,
    dataset_downloads INTEGER DEFAULT 0,
    reviews_completed INTEGER DEFAULT 0,
    h_index INTEGER DEFAULT 0,
    total_earnings_usd NUMERIC(10,2) DEFAULT 0,
    member_since TIMESTAMPTZ,
    solana_pubkey TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nfc_tap_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES nfc_cards(id),
    tap_type TEXT NOT NULL CHECK (tap_type IN ('nfc','qr','link')),
    cmac_value TEXT,
    user_agent TEXT,
    ip_address INET,
    country_code TEXT,
    tapped_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 023: vault_files
```sql
CREATE TABLE vault_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES researchers(id),
    name TEXT NOT NULL,                        -- display name (unencrypted for owner)
    name_encrypted TEXT,                       -- AES encrypted for server storage
    tags_encrypted TEXT,
    description_encrypted TEXT,
    file_type TEXT NOT NULL
        CHECK (file_type IN ('clinical','dataset','manuscript','personal')),
    format TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    mime_type TEXT,
    walrus_blob_id TEXT,
    encryption_algorithm TEXT DEFAULT 'AES-256-GCM',
    encryption_nonce TEXT,
    encryption_auth_tag TEXT,
    key_derivation TEXT DEFAULT 'PBKDF2-SHA512-HKDF',
    original_hash TEXT NOT NULL,
    encrypted_hash TEXT,
    sha256_hash TEXT NOT NULL,
    solana_tx_sig TEXT,
    solana_slot BIGINT,
    nft_mint_address TEXT,
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    earning_enabled BOOLEAN DEFAULT FALSE,
    lifetime_earnings_usd NUMERIC(10,4) DEFAULT 0,
    has_synthetic BOOLEAN DEFAULT FALSE,
    synthetic_id UUID,
    dataset_columns JSONB,
    dataset_row_count INTEGER,
    shared_with JSONB DEFAULT '[]',
    active_shares INTEGER DEFAULT 0,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_vault_user ON vault_files (user_id, uploaded_at DESC);
CREATE INDEX idx_vault_type ON vault_files (user_id, file_type);
CREATE INDEX idx_vault_hash ON vault_files (sha256_hash);

CREATE TABLE vault_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES vault_files(id),
    owner_id UUID NOT NULL REFERENCES researchers(id),
    accessor_id UUID,
    accessor_name TEXT,
    access_type TEXT NOT NULL
        CHECK (access_type IN ('view','download','qr_share','api_access')),
    solana_tx_sig TEXT,
    ip_address INET,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 024: synthetic_datasets
```sql
CREATE TABLE synthetic_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_file_id UUID NOT NULL REFERENCES vault_files(id),
    user_id UUID NOT NULL REFERENCES researchers(id),
    walrus_blob_id TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    format TEXT NOT NULL DEFAULT 'parquet',
    compression TEXT DEFAULT 'snappy',
    k_anonymity INTEGER NOT NULL DEFAULT 5,
    epsilon NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    privacy_method TEXT DEFAULT 'laplace_mechanism + k_anonymity',
    columns_removed TEXT[] DEFAULT '{}',
    columns_generalized TEXT[] DEFAULT '{}',
    columns_perturbed TEXT[] DEFAULT '{}',
    row_count INTEGER NOT NULL,
    column_count INTEGER NOT NULL,
    column_names TEXT[] NOT NULL,
    column_types TEXT[] NOT NULL,
    statistical_summary JSONB,
    original_size_bytes BIGINT,
    compression_ratio NUMERIC(5,2),
    synthetic_hash TEXT NOT NULL,
    integrity_proof_tx TEXT,
    download_count INTEGER DEFAULT 0,
    total_revenue_usd NUMERIC(10,4) DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE synthetic_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    synthetic_id UUID NOT NULL REFERENCES synthetic_datasets(id),
    accessor_id UUID REFERENCES researchers(id),
    access_type TEXT NOT NULL
        CHECK (access_type IN ('preview','download','api_query','ai_chat')),
    credits_charged INTEGER DEFAULT 0,
    revenue_to_owner NUMERIC(10,4) DEFAULT 0,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. SMART CONTRACT (Solana/Anchor)

### Program Structure
```
programs/fronsciers/src/
├── lib.rs
├── state.rs
├── constants.rs
├── error.rs
└── instructions/
    ├── mod.rs
    ├── initialize_protocol.rs
    ├── register_user.rs
    ├── submit_manuscript.rs       -- $50 USDC → split 40/30/10/20
    ├── review_manuscript.rs       -- 3-reviewer consensus
    ├── publish_manuscript.rs      -- Mint DOCI NFT
    ├── record_citation.rs         -- $0.01 per AI citation (THE CORE)
    ├── distribute_pool.rs         -- Monthly leaderboard distribution
    ├── claim_earnings.rs          -- Author withdraws accumulated USDC
    ├── update_impact_score.rs     -- Oracle updates metrics
    └── manage_protocol.rs         -- Admin controls
```

### Constants (CRITICAL: USDC has 6 decimals on Solana)
```rust
pub const SUBMISSION_FEE: u64 = 50_000_000;       // $50 USDC
pub const CITATION_FEE: u64 = 10_000;             // $0.01 USDC
pub const FRONS_ID_FEE: u64 = 20_000_000;         // $20 USDC
pub const REJECTION_KEEP: u64 = 5_000_000;         // $5 kept on rejection

pub const PLATFORM_FEE_BPS: u16 = 4000;           // 40%
pub const SHARING_POOL_BPS: u16 = 3000;            // 30%
pub const AUTHOR_DIRECT_BPS: u16 = 1000;           // 10%
pub const PROTOCOL_RESERVE_BPS: u16 = 2000;        // 20%

// Updated for v5 subscription model (chat revenue split)
pub const CHAT_PLATFORM_BPS: u16 = 4000;           // 40%
pub const CHAT_AUTHOR_BPS: u16 = 2000;             // 20% (when Fronsciers cited)
pub const CHAT_POOL_BPS: u16 = 2000;               // 20%
pub const CHAT_RESERVE_BPS: u16 = 2000;             // 20%
```

### State Accounts
```rust
#[account]
pub struct ProtocolState {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub sharing_pool: Pubkey,
    pub reserve: Pubkey,
    pub total_submissions: u64,
    pub total_citations: u64,
    pub total_revenue_usdc: u64,
    pub current_epoch: u64,
    pub platform_fee_bps: u16,
    pub pool_fee_bps: u16,
    pub author_fee_bps: u16,
    pub reserve_fee_bps: u16,
    pub citation_fee: u64,
    pub submission_fee: u64,
    pub paused: bool,
    pub bump: u8,
}

#[account]
pub struct AuthorVault {
    pub author: Pubkey,
    pub total_earned: u64,
    pub claimable: u64,
    pub total_citations: u64,
    pub impact_score: u64,
    pub last_claim_epoch: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ManuscriptStatus {
    Pending,
    InReview,
    Accepted,
    Rejected,
    Published,
}
```

---

## 6. MCP SERVER (AI Gateway)

### Tools
```python
from fastmcp import FastMCP
mcp = FastMCP("frons-knowledge")

@mcp.tool()  # FREE — search is always free
async def search_articles(query: str, field: str = None, limit: int = 10): ...

@mcp.tool()  # FREE — abstracts are teasers
async def get_article_abstract(doci: str): ...

@mcp.tool()  # PAID — triggers citation + payment
async def cite_and_access(doci: str, context: str): ...

@mcp.tool()  # FREE
async def get_researcher_profile(name_or_wallet: str): ...

@mcp.tool()  # FREE
async def get_trending_research(field: str = "medicine", period: str = "3months"): ...

@mcp.tool()  # FREE
async def get_citation_stats(doci: str): ...
```

### Evidence Cascade (AI Chat Orchestrator)
```
User question → Tier 1: Search Fronsciers (earn authors money)
             → Tier 2: Search PubMed (NCBI E-utilities API)
             → Tier 3: Search Scopus (Elsevier API)
             → Tier 4: Honest Admission ("insufficient evidence")

Each response includes: confidence score, source list, credits charged.
Never hallucinate. No source = no claim.
```

---

## 7. FRONTEND ROUTES

```
FRONS.ID (Main App):
/                          → Landing page
/chat                      → AI chat with evidence cascade
/vault                     → My Vault (encrypted file storage)
/vault/upload              → Upload with client-side encryption
/search                    → Article search
/browse                    → Browse by field/year/impact
/article/{doci}            → Article reader
/dashboard                 → Author dashboard
/dashboard/earnings        → Earnings + claim
/leaderboard               → Monthly impact rankings
/credits                   → Buy credits / subscription management
/profile/{slug}            → Researcher profile
/connect                   → MCP connection instructions
/api                       → API documentation
/admin                     → Admin dashboard (8 tabs)

CARD.FRONSCIERS.ID (NFC Card):
/                          → NFC card landing page (3D model + GSAP)
/p/{slug}                  → Public researcher profile (NFC tap target)
/p/{slug}/papers           → Full publications list
/p/{slug}/datasets         → Synthetic datasets
/p/{slug}/verify           → On-chain verification
```

---

## 8. PRICING & REVENUE

### Subscription Tiers
```
Free:        $0       20 credits, 100MB vault, 3 files
Starter:     $0.99/mo 100 credits, 1GB vault, 50 files, $0.30 SOL gas
Researcher:  $3.99/mo 500 credits, 5GB vault, 500 files, $0.60 SOL gas
Pro:         $9.99/mo 1,500 credits, 25GB vault, unlimited, $1.50 SOL gas
Institution: $29.99/mo 5,000 credits, 100GB, 10 seats, $5.00 SOL gas
Enterprise:  $99.99/mo 20,000 credits, 1TB, 50 seats, $15.00 SOL gas
```

### Credit Costs
```
AI Chat: 3-10 credits per question ($0.03-$0.10)
Fronsciers citation: +1 credit ($0.01 → author)
Dataset download: 5 credits ($0.05 → uploader)
Bulk dataset: 10 credits ($0.10 → uploader)
All vault actions: $0 (included in subscription)
```

### Payment Rails
```
Global:    Stripe (Google Pay, Apple Pay, Visa/MC, bank transfer)
Indonesia: Xendit (QRIS 0.63%, Bank VA, GoPay, OVO, DANA, ShopeePay)
Crypto:    USDC on Solana (direct transfer, ~$0.001 fee)
```

---

## 9. ENCRYPTION

### Vault Encryption (Client-Side)
```
Algorithm:  AES-256-GCM
Key:        PBKDF2(passphrase + wallet_signature, salt, 100000 iterations, SHA-512)
Sub-keys:   HKDF("file-encryption") → FEK, HKDF("metadata-encryption") → MEK
Per-file:   Random 96-bit nonce, FEK + nonce → encrypted blob + auth tag
Recovery:   12-word phrase generated at vault setup
Server:     NEVER sees plaintext data or encryption keys
```

### Synthetic Data Pipeline
```
Stage 1: STRIP — Remove identifiers, generalize quasi-identifiers (age → 5yr bands)
Stage 2: PERTURB — Laplace noise (ε=1.0), preserve distributions
Stage 3: COMPRESS — Type optimization + Parquet/Snappy (75% size reduction)
Privacy: k=5 anonymity, ε-differential privacy
```

---

## 10. DESIGN SYSTEM

### Colors (From Mascot)
```
Navy:      #2C337A  (primary buttons, text, headers)
Lavender:  #E5E0FE  (backgrounds, borders, active states)
Pink:      #FFC6DE  (accents, highlights)
Orange:    #FB7720  (CTAs, earning badges, popular tags)
Off-white: #F8F8FD  (page background)
Green:     #10b981  (success, active status)
Red:       #ef4444  (error, rejected)
Amber:     #f59e0b  (warning, pending)
```

### Typography
```
Font: DM Sans (same across all products)
H1: 70px, navy, -3 letter-spacing
H2: 40px, navy
Body: 16px, gray-700
```

### Mascot
Scholarly white bear with glasses, navy blazer, orange-striped tie, pink cheeks.
Appears in 8+ locations: hero, vault sidebar, upload banner, footer, admin sidebar.
Poses: waving (hi), reading (book), front-facing, close-up, sticker set.

---

## 11. FILE STRUCTURE

```
frons-platform/
├── CLAUDE.md                              ← YOU ARE HERE
├── apps/
│   ├── web/                               (Next.js 15 — Frons.id + Fronsciers)
│   │   ├── src/app/
│   │   │   ├── page.tsx                   (landing)
│   │   │   ├── chat/page.tsx              (AI chat)
│   │   │   ├── vault/page.tsx             (My Vault)
│   │   │   ├── search/page.tsx            (article search)
│   │   │   ├── article/[doci]/page.tsx    (article reader)
│   │   │   ├── dashboard/page.tsx         (author dashboard)
│   │   │   ├── leaderboard/page.tsx       (impact rankings)
│   │   │   ├── credits/page.tsx           (buy credits)
│   │   │   ├── admin/page.tsx             (admin dashboard)
│   │   │   ├── connect/page.tsx           (MCP instructions)
│   │   │   └── api/                       (API routes)
│   │   │       ├── payments/
│   │   │       │   ├── stripe-checkout.ts
│   │   │       │   ├── xendit-checkout.ts
│   │   │       │   └── crypto-checkout.ts
│   │   │       └── v1/
│   │   │           ├── search.ts
│   │   │           ├── articles/[doci].ts
│   │   │           └── researchers/[id].ts
│   │   ├── lib/
│   │   │   ├── vault-encryption.ts        (AES-256-GCM client-side)
│   │   │   ├── supabase.ts               (database client)
│   │   │   └── solana.ts                  (blockchain client)
│   │   └── components/
│   │       ├── chat/                      (AI chat components)
│   │       ├── vault/                     (file manager components)
│   │       ├── landing/                   (landing page sections)
│   │       └── ui/                        (shared UI components)
│   │
│   ├── card/                              (Next.js — NFC card site)
│   │   ├── src/app/
│   │   │   ├── page.tsx                   (3D card landing)
│   │   │   └── p/[slug]/page.tsx          (public profile)
│   │   ├── public/CARD.glb                (3D card model)
│   │   └── src/app/script.ts              (Three.js + GSAP)
│   │
│   └── mcp-server/                        (Python — AI gateway)
│       ├── server.py                      (FastMCP tools)
│       ├── api.py                         (FastAPI REST + x402)
│       ├── evidence_cascade.py            (4-tier search orchestrator)
│       ├── requirements.txt
│       └── Dockerfile
│
├── programs/
│   └── fronsciers/                        (Solana smart contract)
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           ├── state.rs
│           ├── constants.rs
│           ├── error.rs
│           └── instructions/
│
├── packages/
│   └── supabase/
│       └── migrations/                    (001-024 SQL files)
│
├── scripts/
│   ├── indexer.py                         (Solana → Supabase sync)
│   ├── synthetic_pipeline.py              (privacy-preserving data gen)
│   └── e2e_test.py                        (end-to-end integration test)
│
├── docs/                                  (architecture specifications)
│   ├── FRONS-v2-CTO-Blueprint.md
│   ├── FRONS-v2-Expansion-Architecture.md
│   ├── FRONS-v3-Features-Design.md
│   ├── FRONS-Data-Commons-Architecture.md
│   ├── FRONS-AI-Chat-Zero-Hallucination.md
│   ├── FRONS-AI-Protection-and-SOL-Costs.md
│   ├── FRONS-Credit-Payment-System.md
│   ├── FRONS-v5-Pricing-Vault-Gas-Architecture.md
│   └── FRONS-v6-NFC-Vault-Encryption-Synthetic-Data.md
│
└── .env.example
```

---

## 12. ENVIRONMENT VARIABLES

```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Solana
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=xxx
SOLANA_PRIVATE_KEY=base58-encoded-key
NEXT_PUBLIC_PROGRAM_ID=FroNs...

# Auth
NEXT_PUBLIC_PRIVY_APP_ID=xxx
PRIVY_APP_SECRET=xxx

# AI
ANTHROPIC_API_KEY=sk-ant-xxx
NCBI_API_KEY=xxx                           # PubMed E-utilities
SCOPUS_API_KEY=xxx                         # Elsevier Scopus

# Payments
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
XENDIT_SECRET_KEY=xxx
XENDIT_WEBHOOK_TOKEN=xxx

# Storage
WALRUS_API_URL=https://api.walrus.xyz
TREASURY_WALLET=base58-pubkey

# Frontend
NEXT_PUBLIC_MCP_SERVER_URL=https://frons-mcp.up.railway.app
NEXT_PUBLIC_CARD_URL=https://card.fronsciers.id
```

---

## 13. CODING CONVENTIONS

- **Rust/Anchor:** snake_case, all accounts validated with Anchor constraints
- **TypeScript:** camelCase, strict mode, no `any` type
- **Python:** snake_case, type hints everywhere, async/await for I/O
- **SQL:** snake_case columns, singular table names, always add indexes
- **API:** RESTful, JSON responses, versioned (/api/v1/)
- **Error handling:** Custom error enums in Rust, try/catch in TS, never panic
- **Testing:** Every smart contract instruction has a test
- **Commits:** Conventional commits (feat:, fix:, refactor:, docs:, chore:)
- **Comments:** Explain WHY, not WHAT — the code shows what, comments explain reasoning
- **Security:** Never hardcode keys, always use env vars, .env in .gitignore

---

## 14. ACCESS CONTROL MATRIX

```
ENTITY               SEES                         CANNOT SEE
─────────────────────────────────────────────────────────────
Data Owner           Everything (own data)         Other users' data
Frons AI Chat        Synthetic data only           Original data, patient IDs
Fronsciers Users     Synthetic data (download)     Original data, metadata
Doctor (QR share)    Specific shared files only    Other vault files
NFC Tap Recipient    Public profile + papers       Vault, clinical, personal
Platform Admin       Encrypted blobs + stats       Decryption keys, plaintext
Attacker (breach)    Encrypted blobs               Anything useful
```

---

## 15. KEY DECISIONS LOG

| Decision | Reasoning |
|---|---|
| Solana over Ethereum | Sub-cent fees ($0.001 vs $5+), sub-second settlement |
| Supabase over custom DB | Built-in FTS, RLS, real-time, auth, free tier |
| Walrus over IPFS | Programmable, 4.5x replication (not 100%), cost-effective |
| Client-side encryption | Zero-knowledge — platform can't be compelled to reveal data |
| Synthetic data pipeline | Researchers need data; patients need privacy. Both satisfied. |
| Subscription + credits | Subscriptions cover infrastructure; credits cover AI compute |
| NTAG 424 DNA | Military-grade NFC — rolling CMAC prevents cloning |
| Privy for auth | Users never see wallets, seed phrases, or gas fees |
| DM Sans font | Consistent across NFC card, web, and admin dashboard |
| Mascot bear | Creates approachable, trustworthy academic brand |
| QRIS for Indonesia | 0.63% fee — cheapest payment method in the target market |
| Evidence cascade order | Fronsciers first (earns authors money), then external sources |
| Honest admission tier | Better to say "I don't know" than hallucinate a citation |
