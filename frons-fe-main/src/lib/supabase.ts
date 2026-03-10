/**
 * Supabase Client — Fronsciers
 *
 * Gated behind NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * When env vars are not set or @supabase/supabase-js is not installed,
 * all helper functions gracefully return empty results.
 *
 * To activate:
 *   1. npm install @supabase/supabase-js
 *   2. Add to .env.local:
 *      NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *      NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
 */

// ─── Type helpers ─────────────────────────────────────────────────────
export interface Article {
  id: string;
  doci: string;
  title: string;
  abstract: string;
  field: string;
  authors: { name: string; wallet_address: string; affiliation?: string }[];
  keywords: string[];
  status: "submitted" | "under_review" | "published" | "rejected";
  manuscript_hash: string;
  citation_count: number;
  access_count: number;
  impact_score: number;
  published_at: string | null;
  created_at: string;
}

export interface ResearcherProfile {
  id: string;
  wallet_address: string;
  display_name: string;
  institution: string;
  specialization: string;
  papers_published: number;
  total_citations: number;
  impact_score: number;
  total_earnings: number;
}

// ─── Lazy client ──────────────────────────────────────────────────────
// Lazy client — uses `any` since @supabase/supabase-js may not be installed
let _supabase: any = null; // eslint-disable-line
let _initialized = false;

async function getClient() {
  if (_initialized) return _supabase;
  _initialized = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.log("[supabase] No credentials found — running without Supabase");
    return null;
  }

  try {
    // @ts-ignore — @supabase/supabase-js is optional, installed by partner
    const { createClient } = await import("@supabase/supabase-js");
    _supabase = createClient(url, key);
    console.log("[supabase] Client initialized");
  } catch {
    console.warn("[supabase] @supabase/supabase-js not installed — skipping");
  }

  return _supabase;
}

// ─── Query helpers ────────────────────────────────────────────────────

/** Search published articles — falls back to empty array when Supabase is not configured */
export async function searchArticles(
  query: string,
  field?: string,
  limit = 20
): Promise<Article[]> {
  const supabase = await getClient();
  if (!supabase) return [];

  let q = supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (query) {
    q = q.or(
      `title.ilike.%${query}%,abstract.ilike.%${query}%,doci.eq.${query}`
    );
  }
  if (field && field !== "All Fields") {
    q = q.eq("field", field);
  }

  const { data, error } = await q;
  if (error) {
    console.error("[supabase] searchArticles error:", error.message);
    return [];
  }
  return (data as Article[]) ?? [];
}

/** Get a single article by DOCI */
export async function getArticleByDoci(
  doci: string
): Promise<Article | null> {
  const supabase = await getClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("doci", doci)
    .single();

  if (error) {
    console.error("[supabase] getArticleByDoci error:", error.message);
    return null;
  }
  return data as Article;
}

/** Get the monthly leaderboard */
export async function getLeaderboard(
  period?: string,
  limit = 20
): Promise<ResearcherProfile[]> {
  const supabase = await getClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("researcher_profiles")
    .select("*")
    .order("impact_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[supabase] getLeaderboard error:", error.message);
    return [];
  }
  return (data as ResearcherProfile[]) ?? [];
}

/** Get researcher profile by wallet address */
export async function getResearcherProfile(
  walletAddress: string
): Promise<ResearcherProfile | null> {
  const supabase = await getClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("researcher_profiles")
    .select("*")
    .eq("wallet_address", walletAddress)
    .single();

  if (error) return null;
  return data as ResearcherProfile;
}
