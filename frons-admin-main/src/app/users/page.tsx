"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Wallet,
  Award,
  FileText,
  CreditCard,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";

interface Researcher {
  id: string;
  wallet_address: string;
  display_name: string;
  institution: string;
  specialization: string;
  papers_published: number;
  total_citations: number;
  impact_score: number;
  total_earnings: number;
  credit_balance?: number;
  subscription_tier?: string;
  created_at: string;
}

const SUBSCRIPTION_TIERS = ["All", "free", "scholar", "institution", "enterprise"];

const MOCK_RESEARCHERS: Researcher[] = [
  {
    id: "1",
    wallet_address: "7xKpR9vN3dJmLwQ4...",
    display_name: "Dr. Rejo Elm",
    institution: "Stanford University",
    specialization: "Bioinformatics",
    papers_published: 28,
    total_citations: 1091,
    impact_score: 42,
    total_earnings: 12450.5,
    credit_balance: 340,
    subscription_tier: "scholar",
    created_at: "2025-03-15T10:00:00Z",
  },
  {
    id: "2",
    wallet_address: "3mBkT8wX5yQrNvU2...",
    display_name: "Prof. Ava Chen",
    institution: "MIT",
    specialization: "Machine Learning",
    papers_published: 45,
    total_citations: 2340,
    impact_score: 56,
    total_earnings: 28700.0,
    credit_balance: 800,
    subscription_tier: "institution",
    created_at: "2025-01-10T08:00:00Z",
  },
  {
    id: "3",
    wallet_address: "9pLcF4hZ1kSnRwE7...",
    display_name: "Dr. Marcus Webb",
    institution: "Oxford University",
    specialization: "Quantum Computing",
    papers_published: 12,
    total_citations: 456,
    impact_score: 24,
    total_earnings: 3200.0,
    credit_balance: 120,
    subscription_tier: "scholar",
    created_at: "2025-06-20T14:00:00Z",
  },
  {
    id: "4",
    wallet_address: "5tGdN2jP8cVmKxY6...",
    display_name: "Dr. Lina Patel",
    institution: "ETH Zurich",
    specialization: "Cryptography",
    papers_published: 19,
    total_citations: 780,
    impact_score: 31,
    total_earnings: 8900.0,
    credit_balance: 250,
    subscription_tier: "enterprise",
    created_at: "2025-04-05T12:00:00Z",
  },
  {
    id: "5",
    wallet_address: "2wRsA6eM3bUqHyT9...",
    display_name: "Dr. Kai Tanaka",
    institution: "University of Tokyo",
    specialization: "Neuroscience",
    papers_published: 8,
    total_citations: 210,
    impact_score: 15,
    total_earnings: 1500.0,
    credit_balance: 50,
    subscription_tier: "free",
    created_at: "2025-09-01T09:00:00Z",
  },
];

function getTierBadgeColor(tier?: string): string {
  switch (tier) {
    case "enterprise":
      return "bg-purple-100 text-purple-700";
    case "institution":
      return "bg-blue-100 text-blue-700";
    case "scholar":
      return "bg-[#E5E0FE] text-[#2C337A]";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function UsersPage() {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [sortField, setSortField] = useState<keyof Researcher>("total_citations");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from("researcher_profiles")
          .select("*")
          .order("total_citations", { ascending: false });

        if (data && data.length > 0) {
          setResearchers(data);
        } else {
          setResearchers(MOCK_RESEARCHERS);
        }
      } catch {
        setResearchers(MOCK_RESEARCHERS);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredResearchers = useMemo(() => {
    let result = [...researchers];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.display_name.toLowerCase().includes(q) ||
          r.wallet_address.toLowerCase().includes(q) ||
          r.institution.toLowerCase().includes(q) ||
          r.specialization.toLowerCase().includes(q)
      );
    }

    if (tierFilter !== "All") {
      result = result.filter((r) => r.subscription_tier === tierFilter);
    }

    result.sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [researchers, searchQuery, tierFilter, sortField, sortDirection]);

  const handleSort = (field: keyof Researcher) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: keyof Researcher }) => {
    if (sortField !== field)
      return <ChevronDown className="w-3 h-3 text-gray-300" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3 text-[#2C337A]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#2C337A]" />
    );
  };

  const totalUsers = researchers.length;
  const totalPapers = researchers.reduce((s, r) => s + r.papers_published, 0);
  const totalCitations = researchers.reduce((s, r) => s + r.total_citations, 0);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2C337A] flex items-center gap-3">
          <Users className="w-8 h-8" />
          User Management
        </h1>
        <p className="text-gray-500 mt-1">
          Manage researcher profiles, roles, and subscriptions
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Researchers</p>
              <p className="text-2xl font-bold text-[#2C337A] mt-1">
                {totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-[#E5E0FE] rounded-xl">
              <Users className="w-5 h-5 text-[#2C337A]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Papers</p>
              <p className="text-2xl font-bold text-[#2C337A] mt-1">
                {totalPapers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-[#FFC6DE] rounded-xl">
              <FileText className="w-5 h-5 text-[#2C337A]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Citations</p>
              <p className="text-2xl font-bold text-[#2C337A] mt-1">
                {totalCitations.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Award className="w-5 h-5 text-[#FB7720]" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, wallet, institution, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20 focus:border-[#2C337A] bg-[#F8F8FD]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20 bg-[#F8F8FD]"
            >
              {SUBSCRIPTION_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All Tiers" : t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 500);
              }}
              className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F8FD] border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Researcher
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-[#2C337A]"
                  onClick={() => handleSort("institution")}
                >
                  <span className="inline-flex items-center gap-1">
                    Institution <SortIcon field="institution" />
                  </span>
                </th>
                <th
                  className="text-center px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-[#2C337A]"
                  onClick={() => handleSort("papers_published")}
                >
                  <span className="inline-flex items-center gap-1">
                    Papers <SortIcon field="papers_published" />
                  </span>
                </th>
                <th
                  className="text-center px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-[#2C337A]"
                  onClick={() => handleSort("total_citations")}
                >
                  <span className="inline-flex items-center gap-1">
                    Citations <SortIcon field="total_citations" />
                  </span>
                </th>
                <th
                  className="text-center px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-[#2C337A]"
                  onClick={() => handleSort("credit_balance")}
                >
                  <span className="inline-flex items-center gap-1">
                    Credits <SortIcon field="credit_balance" />
                  </span>
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">
                  Tier
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading researchers...
                  </td>
                </tr>
              ) : filteredResearchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    No researchers found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredResearchers.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 hover:bg-[#F8F8FD] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {r.display_name}
                        </p>
                        <p className="text-xs text-gray-400 font-mono flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          {r.wallet_address}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.institution}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-800">
                      {r.papers_published}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-800">
                      {r.total_citations.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[#FB7720] font-medium">
                        <CreditCard className="w-3 h-3" />
                        {(r.credit_balance ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getTierBadgeColor(
                          r.subscription_tier
                        )}`}
                      >
                        {r.subscription_tier || "free"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-4 py-3 bg-[#F8F8FD] border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {filteredResearchers.length} of {researchers.length}{" "}
            researchers
          </span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 text-[#2C337A] font-medium">
              1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
