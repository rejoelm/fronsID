"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Settings,
  Shield,
  Coins,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Save,
  Pause,
  Play,
  ExternalLink,
  Copy,
  Wallet,
  Percent,
  FileText,
  Quote,
  Lock,
} from "lucide-react";

interface ProtocolParam {
  key: string;
  label: string;
  value: string;
  unit: string;
  description: string;
  editable: boolean;
}

const MOCK_PARAMS: ProtocolParam[] = [
  { key: "fee_bps", label: "Platform Fee", value: "250", unit: "bps (2.5%)", description: "Basis points charged on all citation revenue distributions", editable: true },
  { key: "citation_fee", label: "Citation Fee", value: "0.05", unit: "USDC", description: "Fee charged per citation when an AI agent retrieves a paper", editable: true },
  { key: "submission_fee", label: "Submission Fee", value: "50", unit: "USDC", description: "Base fee for manuscript submission to the protocol", editable: true },
  { key: "review_reward", label: "Review Reward", value: "25", unit: "USDC", description: "Compensation paid to peer reviewers per completed review", editable: true },
  { key: "min_reviewers", label: "Min. Reviewers", value: "3", unit: "reviewers", description: "Minimum number of peer reviewers required before publication", editable: true },
  { key: "pool_period", label: "Pool Distribution Period", value: "30", unit: "days", description: "Time interval for leaderboard reward pool distributions", editable: true },
];

export default function ProtocolPage() {
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<ProtocolParam[]>([]);
  const [protocolPaused, setProtocolPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  // Mock treasury data
  const treasury = {
    address: "FroNTrea5uRy1dR8ejQmVcX2CpPkAh9qWnZ6bR1v",
    balance_sol: 245.8,
    balance_usdc: 128450.0,
    pending_distributions: 12300.0,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(MOCK_PARAMS);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleParamChange = (key: string, newValue: string) => {
    setParams((prev) =>
      prev.map((p) => (p.key === key ? { ...p, value: newValue } : p))
    );
    setEdited((prev) => new Set(prev).add(key));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 800));
    setEdited(new Set());
    setSaving(false);
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#2C337A]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#2C337A] flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Protocol Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage Solana program parameters and treasury
          </p>
        </div>

        {/* Protocol status toggle */}
        <div className="flex items-center gap-3">
          {protocolPaused ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                Protocol Paused
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Protocol Active
              </span>
            </div>
          )}
          <button
            onClick={() => setProtocolPaused(!protocolPaused)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              protocolPaused
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {protocolPaused ? (
              <>
                <Play className="w-4 h-4" />
                Unpause
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Pause Protocol
              </>
            )}
          </button>
        </div>
      </div>

      {/* Treasury section */}
      <div className="bg-gradient-to-r from-[#2C337A] via-[#4A55A2] to-[#7895CB] rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat" />
        <div className="relative z-10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Treasury
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-white/60">SOL Balance</p>
              <p className="text-2xl font-bold mt-1">
                {treasury.balance_sol.toLocaleString()}
              </p>
              <p className="text-xs text-white/40">SOL</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-white/60">USDC Balance</p>
              <p className="text-2xl font-bold mt-1">
                ${treasury.balance_usdc.toLocaleString()}
              </p>
              <p className="text-xs text-white/40">USDC</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-white/60">Pending Distributions</p>
              <p className="text-2xl font-bold mt-1">
                ${treasury.pending_distributions.toLocaleString()}
              </p>
              <p className="text-xs text-white/40">To researchers</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-white/60">Treasury Address</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm font-mono truncate">
                  {treasury.address.slice(0, 12)}...{treasury.address.slice(-6)}
                </p>
                <button
                  onClick={() => copyAddress(treasury.address)}
                  className="p-1 rounded hover:bg-white/10"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copied === treasury.address && (
                  <span className="text-xs text-green-300">Copied!</span>
                )}
              </div>
              <a
                href={`https://explorer.solana.com/address/${treasury.address}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/80 mt-1"
              >
                View on Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol parameters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#2C337A] flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Protocol Parameters
          </h3>
          <button
            onClick={handleSave}
            disabled={edited.size === 0 || saving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              edited.size > 0
                ? "bg-[#2C337A] text-white hover:bg-[#2C337A]/90"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : `Save Changes${edited.size > 0 ? ` (${edited.size})` : ""}`}
          </button>
        </div>

        <div className="space-y-4">
          {params.map((param) => {
            const isEdited = edited.has(param.key);
            return (
              <div
                key={param.key}
                className={`p-4 rounded-xl border transition-colors ${
                  isEdited
                    ? "border-[#FB7720] bg-orange-50/50"
                    : "border-gray-100 bg-[#F8F8FD]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-800">
                        {param.label}
                      </h4>
                      {isEdited && (
                        <span className="text-[10px] text-[#FB7720] bg-orange-100 px-1.5 py-0.5 rounded font-medium">
                          Modified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {param.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) =>
                        handleParamChange(param.key, e.target.value)
                      }
                      disabled={!param.editable}
                      className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm text-right font-mono font-semibold text-[#2C337A] focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                    <span className="text-xs text-gray-400 min-w-[60px]">
                      {param.unit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                On-Chain Transaction Required
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">
                Saving parameter changes will submit a Solana transaction signed
                by the protocol authority. Changes take effect after transaction
                confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
