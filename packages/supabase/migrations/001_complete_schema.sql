-- ============================================================================
-- FRONS Ecosystem - Complete Database Schema
-- Migration 001: Consolidated schema for all platform tables
-- ============================================================================
-- IMPORTANT: Uses CREATE TABLE IF NOT EXISTS to avoid conflicts with existing
-- tables: users, chat_history, walrus_blobs, protocol_config, admin_seeds
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: CORE RESEARCH TABLES
-- ============================================================================

-- 1.1 Journals
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  issn TEXT UNIQUE,
  scope TEXT,
  editor_wallet TEXT NOT NULL,
  submission_fee_usdc NUMERIC(12, 2) DEFAULT 0,
  review_type TEXT NOT NULL DEFAULT 'peer' CHECK (review_type IN ('peer', 'ai', 'hybrid', 'editorial')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_journals_editor ON public.journals(editor_wallet);
CREATE INDEX IF NOT EXISTS idx_journals_issn ON public.journals(issn);

-- 1.2 Researchers
CREATE TABLE IF NOT EXISTS public.researchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  privy_user_id TEXT UNIQUE,
  name TEXT,
  email TEXT,
  institution TEXT,
  education JSONB DEFAULT '[]'::jsonb,
  specializations TEXT[] DEFAULT '{}',
  h_index INTEGER DEFAULT 0,
  total_citations INTEGER DEFAULT 0,
  total_earnings_usdc NUMERIC(14, 2) DEFAULT 0,
  leaderboard_rank INTEGER,
  orcid TEXT UNIQUE,
  google_scholar_id TEXT UNIQUE,
  profile_image_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_researchers_wallet ON public.researchers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_researchers_privy ON public.researchers(privy_user_id);
CREATE INDEX IF NOT EXISTS idx_researchers_institution ON public.researchers(institution);
CREATE INDEX IF NOT EXISTS idx_researchers_leaderboard ON public.researchers(leaderboard_rank);

-- 1.3 Articles (with full-text search)
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doci TEXT UNIQUE,
  title TEXT NOT NULL,
  abstract TEXT,
  content TEXT,
  authors JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords TEXT[] DEFAULT '{}',
  field_of_study TEXT,
  walrus_blob_id TEXT,
  solana_pubkey TEXT,
  solana_mint_address TEXT,
  solana_tx_signature TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'revision_requested', 'accepted', 'published', 'rejected', 'retracted')),
  citation_count INTEGER DEFAULT 0,
  impact_score NUMERIC(8, 4) DEFAULT 0,
  journal_id UUID REFERENCES public.journals(id) ON DELETE SET NULL,
  submitter_wallet TEXT,
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Full-text search vector
  fts_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(abstract, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_articles_doci ON public.articles(doci);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_journal ON public.articles(journal_id);
CREATE INDEX IF NOT EXISTS idx_articles_submitter ON public.articles(submitter_wallet);
CREATE INDEX IF NOT EXISTS idx_articles_field ON public.articles(field_of_study);
CREATE INDEX IF NOT EXISTS idx_articles_fts ON public.articles USING GIN(fts_vector);
CREATE INDEX IF NOT EXISTS idx_articles_keywords ON public.articles USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_articles_citation_count ON public.articles(citation_count DESC);
CREATE INDEX IF NOT EXISTS idx_articles_impact_score ON public.articles(impact_score DESC);

-- 1.4 Citations
CREATE TABLE IF NOT EXISTS public.citations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  citing_article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  citing_agent TEXT,
  citing_context TEXT,
  solana_tx_signature TEXT,
  fee_total_usdc NUMERIC(12, 6) DEFAULT 0,
  fee_author_usdc NUMERIC(12, 6) DEFAULT 0,
  fee_pool_usdc NUMERIC(12, 6) DEFAULT 0,
  fee_platform_usdc NUMERIC(12, 6) DEFAULT 0,
  fee_reserve_usdc NUMERIC(12, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_citations_article ON public.citations(article_id);
CREATE INDEX IF NOT EXISTS idx_citations_citing ON public.citations(citing_article_id);
CREATE INDEX IF NOT EXISTS idx_citations_tx ON public.citations(solana_tx_signature);

-- 1.5 Leaderboard
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  researcher_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  impact_score NUMERIC(10, 4) DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  pcs_score NUMERIC(8, 4) DEFAULT 0,  -- Publication Citation Score
  sss_score NUMERIC(8, 4) DEFAULT 0,  -- Scientific Significance Score
  tis_score NUMERIC(8, 4) DEFAULT 0,  -- Total Impact Score
  pool_payout_usdc NUMERIC(12, 2) DEFAULT 0,
  rank INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(period, period_start, researcher_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON public.leaderboard(period, period_start);
CREATE INDEX IF NOT EXISTS idx_leaderboard_researcher ON public.leaderboard(researcher_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON public.leaderboard(period, rank);

-- 1.6 Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.researchers(id) ON DELETE SET NULL,
  reviewer_wallet TEXT,
  decision TEXT CHECK (decision IN ('accepted', 'rejected', 'revise', 'pending')),
  overall_score NUMERIC(4, 2) CHECK (overall_score >= 0 AND overall_score <= 10),
  feedback TEXT,
  feedback_private TEXT,
  is_ai_review BOOLEAN DEFAULT false,
  ai_model TEXT,
  round INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_article ON public.reviews(article_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.reviews(reviewer_id);

-- 1.7 Journal Roles
CREATE TABLE IF NOT EXISTS public.journal_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('editor', 'associate_editor', 'reviewer', 'author')),
  assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(journal_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_journal_roles_journal ON public.journal_roles(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_roles_user ON public.journal_roles(user_id);

-- 1.8 Manuscript Keys (encrypted document key distribution)
CREATE TABLE IF NOT EXISTS public.manuscript_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  encrypted_document_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(article_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_manuscript_keys_article ON public.manuscript_keys(article_id);

-- 1.9 Manuscript Access
CREATE TABLE IF NOT EXISTS public.manuscript_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('read', 'write', 'review', 'admin')),
  granted_by UUID REFERENCES public.researchers(id),
  granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,
  UNIQUE(article_id, user_id, access_type)
);

CREATE INDEX IF NOT EXISTS idx_manuscript_access_article ON public.manuscript_access(article_id);
CREATE INDEX IF NOT EXISTS idx_manuscript_access_user ON public.manuscript_access(user_id);

-- ============================================================================
-- SECTION 2: DATASETS
-- ============================================================================

-- 2.1 Datasets
CREATE TABLE IF NOT EXISTS public.datasets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uploader_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  columns_schema JSONB DEFAULT '[]'::jsonb,
  format TEXT CHECK (format IN ('csv', 'json', 'parquet', 'hdf5', 'xlsx', 'tsv', 'other')),
  walrus_blob_id TEXT,
  access_level TEXT NOT NULL DEFAULT 'private' CHECK (access_level IN ('public', 'private', 'restricted', 'credits')),
  data_doi TEXT UNIQUE,
  row_count INTEGER,
  file_size_bytes BIGINT,
  license TEXT DEFAULT 'CC-BY-4.0',
  credits_per_access NUMERIC(10, 2) DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_datasets_uploader ON public.datasets(uploader_id);
CREATE INDEX IF NOT EXISTS idx_datasets_access ON public.datasets(access_level);
CREATE INDEX IF NOT EXISTS idx_datasets_doi ON public.datasets(data_doi);

-- 2.2 Dataset Access Log
CREATE TABLE IF NOT EXISTS public.dataset_access_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  accessor_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'api', 'citation')),
  credits_charged NUMERIC(10, 2) DEFAULT 0,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dataset_access_dataset ON public.dataset_access_log(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_access_accessor ON public.dataset_access_log(accessor_id);

-- ============================================================================
-- SECTION 3: CREDENTIALS & NFTs
-- ============================================================================

-- 3.1 Credential Types
CREATE TABLE IF NOT EXISTS public.credential_types (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed credential types
INSERT INTO public.credential_types (id, display_name, description) VALUES
  ('verified_researcher', 'Verified Researcher', 'Completed identity verification and ORCID linkage'),
  ('frons_scholar', 'FRONS Scholar', 'Published 3+ peer-reviewed articles on FRONS'),
  ('medical_professional', 'Medical Professional', 'Verified medical license or credentials'),
  ('senior_reviewer', 'Senior Reviewer', 'Completed 10+ reviews with high-quality scores'),
  ('institution_admin', 'Institution Admin', 'Verified administrator at an academic institution')
ON CONFLICT (id) DO NOTHING;

-- 3.2 User Credentials
CREATE TABLE IF NOT EXISTS public.user_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL REFERENCES public.credential_types(id) ON DELETE CASCADE,
  solana_sbt_mint TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, credential_type)
);

CREATE INDEX IF NOT EXISTS idx_user_credentials_user ON public.user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_type ON public.user_credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_user_credentials_status ON public.user_credentials(status);

-- 3.3 Publication NFTs
CREATE TABLE IF NOT EXISTS public.publication_nfts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  mint_address TEXT UNIQUE NOT NULL,
  doci TEXT,
  metadata_uri TEXT,
  authors_split JSONB NOT NULL DEFAULT '[]'::jsonb,
  edition_number INTEGER DEFAULT 1,
  max_editions INTEGER,
  royalty_bps INTEGER DEFAULT 500 CHECK (royalty_bps >= 0 AND royalty_bps <= 10000),
  minted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pub_nfts_article ON public.publication_nfts(article_id);
CREATE INDEX IF NOT EXISTS idx_pub_nfts_mint ON public.publication_nfts(mint_address);
CREATE INDEX IF NOT EXISTS idx_pub_nfts_doci ON public.publication_nfts(doci);

-- 3.4 NFT Revenue Log
CREATE TABLE IF NOT EXISTS public.nft_revenue_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID NOT NULL REFERENCES public.publication_nfts(id) ON DELETE CASCADE,
  citation_id UUID REFERENCES public.citations(id) ON DELETE SET NULL,
  amount_usdc NUMERIC(12, 6) NOT NULL,
  revenue_type TEXT NOT NULL DEFAULT 'citation' CHECK (revenue_type IN ('citation', 'royalty', 'sale', 'license')),
  solana_tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nft_revenue_nft ON public.nft_revenue_log(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_revenue_citation ON public.nft_revenue_log(citation_id);

-- ============================================================================
-- SECTION 4: PEER REVIEW SYSTEM
-- ============================================================================

-- 4.1 Reviewer Expertise
CREATE TABLE IF NOT EXISTS public.reviewer_expertise (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE UNIQUE,
  fields TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  max_reviews_per_month INTEGER DEFAULT 5,
  current_month_reviews INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  avg_review_quality NUMERIC(4, 2) DEFAULT 0,
  total_reviews_completed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviewer_expertise_user ON public.reviewer_expertise(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_expertise_available ON public.reviewer_expertise(is_available);
CREATE INDEX IF NOT EXISTS idx_reviewer_expertise_fields ON public.reviewer_expertise USING GIN(fields);

-- 4.2 Review Assignments
CREATE TABLE IF NOT EXISTS public.review_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'expired')),
  assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  review_id UUID REFERENCES public.reviews(id) ON DELETE SET NULL,
  UNIQUE(article_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_review_assign_article ON public.review_assignments(article_id);
CREATE INDEX IF NOT EXISTS idx_review_assign_reviewer ON public.review_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_assign_status ON public.review_assignments(status);

-- 4.3 AI Review Queue
CREATE TABLE IF NOT EXISTS public.ai_review_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  requested_by UUID REFERENCES public.researchers(id),
  queued_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON public.ai_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_ai_queue_priority ON public.ai_review_queue(priority DESC, queued_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_queue_article ON public.ai_review_queue(article_id);

-- 4.4 AI Review Results
CREATE TABLE IF NOT EXISTS public.ai_review_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID NOT NULL REFERENCES public.ai_review_queue(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  model_used TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_score NUMERIC(4, 2) CHECK (overall_score >= 0 AND overall_score <= 10),
  decision TEXT CHECK (decision IN ('accepted', 'rejected', 'revise', 'inconclusive')),
  feedback TEXT,
  methodology_score NUMERIC(4, 2),
  novelty_score NUMERIC(4, 2),
  clarity_score NUMERIC(4, 2),
  reproducibility_score NUMERIC(4, 2),
  confidence NUMERIC(4, 2) CHECK (confidence >= 0 AND confidence <= 1),
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_results_queue ON public.ai_review_results(queue_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_article ON public.ai_review_results(article_id);

-- ============================================================================
-- SECTION 5: PLATFORM ADMINISTRATION
-- ============================================================================

-- 5.1 Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed platform settings
INSERT INTO public.platform_settings (key, value, description, category) VALUES
  ('credit_per_query', '"1"', 'Credits charged per AI query', 'credits'),
  ('credit_per_citation', '"2"', 'Credits charged per citation generation', 'credits'),
  ('credit_per_dataset_access', '"5"', 'Credits charged per dataset access', 'credits'),
  ('tier_free_price_usdc', '"0"', 'Free tier monthly price', 'tiers'),
  ('tier_scholar_price_usdc', '"29"', 'Scholar tier monthly price', 'tiers'),
  ('tier_lab_price_usdc', '"99"', 'Lab tier monthly price', 'tiers'),
  ('tier_institution_price_usdc', '"499"', 'Institution tier monthly price', 'tiers'),
  ('gas_allocation_free_lamports', '"50000000"', 'Free tier gas allocation (0.05 SOL)', 'gas'),
  ('gas_allocation_scholar_lamports', '"200000000"', 'Scholar tier gas allocation (0.2 SOL)', 'gas'),
  ('gas_allocation_lab_lamports', '"500000000"', 'Lab tier gas allocation (0.5 SOL)', 'gas'),
  ('gas_allocation_institution_lamports', '"2000000000"', 'Institution tier gas allocation (2 SOL)', 'gas'),
  ('fee_platform_bps', '"4000"', 'Platform fee in basis points (40%)', 'fees'),
  ('fee_author_bps', '"2000"', 'Author fee in basis points (20%)', 'fees'),
  ('fee_pool_bps', '"2000"', 'Pool fee in basis points (20%)', 'fees'),
  ('fee_reserve_bps', '"2000"', 'Reserve fee in basis points (20%)', 'fees'),
  ('citation_fee_usdc', '"0.05"', 'Per-citation fee in USDC', 'fees')
ON CONFLICT (key) DO NOTHING;

-- 5.2 Admin Roles
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'content_admin', 'finance_admin', 'support')),
  granted_by UUID REFERENCES public.researchers(id),
  granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user ON public.admin_roles(user_id);

-- 5.3 Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.researchers(id) ON DELETE SET NULL,
  admin_wallet TEXT,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON public.audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(target_table);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- 5.4 Blocked Agents
CREATE TABLE IF NOT EXISTS public.blocked_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT NOT NULL UNIQUE,
  user_agent_pattern TEXT NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed blocked agents
INSERT INTO public.blocked_agents (agent_name, user_agent_pattern, reason) VALUES
  ('GPTBot', 'GPTBot', 'OpenAI crawler - unauthorized scraping'),
  ('ClaudeBot', 'ClaudeBot', 'Anthropic crawler - unauthorized scraping'),
  ('Google-Extended', 'Google-Extended', 'Google AI training crawler'),
  ('CCBot', 'CCBot', 'Common Crawl bot'),
  ('ChatGPT-User', 'ChatGPT-User', 'ChatGPT browsing agent'),
  ('Bytespider', 'Bytespider', 'ByteDance crawler'),
  ('FacebookExternalHit', 'facebookexternalhit', 'Facebook scraper - not for AI training')
ON CONFLICT (agent_name) DO NOTHING;

-- 5.5 API Rate Limits
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT,
  ip_address INET,
  endpoint TEXT NOT NULL,
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT now() NOT NULL,
  window_seconds INTEGER DEFAULT 60,
  max_requests INTEGER DEFAULT 100,
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.api_rate_limits(api_key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON public.api_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON public.api_rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.api_rate_limits(window_start);

-- 5.6 Search Queries (analytics)
CREATE TABLE IF NOT EXISTS public.search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.researchers(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  query_type TEXT DEFAULT 'search' CHECK (query_type IN ('search', 'citation', 'dataset', 'ai_chat')),
  results_count INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  credits_charged NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_queries_user ON public.search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON public.search_queries(created_at DESC);

-- ============================================================================
-- SECTION 6: CHAT SYSTEM (extended)
-- ============================================================================

-- 6.1 Chat Conversations
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.researchers(id) ON DELETE CASCADE,
  wallet_address TEXT,
  title TEXT,
  model TEXT DEFAULT 'gpt-4o',
  total_credits_used NUMERIC(10, 2) DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_wallet ON public.chat_conversations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_chat_conv_created ON public.chat_conversations(created_at DESC);

-- 6.2 Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  citations JSONB DEFAULT '[]'::jsonb,
  credits_charged NUMERIC(10, 2) DEFAULT 0,
  confidence_score NUMERIC(4, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  is_honest_admission BOOLEAN DEFAULT false,
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_role ON public.chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_msg_created ON public.chat_messages(created_at);

-- ============================================================================
-- SECTION 7: CREDITS & PAYMENTS
-- ============================================================================

-- 7.1 Credit Balances
CREATE TABLE IF NOT EXISTS public.credit_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_purchased NUMERIC(14, 2) DEFAULT 0,
  lifetime_earned NUMERIC(14, 2) DEFAULT 0,
  lifetime_spent NUMERIC(14, 2) DEFAULT 0,
  lifetime_expired NUMERIC(14, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_bal_user ON public.credit_balances(user_id);

-- 7.2 Credit Transactions
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spend', 'earn', 'refund', 'promo', 'subscription', 'expiry', 'admin_adjustment')),
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'solana_usdc', 'promo', 'system', NULL)),
  payment_provider_id TEXT,
  -- Revenue splits for spend transactions
  revenue_platform_usdc NUMERIC(12, 6) DEFAULT 0,
  revenue_author_usdc NUMERIC(12, 6) DEFAULT 0,
  revenue_pool_usdc NUMERIC(12, 6) DEFAULT 0,
  revenue_reserve_usdc NUMERIC(12, 6) DEFAULT 0,
  balance_before NUMERIC(14, 2),
  balance_after NUMERIC(14, 2),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_type ON public.credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_tx_reference ON public.credit_transactions(reference_type, reference_id);

-- 7.3 Pending Crypto Payments (USDC payment flow)
CREATE TABLE IF NOT EXISTS public.pending_crypto_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount_usdc NUMERIC(14, 2) NOT NULL CHECK (amount_usdc > 0),
  credits_to_grant NUMERIC(14, 2) NOT NULL CHECK (credits_to_grant > 0),
  expected_tx_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'confirmed', 'failed', 'expired', 'cancelled')),
  solana_tx_signature TEXT,
  confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_payments_user ON public.pending_crypto_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON public.pending_crypto_payments(status);
CREATE INDEX IF NOT EXISTS idx_pending_payments_wallet ON public.pending_crypto_payments(wallet_address);

-- 7.4 Promo Codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  credits_granted NUMERIC(14, 2) NOT NULL CHECK (credits_granted > 0),
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  min_tier TEXT,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.researchers(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(is_active);

-- ============================================================================
-- SECTION 8: SUBSCRIPTIONS & GAS
-- ============================================================================

-- 8.1 Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'scholar', 'lab', 'institution')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  -- Tier limits
  vault_storage_limit_mb INTEGER DEFAULT 100,
  vault_file_limit INTEGER DEFAULT 10,
  monthly_credits_included NUMERIC(10, 2) DEFAULT 50,
  gas_allocation_lamports BIGINT DEFAULT 50000000,
  max_monthly_gas_tx INTEGER DEFAULT 50,
  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON public.subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 8.2 Gas Escrow
CREATE TABLE IF NOT EXISTS public.gas_escrow (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE UNIQUE,
  sol_balance_lamports BIGINT NOT NULL DEFAULT 0 CHECK (sol_balance_lamports >= 0),
  monthly_allocation_lamports BIGINT NOT NULL DEFAULT 50000000,
  monthly_spent_lamports BIGINT DEFAULT 0,
  monthly_tx_count INTEGER DEFAULT 0,
  max_monthly_tx INTEGER DEFAULT 50,
  month_start DATE DEFAULT CURRENT_DATE,
  escrow_wallet_pubkey TEXT,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gas_escrow_user ON public.gas_escrow(user_id);

-- 8.3 Gas Transactions
CREATE TABLE IF NOT EXISTS public.gas_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  lamports_spent BIGINT NOT NULL CHECK (lamports_spent > 0),
  action_type TEXT NOT NULL CHECK (action_type IN ('publish', 'cite', 'mint_nft', 'transfer', 'stake', 'vote', 'other')),
  solana_tx_signature TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gas_tx_user ON public.gas_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_gas_tx_action ON public.gas_transactions(action_type);
CREATE INDEX IF NOT EXISTS idx_gas_tx_created ON public.gas_transactions(created_at DESC);

-- ============================================================================
-- SECTION 9: NFC CARDS & PUBLIC PROFILES
-- ============================================================================

-- 9.1 NFC Cards
CREATE TABLE IF NOT EXISTS public.nfc_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  card_uid TEXT UNIQUE NOT NULL,
  profile_slug TEXT UNIQUE NOT NULL,
  sun_key TEXT,
  cmac_counter INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  -- Visibility settings
  show_email BOOLEAN DEFAULT false,
  show_institution BOOLEAN DEFAULT true,
  show_publications BOOLEAN DEFAULT true,
  show_citations BOOLEAN DEFAULT true,
  show_h_index BOOLEAN DEFAULT true,
  show_wallet BOOLEAN DEFAULT false,
  custom_links JSONB DEFAULT '[]'::jsonb,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nfc_cards_user ON public.nfc_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_uid ON public.nfc_cards(card_uid);
CREATE INDEX IF NOT EXISTS idx_nfc_cards_slug ON public.nfc_cards(profile_slug);

-- 9.2 Public Profiles
CREATE TABLE IF NOT EXISTS public.public_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  researcher_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  title TEXT,
  institution TEXT,
  bio TEXT,
  avatar_url TEXT,
  website_url TEXT,
  -- Stats (denormalized for fast reads)
  publication_count INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  h_index INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  -- Social links
  twitter_handle TEXT,
  github_handle TEXT,
  linkedin_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_public_profiles_researcher ON public.public_profiles(researcher_id);

-- 9.3 NFC Tap Log
CREATE TABLE IF NOT EXISTS public.nfc_tap_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.nfc_cards(id) ON DELETE CASCADE,
  tap_type TEXT NOT NULL DEFAULT 'profile_view' CHECK (tap_type IN ('profile_view', 'contact_share', 'paper_share', 'credential_verify')),
  cmac_value TEXT,
  is_cmac_valid BOOLEAN,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  referer TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nfc_tap_card ON public.nfc_tap_log(card_id);
CREATE INDEX IF NOT EXISTS idx_nfc_tap_created ON public.nfc_tap_log(created_at DESC);

-- ============================================================================
-- SECTION 10: VAULT (encrypted file storage)
-- ============================================================================

-- 10.1 Vault Files
CREATE TABLE IF NOT EXISTS public.vault_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_name_encrypted TEXT,
  file_type TEXT,
  file_size_bytes BIGINT,
  walrus_blob_id TEXT NOT NULL,
  -- Encryption params
  encryption_algorithm TEXT DEFAULT 'AES-256-GCM',
  encryption_iv TEXT,
  encryption_key_hash TEXT,
  encrypted_symmetric_key TEXT,
  -- Solana anchoring
  solana_tx_signature TEXT,
  solana_slot BIGINT,
  content_hash TEXT,
  -- Sharing
  is_shared BOOLEAN DEFAULT false,
  shared_with JSONB DEFAULT '[]'::jsonb,
  share_link_token TEXT UNIQUE,
  share_link_expires_at TIMESTAMPTZ,
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  folder_path TEXT DEFAULT '/',
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vault_files_user ON public.vault_files(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_files_blob ON public.vault_files(walrus_blob_id);
CREATE INDEX IF NOT EXISTS idx_vault_files_folder ON public.vault_files(user_id, folder_path);
CREATE INDEX IF NOT EXISTS idx_vault_files_share ON public.vault_files(share_link_token);
CREATE INDEX IF NOT EXISTS idx_vault_files_deleted ON public.vault_files(is_deleted);

-- 10.2 Vault Access Log
CREATE TABLE IF NOT EXISTS public.vault_access_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.vault_files(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  accessor_id UUID REFERENCES public.researchers(id) ON DELETE SET NULL,
  accessor_wallet TEXT,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'share', 'delete', 'upload', 'decrypt')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vault_access_file ON public.vault_access_log(file_id);
CREATE INDEX IF NOT EXISTS idx_vault_access_owner ON public.vault_access_log(owner_id);
CREATE INDEX IF NOT EXISTS idx_vault_access_created ON public.vault_access_log(created_at DESC);

-- 10.3 Synthetic Datasets
CREATE TABLE IF NOT EXISTS public.synthetic_datasets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_file_id UUID NOT NULL REFERENCES public.vault_files(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  -- Privacy parameters
  k_anonymity INTEGER CHECK (k_anonymity >= 2),
  epsilon NUMERIC(6, 4) CHECK (epsilon > 0),
  delta NUMERIC(12, 10),
  privacy_model TEXT DEFAULT 'differential_privacy' CHECK (privacy_model IN ('differential_privacy', 'k_anonymity', 'l_diversity', 't_closeness')),
  -- Column metadata
  column_metadata JSONB DEFAULT '[]'::jsonb,
  row_count INTEGER,
  synthetic_row_count INTEGER,
  walrus_blob_id TEXT,
  -- Quality metrics
  utility_score NUMERIC(4, 2),
  privacy_score NUMERIC(4, 2),
  generation_model TEXT,
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed', 'archived')),
  access_level TEXT DEFAULT 'private' CHECK (access_level IN ('public', 'private', 'credits')),
  credits_per_access NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_synthetic_original ON public.synthetic_datasets(original_file_id);
CREATE INDEX IF NOT EXISTS idx_synthetic_creator ON public.synthetic_datasets(creator_id);
CREATE INDEX IF NOT EXISTS idx_synthetic_status ON public.synthetic_datasets(status);

-- 10.4 Synthetic Access Log
CREATE TABLE IF NOT EXISTS public.synthetic_access_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  synthetic_id UUID NOT NULL REFERENCES public.synthetic_datasets(id) ON DELETE CASCADE,
  accessor_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'api')),
  credits_charged NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_synth_access_synthetic ON public.synthetic_access_log(synthetic_id);
CREATE INDEX IF NOT EXISTS idx_synth_access_accessor ON public.synthetic_access_log(accessor_id);

-- ============================================================================
-- SECTION 11: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manuscript_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manuscript_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_revenue_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviewer_expertise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_review_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_tap_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synthetic_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synthetic_access_log ENABLE ROW LEVEL SECURITY;

-- ---- Helper function: get current researcher ID from wallet ----
CREATE OR REPLACE FUNCTION public.current_researcher_id()
RETURNS UUID AS $$
  SELECT id FROM public.researchers
  WHERE wallet_address = current_setting('app.current_wallet_address', true)
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- Helper function: check if current user is admin ----
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = public.current_researcher_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- PUBLIC READ POLICIES (published/public data) ----

-- Articles: published articles are public
CREATE POLICY "Published articles are public" ON public.articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authors manage own articles" ON public.articles
  FOR ALL USING (
    submitter_wallet = current_setting('app.current_wallet_address', true)
    OR public.is_admin()
  );

-- Journals: public read
CREATE POLICY "Journals are public" ON public.journals
  FOR SELECT USING (true);

CREATE POLICY "Admins manage journals" ON public.journals
  FOR ALL USING (public.is_admin());

-- Researchers: public profiles
CREATE POLICY "Researcher profiles are public" ON public.researchers
  FOR SELECT USING (true);

CREATE POLICY "Researchers manage own profile" ON public.researchers
  FOR ALL USING (
    wallet_address = current_setting('app.current_wallet_address', true)
    OR public.is_admin()
  );

-- Citations: public
CREATE POLICY "Citations are public" ON public.citations
  FOR SELECT USING (true);

CREATE POLICY "System creates citations" ON public.citations
  FOR INSERT WITH CHECK (true);

-- Leaderboard: public read
CREATE POLICY "Leaderboard is public" ON public.leaderboard
  FOR SELECT USING (true);

CREATE POLICY "System manages leaderboard" ON public.leaderboard
  FOR ALL USING (public.is_admin());

-- Reviews: authors and reviewers can see their own
CREATE POLICY "Review participants see reviews" ON public.reviews
  FOR SELECT USING (
    reviewer_wallet = current_setting('app.current_wallet_address', true)
    OR reviewer_id = public.current_researcher_id()
    OR EXISTS (
      SELECT 1 FROM public.articles
      WHERE articles.id = reviews.article_id
      AND articles.submitter_wallet = current_setting('app.current_wallet_address', true)
    )
    OR public.is_admin()
  );

CREATE POLICY "Reviewers create reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    reviewer_wallet = current_setting('app.current_wallet_address', true)
    OR reviewer_id = public.current_researcher_id()
    OR public.is_admin()
  );

-- Journal Roles
CREATE POLICY "Journal roles visible to members" ON public.journal_roles
  FOR SELECT USING (true);

CREATE POLICY "Admins manage journal roles" ON public.journal_roles
  FOR ALL USING (public.is_admin());

-- Manuscript Keys: only for authorized users
CREATE POLICY "Users access own manuscript keys" ON public.manuscript_keys
  FOR SELECT USING (user_id = public.current_researcher_id());

CREATE POLICY "System manages manuscript keys" ON public.manuscript_keys
  FOR INSERT WITH CHECK (true);

-- Manuscript Access
CREATE POLICY "Users see own access" ON public.manuscript_access
  FOR SELECT USING (user_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "Admins manage manuscript access" ON public.manuscript_access
  FOR ALL USING (public.is_admin());

-- Datasets: public datasets readable
CREATE POLICY "Public datasets readable" ON public.datasets
  FOR SELECT USING (access_level = 'public' OR uploader_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "Researchers manage own datasets" ON public.datasets
  FOR ALL USING (uploader_id = public.current_researcher_id() OR public.is_admin());

-- Dataset Access Log
CREATE POLICY "Dataset owners see access log" ON public.dataset_access_log
  FOR SELECT USING (
    accessor_id = public.current_researcher_id()
    OR EXISTS (
      SELECT 1 FROM public.datasets
      WHERE datasets.id = dataset_access_log.dataset_id
      AND datasets.uploader_id = public.current_researcher_id()
    )
    OR public.is_admin()
  );

CREATE POLICY "System logs dataset access" ON public.dataset_access_log
  FOR INSERT WITH CHECK (true);

-- Credential Types: public read
CREATE POLICY "Credential types are public" ON public.credential_types
  FOR SELECT USING (true);

CREATE POLICY "Admins manage credential types" ON public.credential_types
  FOR ALL USING (public.is_admin());

-- User Credentials
CREATE POLICY "Users see own credentials" ON public.user_credentials
  FOR SELECT USING (user_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "System manages credentials" ON public.user_credentials
  FOR ALL USING (public.is_admin());

-- Publication NFTs: public
CREATE POLICY "Publication NFTs are public" ON public.publication_nfts
  FOR SELECT USING (true);

CREATE POLICY "System manages NFTs" ON public.publication_nfts
  FOR ALL USING (public.is_admin());

-- NFT Revenue Log
CREATE POLICY "NFT owners see revenue" ON public.nft_revenue_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.publication_nfts pn
      JOIN public.articles a ON a.id = pn.article_id
      WHERE pn.id = nft_revenue_log.nft_id
      AND a.submitter_wallet = current_setting('app.current_wallet_address', true)
    )
    OR public.is_admin()
  );

CREATE POLICY "System logs NFT revenue" ON public.nft_revenue_log
  FOR INSERT WITH CHECK (true);

-- Reviewer Expertise
CREATE POLICY "Reviewer expertise visible to editors" ON public.reviewer_expertise
  FOR SELECT USING (user_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "Reviewers manage own expertise" ON public.reviewer_expertise
  FOR ALL USING (user_id = public.current_researcher_id() OR public.is_admin());

-- Review Assignments
CREATE POLICY "Participants see assignments" ON public.review_assignments
  FOR SELECT USING (reviewer_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "System manages assignments" ON public.review_assignments
  FOR ALL USING (public.is_admin());

-- AI Review Queue
CREATE POLICY "AI queue visible to admins" ON public.ai_review_queue
  FOR SELECT USING (public.is_admin() OR requested_by = public.current_researcher_id());

CREATE POLICY "System manages AI queue" ON public.ai_review_queue
  FOR ALL USING (public.is_admin());

-- AI Review Results
CREATE POLICY "AI results visible to participants" ON public.ai_review_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.articles
      WHERE articles.id = ai_review_results.article_id
      AND articles.submitter_wallet = current_setting('app.current_wallet_address', true)
    )
    OR public.is_admin()
  );

CREATE POLICY "System manages AI results" ON public.ai_review_results
  FOR ALL USING (public.is_admin());

-- Platform Settings: admin only (public read for non-sensitive)
CREATE POLICY "Platform settings readable" ON public.platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins manage settings" ON public.platform_settings
  FOR ALL USING (public.is_admin());

-- Admin Roles
CREATE POLICY "Admin roles visible to admins" ON public.admin_roles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Super admins manage roles" ON public.admin_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles ar
      WHERE ar.user_id = public.current_researcher_id()
      AND ar.role = 'super_admin'
    )
  );

-- Audit Log
CREATE POLICY "Admins see audit log" ON public.audit_log
  FOR SELECT USING (public.is_admin());

CREATE POLICY "System writes audit log" ON public.audit_log
  FOR INSERT WITH CHECK (true);

-- Blocked Agents: public read (for robots.txt generation)
CREATE POLICY "Blocked agents are public" ON public.blocked_agents
  FOR SELECT USING (true);

CREATE POLICY "Admins manage blocked agents" ON public.blocked_agents
  FOR ALL USING (public.is_admin());

-- API Rate Limits: system managed
CREATE POLICY "System manages rate limits" ON public.api_rate_limits
  FOR ALL USING (public.is_admin());

-- Search Queries
CREATE POLICY "Users see own queries" ON public.search_queries
  FOR SELECT USING (user_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "System logs queries" ON public.search_queries
  FOR INSERT WITH CHECK (true);

-- Chat Conversations
CREATE POLICY "Users manage own conversations" ON public.chat_conversations
  FOR ALL USING (
    user_id = public.current_researcher_id()
    OR wallet_address = current_setting('app.current_wallet_address', true)
    OR public.is_admin()
  );

-- Chat Messages
CREATE POLICY "Users see own messages" ON public.chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations cc
      WHERE cc.id = chat_messages.conversation_id
      AND (
        cc.user_id = public.current_researcher_id()
        OR cc.wallet_address = current_setting('app.current_wallet_address', true)
      )
    )
    OR public.is_admin()
  );

-- Credit Balances
CREATE POLICY "Users see own balance" ON public.credit_balances
  FOR SELECT USING (user_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "System manages balances" ON public.credit_balances
  FOR ALL USING (public.is_admin());

-- Credit Transactions
CREATE POLICY "Users see own transactions" ON public.credit_transactions
  FOR SELECT USING (user_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "System creates transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (true);

-- Pending Crypto Payments
CREATE POLICY "Users see own payments" ON public.pending_crypto_payments
  FOR ALL USING (
    user_id = public.current_researcher_id()
    OR wallet_address = current_setting('app.current_wallet_address', true)
    OR public.is_admin()
  );

-- Promo Codes
CREATE POLICY "Active promo codes readable" ON public.promo_codes
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins manage promo codes" ON public.promo_codes
  FOR ALL USING (public.is_admin());

-- Subscriptions
CREATE POLICY "Users see own subscription" ON public.subscriptions
  FOR SELECT USING (user_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "System manages subscriptions" ON public.subscriptions
  FOR ALL USING (public.is_admin());

-- Gas Escrow
CREATE POLICY "Users see own gas escrow" ON public.gas_escrow
  FOR SELECT USING (user_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "System manages gas escrow" ON public.gas_escrow
  FOR ALL USING (public.is_admin());

-- Gas Transactions
CREATE POLICY "Users see own gas tx" ON public.gas_transactions
  FOR SELECT USING (user_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "System logs gas tx" ON public.gas_transactions
  FOR INSERT WITH CHECK (true);

-- NFC Cards
CREATE POLICY "Users manage own NFC cards" ON public.nfc_cards
  FOR ALL USING (user_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "Active NFC cards public for tap" ON public.nfc_cards
  FOR SELECT USING (is_active = true);

-- Public Profiles
CREATE POLICY "Public profiles are readable" ON public.public_profiles
  FOR SELECT USING (is_public = true OR researcher_id = public.current_researcher_id());

CREATE POLICY "Users manage own public profile" ON public.public_profiles
  FOR ALL USING (researcher_id = public.current_researcher_id() OR public.is_admin());

-- NFC Tap Log
CREATE POLICY "Card owners see tap log" ON public.nfc_tap_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.nfc_cards
      WHERE nfc_cards.id = nfc_tap_log.card_id
      AND nfc_cards.user_id = public.current_researcher_id()
    )
    OR public.is_admin()
  );

CREATE POLICY "System logs NFC taps" ON public.nfc_tap_log
  FOR INSERT WITH CHECK (true);

-- Vault Files
CREATE POLICY "Users manage own vault files" ON public.vault_files
  FOR ALL USING (user_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "Shared vault files accessible" ON public.vault_files
  FOR SELECT USING (
    is_shared = true
    AND share_link_token IS NOT NULL
    AND (share_link_expires_at IS NULL OR share_link_expires_at > now())
  );

-- Vault Access Log
CREATE POLICY "Vault owners see access log" ON public.vault_access_log
  FOR SELECT USING (owner_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "System logs vault access" ON public.vault_access_log
  FOR INSERT WITH CHECK (true);

-- Synthetic Datasets
CREATE POLICY "Creators manage synthetic datasets" ON public.synthetic_datasets
  FOR ALL USING (creator_id = public.current_researcher_id() OR public.is_admin());

CREATE POLICY "Public synthetic datasets readable" ON public.synthetic_datasets
  FOR SELECT USING (access_level = 'public' OR creator_id = public.current_researcher_id());

-- Synthetic Access Log
CREATE POLICY "Synthetic access log visible to creators" ON public.synthetic_access_log
  FOR SELECT USING (
    accessor_id = public.current_researcher_id()
    OR EXISTS (
      SELECT 1 FROM public.synthetic_datasets sd
      WHERE sd.id = synthetic_access_log.synthetic_id
      AND sd.creator_id = public.current_researcher_id()
    )
    OR public.is_admin()
  );

CREATE POLICY "System logs synthetic access" ON public.synthetic_access_log
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- SECTION 12: FUNCTIONS
-- ============================================================================

-- 12.1 search_articles() - 3-tier search (DOCI match, FTS, ILIKE fallback)
CREATE OR REPLACE FUNCTION public.search_articles(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  doci TEXT,
  title TEXT,
  abstract TEXT,
  authors JSONB,
  keywords TEXT[],
  field_of_study TEXT,
  status TEXT,
  citation_count INTEGER,
  impact_score NUMERIC,
  published_at TIMESTAMPTZ,
  search_rank REAL,
  match_type TEXT
) AS $$
BEGIN
  -- Tier 1: Exact DOCI match
  RETURN QUERY
  SELECT
    a.id, a.doci, a.title, a.abstract, a.authors, a.keywords,
    a.field_of_study, a.status, a.citation_count, a.impact_score,
    a.published_at,
    1.0::REAL AS search_rank,
    'doci_match'::TEXT AS match_type
  FROM public.articles a
  WHERE a.doci = search_query
    AND a.status = 'published'
  LIMIT 1;

  -- If DOCI match found, return early
  IF FOUND THEN
    RETURN;
  END IF;

  -- Tier 2: Full-text search
  RETURN QUERY
  SELECT
    a.id, a.doci, a.title, a.abstract, a.authors, a.keywords,
    a.field_of_study, a.status, a.citation_count, a.impact_score,
    a.published_at,
    ts_rank(a.fts_vector, websearch_to_tsquery('english', search_query))::REAL AS search_rank,
    'fts_match'::TEXT AS match_type
  FROM public.articles a
  WHERE a.fts_vector @@ websearch_to_tsquery('english', search_query)
    AND a.status = 'published'
  ORDER BY search_rank DESC, a.citation_count DESC
  LIMIT result_limit
  OFFSET result_offset;

  -- If FTS results found, return
  IF FOUND THEN
    RETURN;
  END IF;

  -- Tier 3: ILIKE fallback for partial matches
  RETURN QUERY
  SELECT
    a.id, a.doci, a.title, a.abstract, a.authors, a.keywords,
    a.field_of_study, a.status, a.citation_count, a.impact_score,
    a.published_at,
    0.1::REAL AS search_rank,
    'ilike_fallback'::TEXT AS match_type
  FROM public.articles a
  WHERE a.status = 'published'
    AND (
      a.title ILIKE '%' || search_query || '%'
      OR a.abstract ILIKE '%' || search_query || '%'
      OR search_query = ANY(a.keywords)
    )
  ORDER BY a.citation_count DESC, a.impact_score DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 12.2 spend_credits() - Atomic credit deduction with revenue splits
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_author_wallet TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_balance NUMERIC;
  v_new_balance NUMERIC;
  v_platform_share NUMERIC;
  v_author_share NUMERIC;
  v_pool_share NUMERIC;
  v_reserve_share NUMERIC;
  v_tx_id UUID;
BEGIN
  -- Lock the balance row for update
  SELECT balance INTO v_balance
  FROM public.credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No credit balance found');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'balance', v_balance, 'required', p_amount);
  END IF;

  -- Calculate revenue splits: 40% platform, 20% author, 20% pool, 20% reserve
  v_platform_share := ROUND(p_amount * 0.40, 6);
  v_author_share := ROUND(p_amount * 0.20, 6);
  v_pool_share := ROUND(p_amount * 0.20, 6);
  v_reserve_share := ROUND(p_amount * 0.20, 6);

  v_new_balance := v_balance - p_amount;

  -- Update balance
  UPDATE public.credit_balances
  SET balance = v_new_balance,
      lifetime_spent = lifetime_spent + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id, amount, type, description,
    reference_type, reference_id,
    revenue_platform_usdc, revenue_author_usdc,
    revenue_pool_usdc, revenue_reserve_usdc,
    balance_before, balance_after
  ) VALUES (
    p_user_id, -p_amount, 'spend', p_description,
    p_reference_type, p_reference_id,
    v_platform_share, v_author_share,
    v_pool_share, v_reserve_share,
    v_balance, v_new_balance
  ) RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'balance_before', v_balance,
    'balance_after', v_new_balance,
    'amount_spent', p_amount,
    'splits', jsonb_build_object(
      'platform', v_platform_share,
      'author', v_author_share,
      'pool', v_pool_share,
      'reserve', v_reserve_share
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12.3 add_credits() - Atomic credit addition
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL,
  p_payment_provider TEXT DEFAULT NULL,
  p_payment_provider_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_balance NUMERIC;
  v_new_balance NUMERIC;
  v_tx_id UUID;
  v_lifetime_col TEXT;
BEGIN
  -- Upsert balance row
  INSERT INTO public.credit_balances (user_id, balance, lifetime_purchased)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock and get current balance
  SELECT balance INTO v_balance
  FROM public.credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_new_balance := v_balance + p_amount;

  -- Update balance and appropriate lifetime counter
  IF p_type IN ('purchase', 'subscription', 'promo') THEN
    UPDATE public.credit_balances
    SET balance = v_new_balance,
        lifetime_purchased = lifetime_purchased + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF p_type = 'earn' THEN
    UPDATE public.credit_balances
    SET balance = v_new_balance,
        lifetime_earned = lifetime_earned + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.credit_balances
    SET balance = v_new_balance,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id, amount, type, description,
    payment_provider, payment_provider_id,
    balance_before, balance_after
  ) VALUES (
    p_user_id, p_amount, p_type, p_description,
    p_payment_provider, p_payment_provider_id,
    v_balance, v_new_balance
  ) RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'balance_before', v_balance,
    'balance_after', v_new_balance,
    'amount_added', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12.4 check_gas_budget() - Verify gas budget availability
CREATE OR REPLACE FUNCTION public.check_gas_budget(
  p_user_id UUID,
  p_required_lamports BIGINT
)
RETURNS JSONB AS $$
DECLARE
  v_escrow RECORD;
  v_remaining BIGINT;
BEGIN
  SELECT * INTO v_escrow
  FROM public.gas_escrow
  WHERE user_id = p_user_id;

  IF v_escrow IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'No gas escrow found');
  END IF;

  -- Check if month needs reset
  IF v_escrow.month_start < date_trunc('month', CURRENT_DATE)::DATE THEN
    UPDATE public.gas_escrow
    SET monthly_spent_lamports = 0,
        monthly_tx_count = 0,
        month_start = date_trunc('month', CURRENT_DATE)::DATE,
        updated_at = now()
    WHERE user_id = p_user_id;

    v_escrow.monthly_spent_lamports := 0;
    v_escrow.monthly_tx_count := 0;
  END IF;

  v_remaining := v_escrow.monthly_allocation_lamports - v_escrow.monthly_spent_lamports;

  IF v_remaining < p_required_lamports THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'Insufficient gas budget',
      'remaining_lamports', v_remaining,
      'required_lamports', p_required_lamports
    );
  END IF;

  IF v_escrow.monthly_tx_count >= v_escrow.max_monthly_tx THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'Monthly transaction limit reached',
      'tx_count', v_escrow.monthly_tx_count,
      'max_tx', v_escrow.max_monthly_tx
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining_lamports', v_remaining,
    'remaining_tx', v_escrow.max_monthly_tx - v_escrow.monthly_tx_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12.5 spend_gas() - Atomic gas deduction
CREATE OR REPLACE FUNCTION public.spend_gas(
  p_user_id UUID,
  p_lamports BIGINT,
  p_action_type TEXT,
  p_solana_tx_signature TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_check JSONB;
  v_tx_id UUID;
BEGIN
  -- Check budget first
  v_check := public.check_gas_budget(p_user_id, p_lamports);

  IF NOT (v_check->>'allowed')::BOOLEAN THEN
    RETURN v_check;
  END IF;

  -- Deduct gas
  UPDATE public.gas_escrow
  SET monthly_spent_lamports = monthly_spent_lamports + p_lamports,
      monthly_tx_count = monthly_tx_count + 1,
      sol_balance_lamports = sol_balance_lamports - p_lamports,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO public.gas_transactions (
    user_id, lamports_spent, action_type,
    solana_tx_signature, description
  ) VALUES (
    p_user_id, p_lamports, p_action_type,
    p_solana_tx_signature, p_description
  ) RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'lamports_spent', p_lamports,
    'action_type', p_action_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12.6 reset_monthly_counters() - Reset gas counters at month start
CREATE OR REPLACE FUNCTION public.reset_monthly_counters()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.gas_escrow
  SET monthly_spent_lamports = 0,
      monthly_tx_count = 0,
      month_start = date_trunc('month', CURRENT_DATE)::DATE,
      updated_at = now()
  WHERE month_start < date_trunc('month', CURRENT_DATE)::DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 13: TRIGGERS
-- ============================================================================

-- Auto-update updated_at for all tables with that column
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'journals', 'researchers', 'articles', 'reviews',
    'datasets', 'chat_conversations', 'credit_balances',
    'subscriptions', 'gas_escrow', 'nfc_cards', 'public_profiles',
    'vault_files', 'api_rate_limits', 'reviewer_expertise'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

-- Auto-increment article citation_count on new citation
CREATE OR REPLACE FUNCTION public.increment_citation_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.articles
  SET citation_count = citation_count + 1
  WHERE id = NEW.article_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_citation_insert ON public.citations;
CREATE TRIGGER on_citation_insert
  AFTER INSERT ON public.citations
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_citation_count();

-- Auto-increment dataset download_count
CREATE OR REPLACE FUNCTION public.increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.access_type = 'download' THEN
    UPDATE public.datasets
    SET download_count = download_count + 1
    WHERE id = NEW.dataset_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_dataset_download ON public.dataset_access_log;
CREATE TRIGGER on_dataset_download
  AFTER INSERT ON public.dataset_access_log
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_download_count();

-- Update chat conversation stats on new message
CREATE OR REPLACE FUNCTION public.update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
  SET message_count = message_count + 1,
      total_credits_used = total_credits_used + COALESCE(NEW.credits_charged, 0),
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_chat_message_insert ON public.chat_messages;
CREATE TRIGGER on_chat_message_insert
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_stats();

-- ============================================================================
-- SECTION 14: GRANTS (service_role access)
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant access to all tables for service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant limited access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant read-only to anon for public data
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON FUNCTION public.search_articles TO anon;

-- ============================================================================
-- Migration complete. Total: 46 tables/entities, 7 functions, 50+ RLS policies
-- ============================================================================
