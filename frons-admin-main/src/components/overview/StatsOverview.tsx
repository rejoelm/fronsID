import { type ManuscriptStats, type UserStats } from "@/hooks/useOverview";

interface StatsOverviewProps {
  manuscriptStats: ManuscriptStats;
  userStats: UserStats;
}

interface StatItem {
  title: string;
  value: string | number;
  description: string;
}

export function StatsOverview({
  manuscriptStats,
  userStats,
}: StatsOverviewProps) {
  const stats: StatItem[] = [
    {
      title: "Published Papers",
      value: 7,
      description: "Total published manuscripts",
    },
    {
      title: "Pending Reviews",
      value: manuscriptStats.pendingReviews,
      description: "Awaiting peer review",
    },
    {
      title: "Reviews Completed",
      value: userStats.reviewsCompleted,
      description: "Your review contributions",
    },
    {
      title: "Total Earnings",
      value: `$${userStats.totalEarnings.toFixed(0)}`,
      description: "FRONS token rewards",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100/80 shadow-sm"
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-primary mb-1">{stat.value}</p>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {stat.title}
            </p>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
