"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  PieChart,
  Wallet,
  Receipt,
  Download,
} from "lucide-react";

interface RevenueSource {
  label: string;
  amount: number;
  percentage: number;
  color: string;
  change: number;
}

interface PaymentProvider {
  name: string;
  amount: number;
  transactions: number;
  percentage: number;
  color: string;
}

interface MonthlyRevenue {
  month: string;
  subscriptions: number;
  credits: number;
  submissions: number;
  citations: number;
  total: number;
}

const MOCK_SOURCES: RevenueSource[] = [
  { label: "Subscriptions", amount: 124500, percentage: 42, color: "#2C337A", change: 12.5 },
  { label: "Credit Purchases", amount: 67800, percentage: 23, color: "#FB7720", change: 8.3 },
  { label: "Submission Fees", amount: 58200, percentage: 20, color: "#FFC6DE", change: -2.1 },
  { label: "Citation Payments", amount: 44500, percentage: 15, color: "#E5E0FE", change: 45.2 },
];

const MOCK_PROVIDERS: PaymentProvider[] = [
  { name: "Stripe (USD)", amount: 178400, transactions: 2340, percentage: 60, color: "#635bff" },
  { name: "Xendit (IDR)", amount: 72600, transactions: 890, percentage: 25, color: "#00a6e0" },
  { name: "USDC (Solana)", amount: 44000, transactions: 420, percentage: 15, color: "#2775ca" },
];

const MOCK_MONTHLY: MonthlyRevenue[] = [
  { month: "Oct 2025", subscriptions: 18000, credits: 9500, submissions: 8200, citations: 4500, total: 40200 },
  { month: "Nov 2025", subscriptions: 19500, credits: 10200, submissions: 9000, citations: 5200, total: 43900 },
  { month: "Dec 2025", subscriptions: 20200, credits: 11000, submissions: 9800, citations: 6100, total: 47100 },
  { month: "Jan 2026", subscriptions: 21800, credits: 12300, submissions: 10500, citations: 7800, total: 52400 },
  { month: "Feb 2026", subscriptions: 22500, credits: 12800, submissions: 10300, citations: 9200, total: 54800 },
  { month: "Mar 2026", subscriptions: 22500, credits: 12000, submissions: 10400, citations: 11700, total: 56600 },
];

export default function RevenuePage() {
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<RevenueSource[]>([]);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [monthly, setMonthly] = useState<MonthlyRevenue[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSources(MOCK_SOURCES);
      setProviders(MOCK_PROVIDERS);
      setMonthly(MOCK_MONTHLY);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const totalRevenue = sources.reduce((s, r) => s + r.amount, 0);
  const totalTransactions = providers.reduce((s, p) => s + p.transactions, 0);

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
            <DollarSign className="w-8 h-8" />
            Revenue Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Financial overview and payment analytics
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-[#2C337A] mt-1">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-xs">
            <ArrowUpRight className="w-3 h-3" />
            <span>18.4% vs last period</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold text-[#2C337A] mt-1">
                {totalTransactions.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-[#E5E0FE] rounded-xl">
              <Receipt className="w-5 h-5 text-[#2C337A]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Transaction</p>
              <p className="text-2xl font-bold text-[#2C337A] mt-1">
                ${totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0}
              </p>
            </div>
            <div className="p-3 bg-[#FFC6DE] rounded-xl">
              <TrendingUp className="w-5 h-5 text-[#2C337A]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">MRR</p>
              <p className="text-2xl font-bold text-[#FB7720] mt-1">
                ${monthly[monthly.length - 1]?.total.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <BarChart3 className="w-5 h-5 text-[#FB7720]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by source */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#2C337A] mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Revenue by Source
          </h3>
          <div className="space-y-4">
            {sources.map((source) => (
              <div key={source.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {source.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">
                      ${source.amount.toLocaleString()}
                    </span>
                    <span
                      className={`text-xs flex items-center gap-0.5 ${
                        source.change >= 0
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {source.change >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {Math.abs(source.change)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${source.percentage}%`,
                      backgroundColor: source.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment provider breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#2C337A] mb-6 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Payment Provider Breakdown
          </h3>
          <div className="space-y-4">
            {providers.map((provider) => (
              <div
                key={provider.name}
                className="p-4 rounded-xl border border-gray-100 hover:border-[#E5E0FE] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: provider.color }}
                    />
                    <span className="text-sm font-semibold text-gray-800">
                      {provider.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#2C337A]">
                    ${provider.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{provider.transactions.toLocaleString()} transactions</span>
                  <span>{provider.percentage}% of total</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${provider.percentage}%`,
                      backgroundColor: provider.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly revenue table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-[#2C337A] mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Monthly Revenue Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-500 font-semibold">Month</th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold">Subscriptions</th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold">Credits</th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold">Submissions</th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold">Citations</th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.month} className="border-b border-gray-50 hover:bg-[#F8F8FD]">
                  <td className="py-3 px-3 font-medium text-gray-800">{m.month}</td>
                  <td className="py-3 px-3 text-right text-gray-600">${m.subscriptions.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-gray-600">${m.credits.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-gray-600">${m.submissions.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-gray-600">${m.citations.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-bold text-[#2C337A]">${m.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
