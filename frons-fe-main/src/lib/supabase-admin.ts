import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with service role key.
 * Used in API routes for privileged operations like adding/spending credits.
 * NEVER import this in client-side code.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-service-key";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
