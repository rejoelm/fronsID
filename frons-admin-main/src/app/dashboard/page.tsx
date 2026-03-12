"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, FileText, Quote, DollarSign, Activity } from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalArticles: number;
  totalCitations: number;
  revenueUSDC: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalArticles: 0,
    totalCitations: 0,
    revenueUSDC: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [
          { count: usersCount, error: usersError },
          { count: articlesCount, error: articlesError },
          { data: articlesData, error: citationsError },
        ] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("articles").select("*", { count: "exact", head: true }),
          supabase.from("articles").select("citation_count"),
        ]);

        if (usersError || articlesError || citationsError) {
          throw new Error("Failed to fetch dashboard data");
        }

        const totalCitations = (articlesData || []).reduce(
          (sum: number, a: any) => sum + (a.citation_count || 0),
          0
        );

        setStats({
          totalUsers: usersCount || 0,
          totalArticles: articlesCount || 0,
          totalCitations,
          revenueUSDC: totalCitations * 0.5, // placeholder: $0.50 per citation
        });

        // Fetch recent activity from articles ordered by creation
        const { data: recentArticles } = await supabase
          .from("articles")
          .select("id, title, status, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        const activityFeed: RecentActivity[] = (recentArticles || []).map(
          (a: any) => ({
            id: a.id,
            type: a.status === "published" ? "Published" : "Submission",
            description: a.title || "Untitled Article",
            timestamp: a.created_at,
          })
        );

        setActivities(activityFeed);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C337A]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <p className="text-red-700 font-medium">Error loading dashboard</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Articles",
      value: stats.totalArticles.toLocaleString(),
      icon: FileText,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Total Citations",
      value: stats.totalCitations.toLocaleString(),
      icon: Quote,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Revenue (USDC)",
      value: `$${stats.revenueUSDC.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-[#FB7720]",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2C337A]">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of the FRONS ecosystem
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#2C337A]">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2C337A]" />
            <h2 className="text-lg font-semibold text-[#2C337A]">
              Recent Activity
            </h2>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {activities.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">
              No recent activity found
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-[#F8F8FD] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      activity.type === "Published"
                        ? "bg-green-100 text-green-700"
                        : "bg-[#E5E0FE] text-[#2C337A]"
                    }`}
                  >
                    {activity.type}
                  </span>
                  <span className="text-sm text-gray-700 font-medium">
                    {activity.description}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {activity.timestamp
                    ? new Date(activity.timestamp).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
