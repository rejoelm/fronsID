import { useMemo } from "react";
import type { Manuscript } from "./useAuthorManuscripts";

export interface AuthorDashboardStats {
  totalManuscripts: number;
  publishedCount: number;
  underReviewCount: number;
  revisionRequiredCount: number;
  rejectedCount: number;
  recentManuscripts: Manuscript[];
}

export function useAuthorDashboardStats(manuscripts: Manuscript[]): AuthorDashboardStats {
  return useMemo(() => {
    const stats = {
      totalManuscripts: manuscripts.length,
      publishedCount: manuscripts.filter((m) => m.status === "published").length,
      underReviewCount: manuscripts.filter((m) => m.status === "under_review").length,
      revisionRequiredCount: manuscripts.filter((m) => m.status === "revision_required").length,
      rejectedCount: manuscripts.filter((m) => m.status === "rejected").length,
      recentManuscripts: manuscripts
        .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
        .slice(0, 5),
    };
    
    return stats;
  }, [manuscripts]);
}