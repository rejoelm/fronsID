import { useState, useEffect, useCallback } from "react";
import { useManuscriptManagement } from "@/hooks/useManuscriptManagement";

interface ReviewInfo {
  reviewsCompleted: number;
  reviewsRequired: number;
  canPublish: boolean;
}

interface IPFSUrls {
  manuscript: string;
  metadata: string | null;
}

export interface Manuscript {
  id: string;
  title: string;
  abstract: string;
  category: string[];
  keywords: string[];
  author_wallet: string;
  status: "under_review" | "published" | "rejected" | "revision_required";
  submissionDate: string;
  created_at: string;
  updated_at: string;
  publishedDate?: string;
  cid: string;
  ipfs_hash: string;
  reviewInfo?: ReviewInfo;
  reviews?: Array<{
    id: string;
    comments: string;
    decision: string;
    reviewer_wallet: string;
    created_at: string;
  }>;
  ipfsUrls?: IPFSUrls;
}

export function useAuthorManuscripts(walletAddress?: string) {
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const { getAuthorManuscripts, isLoading, error } = useManuscriptManagement();

  const fetchManuscripts = useCallback(async () => {
    if (walletAddress) {
      const result = await getAuthorManuscripts(walletAddress);
      if (result) {
        setManuscripts(result);
      }
    }
  }, [walletAddress, getAuthorManuscripts]);

  const refreshManuscripts = useCallback(async () => {
    await fetchManuscripts();
  }, [fetchManuscripts]);

  useEffect(() => {
    fetchManuscripts();
  }, [fetchManuscripts]);

  return {
    manuscripts,
    isLoading,
    error,
    refreshManuscripts,
  };
}