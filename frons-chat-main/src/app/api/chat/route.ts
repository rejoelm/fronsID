import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

interface ChatRequest {
  question: string;
  conversation_id?: string;
  user_id: string;
}

interface ArticleSource {
  id: string;
  title: string;
  authors: string[];
  doi?: string;
  url?: string;
  snippet: string;
  tier: "fronsciers" | "pubmed" | "scopus";
  relevance_score: number;
}

interface PubMedArticle {
  uid: string;
  title: string;
  authors: { name: string }[];
  source: string;
  pubdate: string;
}

async function searchFronsciers(question: string): Promise<ArticleSource[]> {
  const { data, error } = await supabaseAdmin.rpc("search_articles", {
    search_query: question,
    match_limit: 5,
  });

  if (error || !data || data.length === 0) {
    return [];
  }

  return data.map((article: any) => ({
    id: article.id,
    title: article.title,
    authors: article.authors || [],
    doi: article.doi,
    url: article.url,
    snippet: article.snippet || article.abstract?.substring(0, 300) || "",
    tier: "fronsciers" as const,
    relevance_score: article.similarity || article.relevance_score || 0,
  }));
}

async function searchPubMed(question: string): Promise<ArticleSource[]> {
  try {
    const searchUrl = new URL(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    );
    searchUrl.searchParams.set("db", "pubmed");
    searchUrl.searchParams.set("term", question);
    searchUrl.searchParams.set("retmax", "5");
    searchUrl.searchParams.set("retmode", "json");

    const apiKey = process.env.NCBI_API_KEY;
    if (apiKey) {
      searchUrl.searchParams.set("api_key", apiKey);
    }

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const ids: string[] = searchData?.esearchresult?.idlist || [];

    if (ids.length === 0) return [];

    const fetchUrl = new URL(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    );
    fetchUrl.searchParams.set("db", "pubmed");
    fetchUrl.searchParams.set("id", ids.join(","));
    fetchUrl.searchParams.set("retmode", "json");
    if (apiKey) {
      fetchUrl.searchParams.set("api_key", apiKey);
    }

    const fetchRes = await fetch(fetchUrl.toString());
    if (!fetchRes.ok) return [];

    const fetchData = await fetchRes.json();
    const result = fetchData?.result || {};

    return ids
      .filter((id) => result[id])
      .map((id) => {
        const article = result[id] as PubMedArticle;
        return {
          id: `pubmed-${id}`,
          title: article.title || "",
          authors: (article.authors || []).map((a) => a.name),
          doi: undefined,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          snippet: `${article.source || ""} (${article.pubdate || ""})`,
          tier: "pubmed" as const,
          relevance_score: 0.5,
        };
      });
  } catch {
    return [];
  }
}

async function searchScopus(question: string): Promise<ArticleSource[]> {
  const scopusKey = process.env.SCOPUS_API_KEY;
  if (!scopusKey) return [];

  try {
    const url = new URL("https://api.elsevier.com/content/search/scopus");
    url.searchParams.set("query", question);
    url.searchParams.set("count", "5");

    const res = await fetch(url.toString(), {
      headers: {
        "X-ELS-APIKey": scopusKey,
        Accept: "application/json",
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const entries = data?.["search-results"]?.entry || [];

    return entries.map((entry: any) => ({
      id: `scopus-${entry["dc:identifier"] || entry["eid"] || ""}`,
      title: entry["dc:title"] || "",
      authors: [entry["dc:creator"] || ""].filter(Boolean),
      doi: entry["prism:doi"],
      url:
        entry.link?.find((l: any) => l["@ref"] === "scopus")?.["@href"] || "",
      snippet: entry["dc:description"] || entry["prism:publicationName"] || "",
      tier: "scopus" as const,
      relevance_score: 0.4,
    }));
  } catch {
    return [];
  }
}

function generateAnswer(
  question: string,
  sources: ArticleSource[],
  isHonestAdmission: boolean
): string {
  if (isHonestAdmission) {
    return `I was unable to find peer-reviewed sources that directly address your question: "${question}". This is an honest admission — I'd rather tell you I don't have a well-sourced answer than risk providing inaccurate information. Please consider consulting a specialist or rephrasing your question.`;
  }

  const sourceList = sources
    .map((s, i) => `[${i + 1}] ${s.title} (${s.tier})`)
    .join("\n");

  return `Based on the available literature, here is what I found regarding your question:\n\nSources consulted:\n${sourceList}\n\nPlease review the cited sources for detailed information. This response is generated from indexed research articles and should be verified with primary sources.`;
}

function calculateCredits(sources: ArticleSource[]): number {
  const baseCost = 3;
  const fronsciersSources = sources.filter(
    (s) => s.tier === "fronsciers"
  ).length;
  const additionalCost = Math.min(fronsciersSources, 7); // max total 10
  return Math.min(baseCost + additionalCost, 10);
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { question, conversation_id, user_id } = body;

    if (!question || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields: question and user_id" },
        { status: 400 }
      );
    }

    // Tier 1: Search Fronsciers articles
    let sources: ArticleSource[] = await searchFronsciers(question);
    let confidenceScore = sources.length > 0 ? 0.9 : 0;

    // Tier 2: Fall back to PubMed
    if (sources.length === 0) {
      sources = await searchPubMed(question);
      confidenceScore = sources.length > 0 ? 0.7 : 0;
    }

    // Tier 3: Fall back to Scopus
    if (sources.length === 0) {
      sources = await searchScopus(question);
      confidenceScore = sources.length > 0 ? 0.5 : 0;
    }

    // Tier 4: Honest admission
    const isHonestAdmission = sources.length === 0;
    if (isHonestAdmission) {
      confidenceScore = 0;
    }

    const answer = generateAnswer(question, sources, isHonestAdmission);
    const creditsCharged = calculateCredits(sources);

    // Charge credits
    const { error: creditError } = await supabaseAdmin.rpc("spend_credits", {
      p_user_id: user_id,
      p_amount: creditsCharged,
      p_reason: "chat_query",
      p_reference_id: conversation_id || null,
    });

    if (creditError) {
      return NextResponse.json(
        { error: "Insufficient credits or credit error", details: creditError.message },
        { status: 402 }
      );
    }

    // Save message to chat_messages
    const { error: messageError } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        conversation_id: conversation_id || crypto.randomUUID(),
        user_id,
        role: "assistant",
        content: answer,
        question,
        sources: sources,
        confidence_score: confidenceScore,
        credits_charged: creditsCharged,
        is_honest_admission: isHonestAdmission,
      });

    if (messageError) {
      console.error("Failed to save chat message:", messageError);
    }

    return NextResponse.json({
      answer,
      sources,
      confidence_score: confidenceScore,
      credits_charged: creditsCharged,
      is_honest_admission: isHonestAdmission,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
