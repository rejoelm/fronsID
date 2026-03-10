import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusIcon, getStatusText } from "@/utils/manuscriptStatusHelpers";
import type { Manuscript } from "@/hooks/useAuthorManuscripts";

interface RecentSubmissionsProps {
  manuscripts: Manuscript[];
}

export function RecentSubmissions({ manuscripts }: RecentSubmissionsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Recent Submissions</h3>
      <div className="space-y-3">
        {manuscripts.map((manuscript) => (
          <div
            key={manuscript.id}
            className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                {getStatusIcon(manuscript.status)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">
                  {manuscript.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(manuscript.submissionDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {manuscript.reviewInfo && (
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {manuscript.reviewInfo.reviewsCompleted}/
                  {manuscript.reviewInfo.reviewsRequired} reviews
                </div>
              )}
              <Badge className={`${getStatusColor(manuscript.status)} text-xs`}>
                {getStatusText(manuscript.status)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}