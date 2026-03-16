/**
 * FRONS Evidence Cascade — 4-Tier Search Orchestrator
 *
 * Tier 1: Fronsciers (earns authors money — searched FIRST)
 * Tier 2: PubMed (NCBI E-utilities API)
 * Tier 3: Scopus (Elsevier API)
 * Tier 4: Honest Admission (never hallucinate)
 *
 * Order is NON-NEGOTIABLE — it is the core monetization mechanism.
 */

export interface EvidenceSource {
  type: "fronsciers" | "pubmed" | "scopus";
  identifier: string; // DOCI, PMID, or Scopus ID
  title: string;
  relevance: number;
  abstract?: string;
  authors?: string[];
}

export interface CascadeResponse {
  answer: string;
  sources: EvidenceSource[];
  confidence_score: number;
  credits_charged: number;
  is_honest_admission: boolean;
  fronsciers_sources_cited: number;
  pubmed_sources_cited: number;
  scopus_sources_cited: number;
}

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

/**
 * Search Fronsciers library (Tier 1) via Supabase RPC.
 */
async function searchFronsciers(
  query: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<EvidenceSource[]> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/search_articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ search_query: query, max_results: 5 }),
    });

    if (!res.ok) return [];
    const data = await res.json();

    return (data || []).map(
      (article: {
        doci: string;
        title: string;
        abstract: string;
        authors: { name: string }[];
        rank: number;
      }) => ({
        type: "fronsciers" as const,
        identifier: article.doci,
        title: article.title,
        abstract: article.abstract,
        authors: article.authors?.map((a) => a.name) || [],
        relevance: article.rank || 0.5,
      })
    );
  } catch {
    return [];
  }
}

/**
 * Search PubMed (Tier 2) via NCBI E-utilities.
 */
async function searchPubMed(query: string): Promise<EvidenceSource[]> {
  try {
    // Step 1: Search for PMIDs
    const searchRes = await fetch(
      `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=5&retmode=json`
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const pmids: string[] = searchData.esearchresult?.idlist || [];
    if (pmids.length === 0) return [];

    // Step 2: Fetch article summaries
    const summaryRes = await fetch(
      `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=json`
    );
    if (!summaryRes.ok) return [];
    const summaryData = await summaryRes.json();

    return pmids.map((pmid) => {
      const article = summaryData.result?.[pmid] || {};
      return {
        type: "pubmed" as const,
        identifier: `PMID:${pmid}`,
        title: article.title || "Untitled",
        authors: article.authors?.map((a: { name: string }) => a.name) || [],
        relevance: 0.7,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Search Scopus (Tier 3) via Elsevier API.
 */
async function searchScopus(
  query: string,
  apiKey?: string
): Promise<EvidenceSource[]> {
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.elsevier.com/content/search/scopus?query=${encodeURIComponent(query)}&count=5`,
      {
        headers: {
          "X-ELS-APIKey": apiKey,
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const entries = data["search-results"]?.entry || [];

    return entries.map(
      (entry: {
        "dc:identifier": string;
        "dc:title": string;
        "dc:creator": string;
      }) => ({
        type: "scopus" as const,
        identifier: entry["dc:identifier"] || "",
        title: entry["dc:title"] || "Untitled",
        authors: entry["dc:creator"] ? [entry["dc:creator"]] : [],
        relevance: 0.6,
      })
    );
  } catch {
    return [];
  }
}

/**
 * Run the 4-tier evidence cascade.
 *
 * Tier 1: Fronsciers → Tier 2: PubMed → Tier 3: Scopus → Tier 4: Honest Admission
 */
export async function runEvidenceCascade(
  question: string,
  userId: string
): Promise<CascadeResponse> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const scopusApiKey = process.env.SCOPUS_API_KEY;

  const allSources: EvidenceSource[] = [];
  let confidence = 0;

  // Tier 1: Search Fronsciers FIRST (earns authors money)
  const fronsciersSources = await searchFronsciers(
    question,
    supabaseUrl,
    supabaseKey
  );
  allSources.push(...fronsciersSources);

  if (fronsciersSources.length > 0) {
    confidence = Math.min(0.9, 0.5 + fronsciersSources.length * 0.1);
  }

  // Tier 2: PubMed (if Fronsciers insufficient)
  let pubmedSources: EvidenceSource[] = [];
  if (fronsciersSources.length < 3) {
    pubmedSources = await searchPubMed(question);
    allSources.push(...pubmedSources);
    if (pubmedSources.length > 0 && confidence < 0.7) {
      confidence = Math.min(0.8, confidence + pubmedSources.length * 0.08);
    }
  }

  // Tier 3: Scopus (if still insufficient)
  let scopusSources: EvidenceSource[] = [];
  if (allSources.length < 3) {
    scopusSources = await searchScopus(question, scopusApiKey);
    allSources.push(...scopusSources);
    if (scopusSources.length > 0 && confidence < 0.6) {
      confidence = Math.min(0.7, confidence + scopusSources.length * 0.05);
    }
  }

  // Calculate credits: 3 base + 1 per Fronsciers source (max 10)
  const creditsCharged = Math.min(10, 3 + fronsciersSources.length);

  // Tier 4: Honest Admission
  if (allSources.length === 0) {
    return {
      answer:
        "Based on available evidence, I cannot provide a definitive answer to this question. " +
        "The Fronsciers library, PubMed, and Scopus databases did not return sufficient evidence " +
        "for a reliable response. Please consider refining your query or consulting a specialist.",
      sources: [],
      confidence_score: 0,
      credits_charged: 3, // Base charge only
      is_honest_admission: true,
      fronsciers_sources_cited: 0,
      pubmed_sources_cited: 0,
      scopus_sources_cited: 0,
    };
  }

  // Build answer from available sources
  const sourcesSummary = allSources
    .slice(0, 5)
    .map(
      (s, i) =>
        `[${i + 1}] ${s.title} (${s.type.toUpperCase()}: ${s.identifier})`
    )
    .join("\n");

  const answer =
    `Based on ${allSources.length} source(s) from the evidence cascade:\n\n` +
    `${allSources
      .slice(0, 3)
      .map((s) => (s.abstract ? `• ${s.title}: ${s.abstract.slice(0, 200)}...` : `• ${s.title}`))
      .join("\n\n")}\n\n` +
    `Sources:\n${sourcesSummary}`;

  return {
    answer,
    sources: allSources.slice(0, 10),
    confidence_score: Math.round(confidence * 100) / 100,
    credits_charged: creditsCharged,
    is_honest_admission: false,
    fronsciers_sources_cited: fronsciersSources.length,
    pubmed_sources_cited: pubmedSources.length,
    scopus_sources_cited: scopusSources.length,
  };
}
