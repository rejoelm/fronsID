"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Quote,
  TrendingUp,
  DollarSign,
  BarChart3,
  Bot,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";

interface CitationStat {
  month: string;
  count: number;
  revenue: number;
}

interface TopPaper {
  doci: string;
  title: string;
  citations: number;
  revenue: number;
  author: string;
}

interface AiAgent {
  name: string;
  citations: number;
  percentage: number;
  color: string;
}

const MOCK_MONTHLY: CitationStat[] = [
  { month: "Oct 2025", count: 1240, revenue: 6200 },
  { month: "Nov 2025", count: 1580, revenue: 7900 },
  { month: "Dec 2025", count: 1890, revenue: 9450 },
  { month: "Jan 2026", count: 2340, revenue: 11700 },
  { month: "Feb 2026", count: 2780, revenue: 13900 },
  { month: "Mar 2026", count: 3120, revenue: 15600 },
];

const MOCK_TOP_PAPERS: TopPaper[] = [
  {
    doci: "10.fronsciers/2026.0042",
    title: "Self-Attention Mechanisms in Protein Folding",
    citations: 342,
    revenue: 1710,
    author: "Dr. Rejo Elm",
  },
  {
    doci: "10.fronsciers/2025.0412",
    title: "Evaluating k-anonymity in LLM Context Windows",
    citations: 215,
    revenue: 1075,
    author: "Dr. Rejo Elm",
  },
  {
    doci: "10.fronsciers/2024.0345",
    title: "Contrastive Learning for Amino Acid Side-Chain Generation",
    citations: 267,
    revenue: 1335,
    author: "Dr. Rejo Elm",
  },
  {
    doci: "10.fronsciers/2024.0891",
    title: "Graph Neural Networks for Drug-Target Interaction",
    citations: 178,
    revenue: 890,
    author: "Dr. Marcus Webb",
  },
  {
    doci: "10.fronsciers/2025.1088",
    title: "Synthetic Data for Privacy-Preserving Clinical Trials",
    citations: 89,
    revenue: 445,
    author: "Dr. Rejo Elm",
  },
];

const MOCK_AI_AGENTS: AiAgent[] = [
  { name: "ChatGPT / OpenAI", citations: 4200, percentage: 35, color: "#10b981" },
  { name: "Claude / Anthropic", citations: 3360, percentage: 28, color: "#2C337A" },
  { name: "Gemini / Google", citations: 2160, percentage: 18, color: "#FB7720" },
  { name: "Perplexity AI", citations: 1200, percentage: 10, color: "#FFC6DE" },
  { name: "Other AI Services", citations: 1080, percentage: 9, color: "#E5E0FE" },
];

function BarChartSimple({ data }: { data: CitationStat[] }) {
  const maxCount = Math.max(...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-2 h-48">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 font-medium">
            {d.count.toLocaleString()}
          </span>
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-[#2C337A] to-[#4A55A2] transition-all hover:from-[#FB7720] hover:to-[#FFA05C]"
            style={{ height: `${(d.count / maxCount) * 100}%` }}
          />
          <span className="text-[10px] text-gray-400 mt-1">
            {d.month.split(" ")[0].slice(0, 3)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CitationsPage() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<CitationStat[]>([]);
  const [topPapers, setTopPapers] = useState<TopPaper[]>([]);
  const [aiAgents, setAiAgents] = useState<AiAgent[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMonthlyData(MOCK_MONTHLY);
      setTopPapers(MOCK_TOP_PAPERS);
      setAiAgents(MOCK_AI_AGENTS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const totalCitations = monthlyData.reduce((s, d) => s + d.count, 0);
  const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
  const lastMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];
  const growthRate =
    lastMonth && prevMonth
      ? (((lastMonth.count - prevMonth.count) / prevMonth.count) * 100).toFixed(1)
      : "0";

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
          <Quote className="w-8 h-8" />
          Citation Analytics
        </h1>
        <p className="text-gray-500 mt-1">
          Track citations, revenue, and AI agent attribution
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Citations</p>
          <p className="text-2xl font-bold text-[#2C337A] mt-1">
            {totalCitations.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
            <ArrowUpRight className="w-3 h-3" />
            <span>{growthRate}% vs last month</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Citation Revenue</p>
          <p className="text-2xl font-bold text-[#2C337A] mt-1">
            ${totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">Last 6 months</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Avg. per Paper</p>
          <p className="text-2xl font-bold text-[#2C337A] mt-1">
            ${topPapers.length > 0 ? Math.round(totalRevenue / topPapers.length).toLocaleString() : 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Revenue per paper</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-[#FB7720] mt-1">
            {lastMonth?.count.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">citations so far</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Citations over time chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#2C337A] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Citations Over Time
          </h3>
          <BarChartSimple data={monthlyData} />
        </div>

        {/* AI Agent breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#2C337A] mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Agent Breakdown
          </h3>
          <div className="space-y-3">
            {aiAgents.map((agent) => (
              <div key={agent.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">
                    {agent.name}
                  </span>
                  <span className="text-gray-500">
                    {agent.citations.toLocaleString()} ({agent.percentage}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${agent.percentage}%`,
                      backgroundColor: agent.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Total AI citations: {aiAgents.reduce((s, a) => s + a.citations, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Top cited papers */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-[#2C337A] mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Top Cited Papers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-500 font-semibold">
                  #
                </th>
                <th className="text-left py-2 px-3 text-gray-500 font-semibold">
                  Paper
                </th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold">
                  Citations
                </th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {topPapers.map((paper, idx) => (
                <tr
                  key={paper.doci}
                  className="border-b border-gray-50 hover:bg-[#F8F8FD]"
                >
                  <td className="py-3 px-3 text-gray-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-gray-900 truncate max-w-md">
                      {paper.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <span className="font-mono text-[#FB7720]">
                        {paper.doci}
                      </span>
                      {" "}by {paper.author}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-[#2C337A]">
                    {paper.citations.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-green-600">
                    ${paper.revenue.toLocaleString()}
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
