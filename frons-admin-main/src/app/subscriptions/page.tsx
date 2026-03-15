"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  CreditCard,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Search,
  MoreHorizontal,
  Crown,
  Building2,
  GraduationCap,
  User,
} from "lucide-react";

interface SubscriptionTier {
  name: string;
  count: number;
  mrr: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  priceLabel: string;
}

interface Subscriber {
  id: string;
  display_name: string;
  wallet_address: string;
  tier: string;
  status: "active" | "canceled" | "past_due";
  started_at: string;
  next_billing: string;
  amount: number;
}

const MOCK_TIERS: SubscriptionTier[] = [
  { name: "Free", count: 1240, mrr: 0, icon: User, color: "text-gray-600", bgColor: "bg-gray-100", priceLabel: "$0/mo" },
  { name: "Scholar", count: 380, mrr: 7600, icon: GraduationCap, color: "text-[#2C337A]", bgColor: "bg-[#E5E0FE]", priceLabel: "$20/mo" },
  { name: "Institution", count: 85, mrr: 8500, icon: Building2, color: "text-blue-700", bgColor: "bg-blue-100", priceLabel: "$100/mo" },
  { name: "Enterprise", count: 12, mrr: 5880, icon: Crown, color: "text-[#FB7720]", bgColor: "bg-orange-100", priceLabel: "$490/mo" },
];

const MOCK_SUBSCRIBERS: Subscriber[] = [
  { id: "1", display_name: "Prof. Ava Chen", wallet_address: "3mBk...NvU2", tier: "institution", status: "active", started_at: "2025-01-10", next_billing: "2026-04-10", amount: 100 },
  { id: "2", display_name: "Dr. Rejo Elm", wallet_address: "7xKp...vN3d", tier: "scholar", status: "active", started_at: "2025-03-15", next_billing: "2026-04-15", amount: 20 },
  { id: "3", display_name: "Dr. Lina Patel", wallet_address: "5tGd...KxY6", tier: "enterprise", status: "active", started_at: "2025-04-05", next_billing: "2026-04-05", amount: 490 },
  { id: "4", display_name: "Dr. Marcus Webb", wallet_address: "9pLc...RwE7", tier: "scholar", status: "past_due", started_at: "2025-06-20", next_billing: "2026-03-20", amount: 20 },
  { id: "5", display_name: "Dr. Sarah Kim", wallet_address: "4hRt...LmP8", tier: "scholar", status: "canceled", started_at: "2025-08-01", next_billing: "-", amount: 0 },
  { id: "6", display_name: "KAIST Research Lab", wallet_address: "8wQn...YjF5", tier: "institution", status: "active", started_at: "2025-09-12", next_billing: "2026-04-12", amount: 100 },
];

function StatusBadge({ status }: { status: Subscriber["status"] }) {
  const config = {
    active: { icon: CheckCircle2, color: "bg-green-100 text-green-700", label: "Active" },
    canceled: { icon: XCircle, color: "bg-gray-100 text-gray-600", label: "Canceled" },
    past_due: { icon: AlertTriangle, color: "bg-red-100 text-red-700", label: "Past Due" },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.color}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setTiers(MOCK_TIERS);
      setSubscribers(MOCK_SUBSCRIBERS);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const totalMRR = tiers.reduce((s, t) => s + t.mrr, 0);
  const totalPaid = tiers.reduce((s, t) => s + t.count, 0) - (tiers[0]?.count || 0);

  const statusCounts = {
    all: subscribers.length,
    active: subscribers.filter((s) => s.status === "active").length,
    canceled: subscribers.filter((s) => s.status === "canceled").length,
    past_due: subscribers.filter((s) => s.status === "past_due").length,
  };

  const filteredSubscribers = subscribers.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      s.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.wallet_address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2C337A] flex items-center gap-3">
          <CreditCard className="w-8 h-8" />
          Subscription Management
        </h1>
        <p className="text-gray-500 mt-1">
          Manage subscription tiers and subscriber status
        </p>
      </div>

      {/* Tier overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <div
              key={tier.name}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${tier.bgColor}`}>
                  <Icon className={`w-5 h-5 ${tier.color}`} />
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {tier.priceLabel}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">
                {tier.name}
              </h3>
              <p className="text-2xl font-bold text-[#2C337A] mt-1">
                {tier.count.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                MRR: ${tier.mrr.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total MRR</p>
          <p className="text-2xl font-bold text-[#2C337A] mt-1">
            ${totalMRR.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Paid Subscribers</p>
          <p className="text-2xl font-bold text-[#2C337A] mt-1">
            {totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="text-2xl font-bold text-[#FB7720] mt-1">
            {tiers.reduce((s, t) => s + t.count, 0) > 0
              ? ((totalPaid / tiers.reduce((s, t) => s + t.count, 0)) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "active", "canceled", "past_due"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === s
                ? "bg-[#2C337A] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s === "all" ? "All" : s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            <span className="ml-1 text-xs opacity-70">
              ({statusCounts[s]})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search subscribers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-[#F8F8FD] focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20"
          />
        </div>
      </div>

      {/* Subscribers table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F8FD] border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Subscriber</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Tier</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Next Billing</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscribers.map((sub) => (
                <tr key={sub.id} className="border-b border-gray-50 hover:bg-[#F8F8FD]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{sub.display_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{sub.wallet_address}</p>
                  </td>
                  <td className="px-4 py-3 text-center capitalize text-gray-700">{sub.tier}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-[#2C337A]">
                    {sub.amount > 0 ? `$${sub.amount}/mo` : "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{sub.next_billing}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
