"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  TrophyIcon,
  MedalIcon,
  AwardIcon,
  BookOpenIcon,
  StarIcon,
  TrendingUpIcon,
  BarChart3Icon,
} from "lucide-react";
import { Header } from "@/components/header";

// Placeholder leaderboard data — will be replaced by Supabase when credentials are added
const MOCK_LEADERBOARD = [
  {
    rank: 1,
    name: "Dr. Sarah Chen",
    institution: "MIT",
    specialization: "Neuroscience",
    citations: 1247,
    papers: 28,
    impactScore: 94.5,
    earnings: 12.47,
  },
  {
    rank: 2,
    name: "Prof. James Okafor",
    institution: "University of Lagos",
    specialization: "Public Health",
    citations: 983,
    papers: 22,
    impactScore: 87.2,
    earnings: 9.83,
  },
  {
    rank: 3,
    name: "Dr. Yuki Tanaka",
    institution: "University of Tokyo",
    specialization: "Genetics",
    citations: 856,
    papers: 19,
    impactScore: 82.1,
    earnings: 8.56,
  },
  {
    rank: 4,
    name: "Dr. Maria Santos",
    institution: "USP",
    specialization: "Chemistry",
    citations: 702,
    papers: 15,
    impactScore: 76.8,
    earnings: 7.02,
  },
  {
    rank: 5,
    name: "Prof. Alex Mueller",
    institution: "ETH Zurich",
    specialization: "Computer Science",
    citations: 651,
    papers: 14,
    impactScore: 71.3,
    earnings: 6.51,
  },
  {
    rank: 6,
    name: "Dr. Priya Sharma",
    institution: "IIT Delhi",
    specialization: "Mathematics",
    citations: 534,
    papers: 12,
    impactScore: 65.9,
    earnings: 5.34,
  },
  {
    rank: 7,
    name: "Dr. Li Wei",
    institution: "Tsinghua University",
    specialization: "Physics",
    citations: 489,
    papers: 11,
    impactScore: 61.2,
    earnings: 4.89,
  },
  {
    rank: 8,
    name: "Prof. Anna Kowalski",
    institution: "Warsaw University",
    specialization: "Biology",
    citations: 412,
    papers: 9,
    impactScore: 55.7,
    earnings: 4.12,
  },
  {
    rank: 9,
    name: "Dr. Omar Hassan",
    institution: "Cairo University",
    specialization: "Pharmacology",
    citations: 378,
    papers: 8,
    impactScore: 51.4,
    earnings: 3.78,
  },
  {
    rank: 10,
    name: "Dr. Emily Johnson",
    institution: "Stanford",
    specialization: "Neuroscience",
    citations: 345,
    papers: 7,
    impactScore: 48.2,
    earnings: 3.45,
  },
];

function getRankIcon(rank: number) {
  if (rank === 1)
    return <TrophyIcon className="w-5 h-5 text-yellow-500" />;
  if (rank === 2)
    return <MedalIcon className="w-5 h-5 text-gray-400" />;
  if (rank === 3)
    return <AwardIcon className="w-5 h-5 text-orange-accent" />;
  return (
    <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-navy/30">
      {rank}
    </span>
  );
}

function getRankBg(rank: number) {
  if (rank === 1) return "bg-yellow-50 border-yellow-200";
  if (rank === 2) return "bg-gray-50 border-gray-200";
  if (rank === 3) return "bg-orange-50 border-orange-200";
  return "bg-white border-navy/5";
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("2026-03");

  return (
    <div className="min-h-screen bg-off-white">
      <Header />
      <main className="pt-24 pb-16">
        {/* Header */}
        <div className="bg-gradient-to-b from-navy to-navy-600 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 mb-6">
              <TrendingUpIcon className="w-3.5 h-3.5 text-orange-accent" />
              <span className="text-xs font-medium text-white/80">
                Monthly Impact Rankings
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Researcher Leaderboard
            </h1>
            <p className="mt-2 text-sm text-white/50 max-w-lg mx-auto">
              Top researchers ranked by citations, impact score, and community
              contributions. Updated monthly.
            </p>

            {/* Period selector */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {["2026-01", "2026-02", "2026-03"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    period === p
                      ? "bg-orange-accent text-white"
                      : "bg-white/10 text-white/50 hover:bg-white/15"
                  }`}
                >
                  {new Date(p + "-01").toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: BookOpenIcon,
                label: "Total Citations",
                value: "6,597",
              },
              {
                icon: StarIcon,
                label: "Active Researchers",
                value: "10",
              },
              {
                icon: BarChart3Icon,
                label: "Total Earnings",
                value: "$65.97",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-navy/5 p-4 text-center shadow-sm"
              >
                <Icon className="w-4 h-4 text-orange-accent mx-auto mb-1.5" />
                <div className="text-lg font-bold text-navy">{value}</div>
                <div className="text-xs text-navy/40">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
          <div className="space-y-3">
            {MOCK_LEADERBOARD.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${getRankBg(
                  entry.rank
                )}`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-navy truncate">
                      {entry.name}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-lavender text-navy border-0 flex-shrink-0"
                    >
                      {entry.specialization}
                    </Badge>
                  </div>
                  <p className="text-xs text-navy/40 mt-0.5">
                    {entry.institution}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-navy/40">Citations</div>
                    <div className="text-sm font-bold text-navy">
                      {entry.citations.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-navy/40">Papers</div>
                    <div className="text-sm font-bold text-navy">
                      {entry.papers}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-navy/40">Impact</div>
                    <div className="text-sm font-bold text-orange-accent">
                      {entry.impactScore}
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-xs text-navy/40">Earned</div>
                    <div className="text-sm font-bold text-success">
                      ${entry.earnings.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-navy/30 mt-8">
            Rankings are based on the Peer Citation Score (PCS) algorithm. Data
            shown is placeholder — live data will be available when Supabase is
            connected.
          </p>
        </div>
      </main>
    </div>
  );
}
