import { createClient } from "@supabase/supabase-js";

// Use the same environmental variables established across the ecosystem
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";

// Create a single Supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export async function searchArticles(query: string, field?: string, limit = 20): Promise<Article[]> {
  let q = supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (query) {
    q = q.or(`title.ilike.%${query}%,abstract.ilike.%${query}%,doci.eq.${query}`);
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

export async function getArticleByDoci(doci: string): Promise<Article | null> {
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

export interface LeaderboardEntry {
  rank: number;
  researcher_name: string;
  institution: string;
  impact_score: number;
  citation_count: number;
  pcs_score: number;
  pool_payout_usdc: number;
  period: string;
}

export async function getLeaderboard(period?: string, limit = 50): Promise<LeaderboardEntry[]> {
  let q = supabase
    .from("leaderboard")
    .select(`
      rank,
      impact_score,
      citation_count,
      pcs_score,
      pool_payout_usdc,
      period,
      researchers ( display_name, institution )
    `)
    .order("rank", { ascending: true })
    .limit(limit);

  if (period) {
    q = q.eq("period", period);
  }

  const { data, error } = await q;
  if (error) {
    console.error("[supabase] getLeaderboard error:", error.message);
    return [];
  }

  // Flatten the joined researchers data
  return (data ?? []).map((row: Record<string, unknown>) => {
    const researcher = row.researchers as { display_name?: string; institution?: string } | null;
    return {
      rank: row.rank as number,
      researcher_name: researcher?.display_name ?? "Unknown",
      institution: researcher?.institution ?? "—",
      impact_score: row.impact_score as number,
      citation_count: row.citation_count as number,
      pcs_score: row.pcs_score as number,
      pool_payout_usdc: row.pool_payout_usdc as number,
      period: row.period as string,
    };
  });
}

export async function getLeaderboardPeriods(): Promise<string[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("period")
    .order("period", { ascending: false });

  if (error) {
    console.error("[supabase] getLeaderboardPeriods error:", error.message);
    return [];
  }

  // Deduplicate periods
  const unique = [...new Set((data ?? []).map((r: { period: string }) => r.period))];
  return unique;
}

export async function getResearcherProfile(walletAddress: string): Promise<ResearcherProfile | null> {
  const { data, error } = await supabase
    .from("researcher_profiles")
    .select("*")
    .eq("wallet_address", walletAddress)
    .single();

  if (error) return null;
  return data as ResearcherProfile;
}
