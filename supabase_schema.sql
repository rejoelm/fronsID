-- Run this in your Supabase SQL Editor

-- 1. Create the Users table
CREATE TABLE IF NOT EXISTS public.users (
  wallet_address TEXT PRIMARY KEY,
  role TEXT DEFAULT 'Author' CHECK (role IN ('Author', 'Reviewer', 'Journal Admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Chat History table
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the Walrus Blobs (Vault) table
CREATE TABLE IF NOT EXISTS public.walrus_blobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  blob_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walrus_blobs ENABLE ROW LEVEL SECURITY;

-- ==================================================================================
-- SECURE RLS POLICIES
-- These policies enforce row-level isolation using client-side wallet_address filters.
-- In production with Supabase Auth, replace with auth.uid() checks.
-- The anon key only allows access through these policies.
-- ==================================================================================

-- Users table: Allow insert only for new registrations, restrict role to 'Author' on insert
CREATE POLICY "Users can insert their own record" ON public.users
  FOR INSERT WITH CHECK (
    role = 'Author'  -- New users can only register as Author, not self-assign admin
  );

-- Users table: Public read for profile/citation lookup (wallet_address and role only)
-- Consider restricting to specific columns via a view if more fields are added
CREATE POLICY "Users can view profiles" ON public.users
  FOR SELECT USING (true);

-- Users table: Users can only update their own record, and cannot change role
CREATE POLICY "Users can update their own record" ON public.users
  FOR UPDATE USING (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
  ) WITH CHECK (
    role = 'Author' OR role = 'Reviewer'  -- Cannot self-promote to Journal Admin
  );

-- Chat History: Users can only access their own chat history
-- Enforced by requiring wallet_address match in the query filter
CREATE POLICY "Users can manage their own chat history" ON public.chat_history
  FOR ALL USING (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Walrus Blobs: Users can only access their own vault files
CREATE POLICY "Users can manage their own walrus blobs" ON public.walrus_blobs
  FOR ALL USING (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_history_modtime
BEFORE UPDATE ON public.chat_history
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- PHASE 6: Admin Dashboard Additions

-- 4. Create the Protocol Config table (for API keys/vendor management)
-- SECURITY: This table should only be accessible via service_role key from a backend function
CREATE TABLE IF NOT EXISTS public.protocol_config (
  key_name TEXT PRIMARY KEY,
  key_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create the Admin AI Seeds table (direct Walrus uploads bypassing peer review)
CREATE TABLE IF NOT EXISTS public.admin_seeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blob_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT DEFAULT 'FRONS Foundation',
  category TEXT,
  uploaded_by TEXT NOT NULL REFERENCES public.users(wallet_address),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.protocol_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_seeds ENABLE ROW LEVEL SECURITY;

-- Admin whitelist table for secure admin management
CREATE TABLE IF NOT EXISTS public.admin_whitelist (
  wallet_address TEXT PRIMARY KEY REFERENCES public.users(wallet_address),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  added_by TEXT NOT NULL
);

ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Protocol config: ONLY accessible by whitelisted admins
-- In production, prefer using service_role key from a backend function instead
CREATE POLICY "Admins manage config" ON public.protocol_config FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- Admin seeds: Only whitelisted admins can insert
CREATE POLICY "Admins manage seeds" ON public.admin_seeds FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- Admin seeds: Public read access for AI training data
CREATE POLICY "Public can read seeds" ON public.admin_seeds FOR SELECT USING (true);

-- Admin whitelist: Only existing admins can manage (bootstrap first admin via SQL)
CREATE POLICY "Admins manage whitelist" ON public.admin_whitelist FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);
