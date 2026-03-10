import {
  FileTextIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
} from "lucide-react";
import type { AuthorDashboardStats } from "@/hooks/useAuthorDashboardStats";

interface AuthorStatsGridProps {
  stats: AuthorDashboardStats;
}

export function AuthorStatsGrid({ stats }: AuthorStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-primary/10 backdrop-blur-sm rounded-xl p-4 border-1 border-primary/70 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <FileTextIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-primary">
              {stats.totalManuscripts}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </div>

      <div className="bg-emerald-100/30  backdrop-blur-sm rounded-xl p-4 border-1 border-emerald-600/70 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-600">
              {stats.publishedCount}
            </p>
            <p className="text-xs text-muted-foreground">Published</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-100/20 backdrop-blur-sm rounded-xl p-4 border-1 border-amber-600/70 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <ClockIcon className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-amber-600">
              {stats.underReviewCount}
            </p>
            <p className="text-xs text-muted-foreground">In Review</p>
          </div>
        </div>
      </div>

      <div className="bg-orange-100/20 backdrop-blur-sm rounded-xl p-4 border-1 border-orange-600/70 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertCircleIcon className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-orange-600">
              {stats.revisionRequiredCount}
            </p>
            <p className="text-xs text-muted-foreground">Revision</p>
          </div>
        </div>
      </div>
    </div>
  );
}
