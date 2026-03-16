"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  Search,
  Filter,
  Upload,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  MoreHorizontal,
  ExternalLink,
  Plus,
} from "lucide-react";

interface Article {
  id: string;
  doci: string;
  title: string;
  field: string;
  status: "submitted" | "under_review" | "published" | "rejected";
  citation_count: number;
  created_at: string;
  published_at: string | null;
  primary_author: string;
}

const MOCK_ARTICLES: Article[] = [
  {
    id: "1",
    doci: "10.fronsciers/2026.0042",
    title: "Self-Attention Mechanisms in Protein Folding Prediction Models",
    field: "Computational Biology",
    status: "published",
    citation_count: 342,
    created_at: "2025-12-01T10:00:00Z",
    published_at: "2026-01-15T10:00:00Z",
    primary_author: "Dr. Rejo Elm",
  },
  {
    id: "2",
    doci: "10.fronsciers/2026.0098",
    title: "Federated Learning for Decentralized Health Records",
    field: "Health Informatics",
    status: "under_review",
    citation_count: 0,
    created_at: "2026-02-10T14:00:00Z",
    published_at: null,
    primary_author: "Prof. Ava Chen",
  },
  {
    id: "3",
    doci: "10.fronsciers/2026.0112",
    title: "Zero-Knowledge Proofs for Academic Credential Verification",
    field: "Cryptography",
    status: "submitted",
    citation_count: 0,
    created_at: "2026-03-01T09:00:00Z",
    published_at: null,
    primary_author: "Dr. Lina Patel",
  },
  {
    id: "4",
    doci: "10.fronsciers/2025.1088",
    title: "Synthetic Data Generation for Privacy-Preserving Clinical Trials",
    field: "Health Informatics",
    status: "published",
    citation_count: 89,
    created_at: "2025-06-15T14:30:00Z",
    published_at: "2025-08-22T14:30:00Z",
    primary_author: "Dr. Rejo Elm",
  },
  {
    id: "5",
    doci: "10.fronsciers/2026.0145",
    title: "Quantum Error Correction with Topological Codes",
    field: "Quantum Computing",
    status: "rejected",
    citation_count: 0,
    created_at: "2026-01-20T11:00:00Z",
    published_at: null,
    primary_author: "Dr. Marcus Webb",
  },
];

const STATUS_FILTERS = ["all", "submitted", "under_review", "published", "rejected"];

function StatusBadge({ status }: { status: Article["status"] }) {
  const config = {
    published: {
      icon: CheckCircle2,
      color: "bg-green-100 text-green-700",
      label: "Published",
    },
    under_review: {
      icon: Clock,
      color: "bg-yellow-100 text-yellow-700",
      label: "Under Review",
    },
    submitted: {
      icon: AlertTriangle,
      color: "bg-blue-100 text-blue-700",
      label: "Submitted",
    },
    rejected: {
      icon: XCircle,
      color: "bg-red-100 text-red-700",
      label: "Rejected",
    },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.color}`}
    >
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showSeedModal, setShowSeedModal] = useState(false);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const { data } = await supabase
          .from("articles")
          .select("*")
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          setArticles(data);
        } else {
          setArticles(MOCK_ARTICLES);
        }
      } catch {
        setArticles(MOCK_ARTICLES);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    let result = [...articles];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.doci.toLowerCase().includes(q) ||
          a.primary_author?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }
    return result;
  }, [articles, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: articles.length,
      submitted: 0,
      under_review: 0,
      published: 0,
      rejected: 0,
    };
    articles.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
  }, [articles]);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#2C337A] flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Article Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage submissions, reviews, and published articles
          </p>
        </div>
        <button
          onClick={() => setShowSeedModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FB7720] text-white text-sm font-medium hover:bg-[#FB7720]/90 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Seed Evidence
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === s
                ? "bg-[#2C337A] text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s === "all"
              ? "All"
              : s
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
            <span className="ml-1.5 text-xs opacity-70">
              ({statusCounts[s] || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, DOCI, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20 focus:border-[#2C337A] bg-[#F8F8FD]"
          />
        </div>
      </div>

      {/* Articles list */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading articles...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No articles found
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-[#E5E0FE] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={article.status} />
                    <span className="text-xs text-gray-400">
                      {article.field}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 leading-snug">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="font-mono text-[#FB7720] text-xs">
                      {article.doci}
                    </span>
                    <span>by {article.primary_author}</span>
                    <span>
                      Submitted{" "}
                      {new Date(article.created_at).toLocaleDateString()}
                    </span>
                    {article.status === "published" && (
                      <span className="text-green-600">
                        {article.citation_count} citations
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="More actions"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Seed Evidence Modal */}
      {showSeedModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#2C337A] mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Seed Evidence (Direct Upload)
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Upload a PDF directly to the evidence database, bypassing the peer
              review pipeline. This is intended for high-quality curated
              evidence.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20"
                  placeholder="e.g. 2024 Stanford ML Survey"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category / Field
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20"
                  placeholder="e.g. Machine Learning"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF File
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSeedModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2.5 rounded-lg bg-[#FB7720] text-white text-sm font-medium hover:bg-[#FB7720]/90 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Upload & Seed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
