import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { apiClient } from "@/lib/api";
import axios from "axios";

interface ReviewInfo {
  reviewsCompleted: number;
  reviewsRequired: number;
  canPublish: boolean;
}

interface IPFSUrls {
  manuscript: string;
  metadata: string | null;
}

interface Manuscript {
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
  reviews?: any[];
  ipfsUrls?: IPFSUrls;
}

interface ManuscriptResponse {
  success: boolean;
  manuscripts: Manuscript[];
  count?: number;
  limit?: number;
  message?: string;
  error?: string;
}

export function useManuscriptManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticated, getAccessToken } = usePrivy();
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";

  // Get manuscripts by author wallet
  const getAuthorManuscripts = useCallback(
    async (walletAddress: string): Promise<Manuscript[] | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const accessToken = authenticated ? await getAccessToken() : undefined;
        
        let response: any;
        if (accessToken) {
          // Use Privy-authenticated endpoint
          response = await axios.get<ManuscriptResponse>(
            `${apiUrl}/manuscripts/author`,
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
        } else {
          // Fall back to legacy endpoint
          response = await axios.get<ManuscriptResponse>(
            `${apiUrl}/manuscripts/author/${walletAddress}`
          );
        }

        if (response.data.success) {
          return response.data.manuscripts;
        } else {
          throw new Error(response.data.error || "Failed to fetch manuscripts");
        }
      } catch (err) {
        console.error("Failed to fetch author manuscripts:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch manuscripts"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, authenticated, getAccessToken]
  );

  // Get manuscripts by status
  const getManuscriptsByStatus = useCallback(
    async (
      status: "under_review" | "published" | "rejected",
      limit: number = 20,
      category?: string
    ): Promise<Manuscript[] | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get<ManuscriptResponse>(
          `${apiUrl}/manuscripts/status/${status}`,
          {
            params: {
              limit,
              category,
            },
          }
        );

        if (response.data.success) {
          return response.data.manuscripts;
        } else {
          throw new Error(response.data.error || "Failed to fetch manuscripts");
        }
      } catch (err) {
        console.error("Failed to fetch manuscripts by status:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch manuscripts"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl]
  );

  // Get pending review manuscripts
  const getPendingReviewManuscripts = useCallback(
    async (
      limit: number = 20,
      category?: string,
      reviewerWallet?: string
    ): Promise<Manuscript[] | null> => {
      try {
        setIsLoading(true);
        setError(null);

        console.log(`🔍 Fetching pending review manuscripts (limit: ${limit}, category: ${category}, reviewer: ${reviewerWallet})`);

        const response = await axios.get<ManuscriptResponse>(
          `${apiUrl}/manuscripts/pending-review`,
          {
            params: {
              limit,
              category,
              reviewerWallet,
            },
          }
        );

        console.log(`📋 Pending review API response:`, response.data);

        if (response.data.success) {
          return response.data.manuscripts;
        } else {
          throw new Error(
            response.data.error || "Failed to fetch pending manuscripts"
          );
        }
      } catch (err) {
        console.error("Failed to fetch pending review manuscripts:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch manuscripts"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl]
  );

  // Assign reviewers to a manuscript
  const assignReviewers = useCallback(
    async (manuscriptId: string, reviewerCount: number = 3): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const accessToken = authenticated ? await getAccessToken() : undefined;
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

        const response = await axios.post(
          `${apiUrl}/reviews/manuscript/${manuscriptId}/assign-reviewers`,
          { reviewerCount },
          { headers }
        );

        return response.data.success;
      } catch (err) {
        console.error("Failed to assign reviewers:", err);
        setError(
          err instanceof Error ? err.message : "Failed to assign reviewers"
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, authenticated, getAccessToken]
  );

  // Get review status for a manuscript
  const getReviewStatus = useCallback(
    async (manuscriptId: string): Promise<any> => {
      try {
        setError(null);

        const accessToken = authenticated ? await getAccessToken() : undefined;
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

        const response = await axios.get(
          `${apiUrl}/reviews/manuscript/${manuscriptId}/status`,
          { headers }
        );

        return response.data;
      } catch (err) {
        console.error("Failed to get review status:", err);
        setError(
          err instanceof Error ? err.message : "Failed to get review status"
        );
        return null;
      }
    },
    [apiUrl, authenticated, getAccessToken]
  );

  // Publish a manuscript
  const publishManuscript = useCallback(
    async (manuscriptId: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const accessToken = authenticated ? await getAccessToken() : undefined;
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

        const response = await axios.post(
          `${apiUrl}/manuscripts/${manuscriptId}/publish`,
          {},
          { headers }
        );

        return response.data.success;
      } catch (err) {
        console.error("Failed to publish manuscript:", err);
        setError(
          err instanceof Error ? err.message : "Failed to publish manuscript"
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, authenticated, getAccessToken]
  );

  return {
    isLoading,
    error,
    getAuthorManuscripts,
    getManuscriptsByStatus,
    getPendingReviewManuscripts,
    assignReviewers,
    getReviewStatus,
    publishManuscript,
  };
}
