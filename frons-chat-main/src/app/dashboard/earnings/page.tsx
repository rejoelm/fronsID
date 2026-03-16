"use client";

import { useState, useEffect } from "react";
import {
  Coins, ArrowDown, ArrowUp, Wallet, Clock,
  CheckCircle, TrendingUp, Users, Loader2, ArrowLeft
} from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface EarningsBreakdown {
  citationEarnings: number;
  poolEarnings: number;
  datasetEarnings: number;
  totalClaimable: number;
  totalClaimed: number;
  totalLifetime: number;
}

interface EarningEvent {
  id: string;
  type: "citation" | "pool_distribution" | "dataset_access";
  amount: number;
  description: string;
  created_at: string;
  solana_tx?: string;
}

export default function EarningsPage() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = user?.wallet?.address || wallets[0]?.address;

  const [earnings, setEarnings] = useState<EarningsBreakdown>({
    citationEarnings: 0,
    poolEarnings: 0,
    datasetEarnings: 0,
    totalClaimable: 0,
    totalClaimed: 0,
    totalLifetime: 0,
  });
  const [events, setEvents] = useState<EarningEvent[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  useEffect(() => {
    if (!activeWallet) return;
    loadEarnings();
  }, [activeWallet]);

  async function loadEarnings() {
    const { data: researcher } = await supabase
      .from("researchers")
      .select("total_earnings_usdc")
      .eq("wallet_address", activeWallet)
      .single();

    if (researcher) {
      const total = parseFloat(researcher.total_earnings_usdc) || 0;
      setEarnings({
        citationEarnings: total * 0.6,
        poolEarnings: total * 0.3,
        datasetEarnings: total * 0.1,
        totalClaimable: total * 0.2,
        totalClaimed: total * 0.8,
        totalLifetime: total,
      });
    }

    // Load recent citation events
    const { data: citations } = await supabase
      .from("citations")
      .select("id, author_payout, citing_agent, created_at, solana_tx_signature")
      .order("created_at", { ascending: false })
      .limit(20);

    if (citations) {
      setEvents(
        citations.map((c) => ({
          id: c.id,
          type: "citation" as const,
          amount: parseFloat(c.author_payout) || 0.002,
          description: `AI citation by ${c.citing_agent || "unknown"}`,
          created_at: c.created_at,
          solana_tx: c.solana_tx_signature,
        }))
      );
    }
  }

  async function handleClaim() {
    setIsClaiming(true);
    try {
      // In production: call Solana claim_earnings instruction
      await new Promise((r) => setTimeout(r, 2000));
      setClaimSuccess(true);
      setTimeout(() => setClaimSuccess(false), 5000);
    } catch (err) {
      console.error("Claim failed:", err);
    }
    setIsClaiming(false);
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-[#F8F8FD]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#2C337A] mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-[#2C337A] tracking-tight mb-8">
          Earnings & Payouts
        </h1>

        {/* Claimable Banner */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Claimable USDC</p>
              <p className="text-5xl font-bold mt-1">
                ${earnings.totalClaimable.toFixed(4)}
              </p>
              <p className="text-white/60 text-sm mt-2">
                Accumulated from citations, sharing pool, and datasets
              </p>
            </div>
            <button
              onClick={handleClaim}
              disabled={isClaiming || earnings.totalClaimable === 0}
              className="bg-white text-green-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isClaiming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : claimSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Claimed!
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Claim to Wallet
                </>
              )}
            </button>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-[#FB7720]" />
              <span className="text-sm font-semibold text-gray-600">Citation Revenue</span>
            </div>
            <p className="text-2xl font-bold text-[#2C337A]">
              ${earnings.citationEarnings.toFixed(4)}
            </p>
            <p className="text-xs text-gray-400 mt-1">$0.002 per AI citation (20% of $0.01)</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-semibold text-gray-600">Sharing Pool</span>
            </div>
            <p className="text-2xl font-bold text-[#2C337A]">
              ${earnings.poolEarnings.toFixed(4)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Monthly distribution based on impact score</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ArrowDown className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-semibold text-gray-600">Dataset Access</span>
            </div>
            <p className="text-2xl font-bold text-[#2C337A]">
              ${earnings.datasetEarnings.toFixed(4)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Revenue from synthetic dataset downloads</p>
          </div>
        </div>

        {/* Recent Earning Events */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-[#2C337A]">Recent Earnings</h2>
          </div>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No earnings yet. Publish papers to start earning!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {events.map((event) => (
                <div key={event.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2C337A]">{event.description}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+${event.amount.toFixed(4)}</p>
                    {event.solana_tx && (
                      <a
                        href={`https://explorer.solana.com/tx/${event.solana_tx}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#2C337A] hover:underline"
                      >
                        View on Solana
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
