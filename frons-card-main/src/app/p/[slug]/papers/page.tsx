"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/landing/footer";
import {
  Loader2,
  ArrowLeft,
  FileText,
  ExternalLink,
  Quote,
  Calendar,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react";

interface Paper {
  id: string;
  doci: string;
  title: string;
  abstract?: string;
  status: string;
  citation_count: number;
  publication_date: string;
  field?: string;
  keywords?: string[];
}

// Mock data for development
const MOCK_PAPERS: Paper[] = [
  {
    id: "1",
    doci: "10.fronsciers/2026.0042",
    title: "Self-Attention Mechanisms in Protein Folding Prediction Models",
    abstract:
      "We propose a novel self-attention architecture specifically designed for protein folding prediction that achieves state-of-the-art accuracy on CASP15 benchmarks while reducing computational complexity by 40%.",
    status: "published",
    citation_count: 342,
    publication_date: "2026-01-15T10:00:00Z",
    field: "Computational Biology",
    keywords: ["protein folding", "self-attention", "deep learning"],
  },
  {
    id: "2",
    doci: "10.fronsciers/2025.1088",
    title: "Synthetic Data Generation for Privacy-Preserving Clinical Trials",
    abstract:
      "This paper introduces a differentially private generative model for creating synthetic clinical trial datasets that preserve statistical utility while providing formal privacy guarantees.",
    status: "published",
    citation_count: 89,
    publication_date: "2025-08-22T14:30:00Z",
    field: "Health Informatics",
    keywords: ["synthetic data", "differential privacy", "clinical trials"],
  },
  {
    id: "3",
    doci: "10.fronsciers/2025.0412",
    title: "Evaluating k-anonymity in LLM Context Windows",
    abstract:
      "We systematically evaluate the privacy risks of large language model context windows and propose a novel k-anonymity framework for safeguarding sensitive data during inference.",
    status: "published",
    citation_count: 215,
    publication_date: "2025-04-10T09:15:00Z",
    field: "AI Safety",
    keywords: ["k-anonymity", "LLM", "privacy"],
  },
  {
    id: "4",
    doci: "10.fronsciers/2024.0891",
    title: "Graph Neural Networks for Drug-Target Interaction Prediction",
    abstract:
      "A multi-relational graph neural network approach to predicting drug-target interactions that outperforms existing methods on the DrugBank benchmark by 12%.",
    status: "published",
    citation_count: 178,
    publication_date: "2024-11-03T16:00:00Z",
    field: "Bioinformatics",
    keywords: ["GNN", "drug discovery", "molecular graphs"],
  },
  {
    id: "5",
    doci: "10.fronsciers/2024.0345",
    title: "Contrastive Learning Paradigms for Amino Acid Side-Chain Generation",
    abstract:
      "We introduce a contrastive learning framework that significantly improves the accuracy of amino acid side-chain conformation prediction in de novo protein design.",
    status: "published",
    citation_count: 267,
    publication_date: "2024-05-19T11:00:00Z",
    field: "Computational Biology",
    keywords: ["contrastive learning", "protein design", "side-chain prediction"],
  },
];

export default function PapersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const unwrappedParams = use(params);
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "citations">("date");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPapers(MOCK_PAPERS);
      setDisplayName(
        unwrappedParams.slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      );
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [unwrappedParams.slug]);

  const filteredPapers = papers
    .filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.doci.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.field?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "citations") return b.citation_count - a.citation_count;
      return (
        new Date(b.publication_date).getTime() -
        new Date(a.publication_date).getTime()
      );
    });

  const totalCitations = papers.reduce((sum, p) => sum + p.citation_count, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#2C337A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FD] text-gray-900 font-sans selection:bg-[#FFC6DE] selection:text-[#2C337A] flex flex-col pt-16">
      <Navbar />

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back navigation */}
        <Link
          href={`/p/${unwrappedParams.slug}`}
          className="inline-flex items-center gap-2 text-[#2C337A] hover:text-[#FB7720] transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {displayName}&apos;s Profile
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C337A] flex items-center gap-3">
                <FileText className="w-7 h-7" />
                Publications
              </h1>
              <p className="text-gray-500 mt-1">
                {displayName}&apos;s published research on Fronsciers
              </p>
            </div>

            {/* Stats badges */}
            <div className="flex gap-3">
              <div className="bg-[#E5E0FE] rounded-lg px-4 py-2 text-center">
                <p className="text-2xl font-bold text-[#2C337A]">
                  {papers.length}
                </p>
                <p className="text-xs text-[#2C337A]/70">Papers</p>
              </div>
              <div className="bg-[#FFC6DE] rounded-lg px-4 py-2 text-center">
                <p className="text-2xl font-bold text-[#2C337A]">
                  {totalCitations.toLocaleString()}
                </p>
                <p className="text-xs text-[#2C337A]/70">Citations</p>
              </div>
            </div>
          </div>

          {/* Search and filter bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, DOCI, or field..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-[#F8F8FD] text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20 focus:border-[#2C337A]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "date" | "citations")
                }
                className="px-3 py-2.5 rounded-lg border border-gray-200 bg-[#F8F8FD] text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20"
              >
                <option value="date">Sort by Date</option>
                <option value="citations">Sort by Citations</option>
              </select>
            </div>
          </div>
        </div>

        {/* Papers list */}
        <div className="space-y-4">
          {filteredPapers.map((paper, index) => (
            <div
              key={paper.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#E5E0FE] transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Field badge */}
                  {paper.field && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E5E0FE] text-[#2C337A] mb-2">
                      {paper.field}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#2C337A] transition-colors leading-snug">
                    {paper.title}
                  </h3>

                  {/* DOCI */}
                  <p className="text-sm text-[#FB7720] font-mono mt-1">
                    DOCI: {paper.doci}
                  </p>

                  {/* Abstract */}
                  {paper.abstract && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                      {paper.abstract}
                    </p>
                  )}

                  {/* Keywords */}
                  {paper.keywords && paper.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {paper.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(paper.publication_date).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Quote className="w-3.5 h-3.5" />
                      {paper.citation_count.toLocaleString()} citations
                    </span>
                  </div>
                </div>

                {/* Citation count badge */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2C337A] to-[#4A55A2] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {paper.citation_count > 999
                        ? `${(paper.citation_count / 1000).toFixed(1)}k`
                        : paper.citation_count}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                    cited
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredPapers.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg">No papers found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your search query
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
