import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, EyeIcon, EditIcon, CheckCircleIcon } from "lucide-react";
import { getStatusColor, getStatusIcon, getStatusText } from "@/utils/manuscriptStatusHelpers";
import type { Manuscript } from "@/hooks/useAuthorManuscripts";

interface ManuscriptCardProps {
  manuscript: Manuscript;
  onViewManuscript: (url: string) => void;
  onViewPublication: (url: string) => void;
}

export function ManuscriptCard({ 
  manuscript, 
  onViewManuscript, 
  onViewPublication 
}: ManuscriptCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white/50 hover:bg-white/80 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-primary truncate">
              {manuscript.title}
            </h3>
            <Badge
              className={`${getStatusColor(manuscript.status)} text-xs flex-shrink-0`}
            >
              {getStatusIcon(manuscript.status)}
              <span className="ml-1">
                {getStatusText(manuscript.status)}
              </span>
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{manuscript.category.join(", ")}</span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-3 w-3" />
              <span>
                {new Date(manuscript.submissionDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Progress */}
      {manuscript.reviewInfo && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">
              Review Progress
            </span>
            <span className="text-xs text-muted-foreground">
              {manuscript.reviewInfo.reviewsCompleted}/
              {manuscript.reviewInfo.reviewsRequired} Complete
            </span>
          </div>
          <Progress
            value={
              (manuscript.reviewInfo.reviewsCompleted /
                manuscript.reviewInfo.reviewsRequired) * 100
            }
            className="h-2"
          />
        </div>
      )}

      {/* Abstract */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {manuscript.abstract}
        </p>
      </div>

      {/* Keywords */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {manuscript.keywords.slice(0, 4).map((keyword, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
          {manuscript.keywords.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{manuscript.keywords.length - 4}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
        {manuscript.ipfsUrls?.manuscript && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewManuscript(manuscript.ipfsUrls!.manuscript)}
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            View
          </Button>
        )}
        {manuscript.status === "revision_required" && (
          <Button size="sm">
            <EditIcon className="h-3 w-3 mr-1" />
            Revise
          </Button>
        )}
        {manuscript.status === "published" && manuscript.ipfsUrls?.metadata && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewPublication(manuscript.ipfsUrls!.metadata!)}
          >
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Publication
          </Button>
        )}
      </div>
    </div>
  );
}