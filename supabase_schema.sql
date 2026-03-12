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

-- Create basic RLS policies allowing full access to authenticated users based on their wallet_address
-- Assuming you will pass the wallet_address from the frontend

CREATE POLICY "Users can insert their own record" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own record" ON public.users
  FOR SELECT USING (true);
  
CREATE POLICY "Users can manage their chat history" ON public.chat_history
  FOR ALL USING (true); -- Note: In a production app, you would verify the JWT for the exact wallet address
  
CREATE POLICY "Users can manage their walrus blobs" ON public.walrus_blobs
  FOR ALL USING (true);

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

-- Note: Proper RLS for Admin tables would require checking the user's role = 'Journal Admin' or a hardcoded list
CREATE POLICY "Admins manage config" ON public.protocol_config FOR ALL USING (true);
CREATE POLICY "Admins manage seeds" ON public.admin_seeds FOR ALL USING (true);
CREATE POLICY "Public can read seeds" ON public.admin_seeds FOR SELECT USING (true);

