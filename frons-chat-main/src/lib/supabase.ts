import { createClient } from "@supabase/supabase-js";

// Use the same environmental variables established across the ecosystem
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";

// Create a single Supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ChatHistoryRecord = {
  id: string;
  wallet_address: string;
  title: string;
  messages: any[];
  created_at: string;
  updated_at: string;
};

export type WalrusBlobRecord = {
  id: string;
  wallet_address: string;
  blob_id: string;
  file_name: string;
  is_encrypted: boolean;
  created_at: string;
};
