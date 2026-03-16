"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, Coins, TrendingUp, Award, FileText,
  Download, Users, BarChart3, ArrowUpRight, ExternalLink
} from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface DashboardStats {
  totalPublications: number;
  totalCitations: number;
  totalEarnings: number;
  claimableEarnings: number;
  hIndex: number;
  impactScore: number;
  leaderboardRank: number;
  datasetsPublished: number;
}

interface Publication {
  id: string;
  title: string;
  doci: string;
  status: string;
  citation_count: number;
  impact_score: number;
  submission_date: string;
}

export default function AuthorDashboard() {
  const { authenticated, user, login } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = user?.wallet?.address || wallets[0]?.address;

  const [stats, setStats] = useState<DashboardStats>({
    totalPublications: 0,
    totalCitations: 0,
    totalEarnings: 0,
    claimableEarnings: 0,
    hIndex: 0,
    impactScore: 0,
    leaderboardRank: 0,
    datasetsPublished: 0,
  });
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeWallet) return;
    loadDashboard();
  }, [activeWallet]);

  async function loadDashboard() {
    setIsLoading(true);
    try {
      // Load researcher profile
      const { data: researcher } = await supabase
        .from("researchers")
        .select("*")
        .eq("wallet_address", activeWallet)
        .single();

      if (researcher) {
        setStats({
          totalPublications: researcher.total_publications || 0,
          totalCitations: researcher.total_citations || 0,
          totalEarnings: parseFloat(researcher.total_earnings_usdc) || 0,
          claimableEarnings: 0,
          hIndex: parseFloat(researcher.h_index) || 0,
          impactScore: 0,
          leaderboardRank: researcher.leaderboard_rank || 0,
          datasetsPublished: 0,
        });
      }

      // Load publications
      const { data: pubs } = await supabase
        .from("articles")
        .select("id, title, doci, status, citation_count, impact_score, submission_date")
        .contains("authors", [{ wallet: activeWallet }])
        .order("submission_date", { ascending: false })
        .limit(10);

      if (pubs) setPublications(pubs);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    }
    setIsLoading(false);
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-[#2C337A] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#2C337A] mb-2">Author Dashboard</h1>
          <p className="text-gray-500 mb-6">Connect to view your publications and earnings</p>
          <button onClick={login} className="bg-[#2C337A] text-white px-8 py-3 rounded-xl font-semibold">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const STAT_CARDS = [
    { label: "Publications", value: stats.totalPublications, icon: BookOpen, color: "text-[#2C337A]" },
    { label: "Total Citations", value: stats.totalCitations, icon: TrendingUp, color: "text-[#FB7720]" },
    { label: "Total Earnings", value: `$${stats.totalEarnings.toFixed(2)}`, icon: Coins, color: "text-green-600" },
    { label: "h-Index", value: stats.hIndex.toFixed(1), icon: Award, color: "text-purple-600" },
    { label: "Leaderboard Rank", value: stats.leaderboardRank > 0 ? `#${stats.leaderboardRank}` : "—", icon: BarChart3, color: "text-blue-600" },
    { label: "Datasets Published", value: stats.datasetsPublished, icon: Download, color: "text-teal-600" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    in_review: "bg-blue-50 text-blue-700",
    accepted: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    published: "bg-[#E5E0FE] text-[#2C337A]",
  };

  return (
    <div className="min-h-screen bg-[#F8F8FD]">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2C337A] tracking-tight">
              Author Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Track your publications, citations, and earnings
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/earnings"
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition"
            >
              <Coins className="w-4 h-4" />
              Claim Earnings
            </Link>
            <Link
              href="/submit"
              className="flex items-center gap-2 bg-[#FB7720] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#e56a1a] transition"
            >
              <FileText className="w-4 h-4" />
              Submit Paper
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {STAT_CARDS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
                <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold text-[#2C337A]">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Earnings Banner */}
        {stats.claimableEarnings > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white mb-8 flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Claimable Earnings</p>
              <p className="text-3xl font-bold">${stats.claimableEarnings.toFixed(2)} USDC</p>
              <p className="text-white/60 text-xs mt-1">From citations, sharing pool, and datasets</p>
            </div>
            <Link
              href="/dashboard/earnings"
              className="bg-white text-green-700 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition"
            >
              Claim Now
            </Link>
          </div>
        )}

        {/* Publications Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-[#2C337A]">Your Publications</h2>
            <Link href="/submit" className="text-sm text-[#FB7720] font-semibold flex items-center gap-1">
              Submit New <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {publications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No publications yet</p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 bg-[#FB7720] text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
              >
                Submit Your First Paper
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">DOCI</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Citations</th>
                  <th className="px-6 py-3 text-right">Impact</th>
                  <th className="px-6 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {publications.map((pub) => (
                  <tr key={pub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#2C337A] text-sm line-clamp-1">
                        {pub.title}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        {pub.doci || "—"}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[pub.status] || "bg-gray-50 text-gray-600"}`}>
                        {pub.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-sm">
                      {pub.citation_count}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {parseFloat(String(pub.impact_score)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(pub.submission_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
