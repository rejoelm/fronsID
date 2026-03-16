"use client";

import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Medal, Coins, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LeaderboardEntry {
  id: string;
  researcher_id: string;
  impact_score: number;
  citation_count: number;
  pcs_score: number;
  sss_score: number;
  tis_score: number;
  pool_payout_usdc: number;
  rank: number;
  researcher?: { name: string; institution: string; wallet_address: string };
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  async function loadLeaderboard() {
    setIsLoading(true);
    const { data } = await supabase
      .from("leaderboard")
      .select("*, researcher:researchers(name, institution, wallet_address)")
      .eq("period", period)
      .order("rank", { ascending: true })
      .limit(50);
    if (data) setEntries(data);
    setIsLoading(false);
  }

  function changePeriod(delta: number) {
    const [year, month] = period.split("-").map(Number);
    const date = new Date(year, month - 1 + delta);
    setPeriod(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }

  const RANK_STYLES: Record<number, string> = {
    1: "bg-yellow-50 border-yellow-300",
    2: "bg-gray-50 border-gray-300",
    3: "bg-orange-50 border-orange-300",
  };

  return (
    <div className="min-h-screen bg-[#F8F8FD]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2C337A] tracking-tight">
              Impact Leaderboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Monthly rankings based on citations, peer review scores, and research impact
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-2 py-1">
            <button onClick={() => changePeriod(-1)} className="p-1.5 hover:bg-gray-50 rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-[#2C337A] min-w-[80px] text-center">
              {period}
            </span>
            <button onClick={() => changePeriod(1)} className="p-1.5 hover:bg-gray-50 rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top 3 Cards */}
        {entries.length >= 3 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {entries.slice(0, 3).map((entry, i) => (
              <div
                key={entry.id}
                className={`rounded-xl border-2 p-6 ${RANK_STYLES[i + 1] || "bg-white border-gray-100"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {i === 0 ? (
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    ) : i === 1 ? (
                      <Medal className="w-6 h-6 text-gray-400" />
                    ) : (
                      <Medal className="w-6 h-6 text-orange-400" />
                    )}
                    <span className="text-2xl font-bold text-[#2C337A]">#{entry.rank}</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    ${entry.pool_payout_usdc.toFixed(2)}
                  </span>
                </div>
                <p className="font-bold text-[#2C337A]">{entry.researcher?.name || "Anonymous"}</p>
                <p className="text-xs text-gray-500">{entry.researcher?.institution || ""}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Citations</span>
                    <p className="font-semibold text-[#2C337A]">{entry.citation_count}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Impact</span>
                    <p className="font-semibold text-[#2C337A]">{entry.impact_score.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Rank</th>
                <th className="px-6 py-3 text-left">Researcher</th>
                <th className="px-6 py-3 text-right">Citations</th>
                <th className="px-6 py-3 text-right">Impact Score</th>
                <th className="px-6 py-3 text-right">PCS</th>
                <th className="px-6 py-3 text-right">SSS</th>
                <th className="px-6 py-3 text-right">TIS</th>
                <th className="px-6 py-3 text-right">Pool Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-[#2C337A]">#{entry.rank}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-sm text-[#2C337A]">
                      {entry.researcher?.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {entry.researcher?.institution || ""}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">{entry.citation_count}</td>
                  <td className="px-6 py-4 text-right">{entry.impact_score.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">{entry.pcs_score.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">{entry.sss_score.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">{entry.tis_score.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-green-600">
                    ${entry.pool_payout_usdc.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No leaderboard data for {period}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
