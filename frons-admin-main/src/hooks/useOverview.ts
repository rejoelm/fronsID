import { useState, useEffect } from "react";
import axios from "axios";

export interface ManuscriptStats {
  total: number;
  submitted: number;
  underReview: number;
  published: number;
  rejected: number;
  pendingReviews: number;
  readyForPublication: number;
}

export interface UserStats {
  manuscriptsSubmitted: number;
  manuscriptsPublished: number;
  reviewsCompleted: number;
  fronsTokens: number;
  totalEarnings: number;
  reputationScore: number;
}


export function useOverview(
  connected: boolean,
  validSolanaPublicKey: string | undefined
) {
  const [manuscriptStats, setManuscriptStats] = useState<ManuscriptStats>({
    total: 0,
    submitted: 0,
    underReview: 0,
    published: 0,
    rejected: 0,
    pendingReviews: 0,
    readyForPublication: 0,
  });
  const [userStats, setUserStats] = useState<UserStats>({
    manuscriptsSubmitted: 0,
    manuscriptsPublished: 0,
    reviewsCompleted: 0,
    fronsTokens: 0,
    totalEarnings: 0,
    reputationScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !validSolanaPublicKey) {
      // Reset to empty state when not connected
      setManuscriptStats({
        total: 0,
        submitted: 0,
        underReview: 0,
        published: 0,
        rejected: 0,
        pendingReviews: 0,
        readyForPublication: 0,
      });
      setUserStats({
        manuscriptsSubmitted: 0,
        manuscriptsPublished: 0,
        reviewsCompleted: 0,
        fronsTokens: 0,
        totalEarnings: 0,
        reputationScore: 0,
      });
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

        // Try to fetch real data first
        try {
          const manuscriptsResponse = await axios.get(
            `${apiUrl}/api/manuscripts/stats?authorWallet=${validSolanaPublicKey}`
          );

          if (manuscriptsResponse.data.success) {
            // Use real data only
            const realStats = manuscriptsResponse.data.stats;
            setManuscriptStats(realStats);
          } else {
            // Reset to empty state if API fails
            setManuscriptStats({
              total: 0,
              submitted: 0,
              underReview: 0,
              published: 0,
              rejected: 0,
              pendingReviews: 0,
              readyForPublication: 0,
            });
          }
        } catch (apiError) {
          console.log("API not available, showing empty state");
          setManuscriptStats({
            total: 0,
            submitted: 0,
            underReview: 0,
            published: 0,
            rejected: 0,
            pendingReviews: 0,
            readyForPublication: 0,
          });
        }

        try {
          const userResponse = await axios.get(
            `${apiUrl}/api/users/stats?wallet=${validSolanaPublicKey}`
          );

          if (userResponse.data.success) {
            // Use real data only
            const realUserStats = userResponse.data.stats;
            setUserStats(realUserStats);
          } else {
            // Reset to empty state if API fails
            setUserStats({
              manuscriptsSubmitted: 0,
              manuscriptsPublished: 0,
              reviewsCompleted: 0,
              fronsTokens: 0,
              totalEarnings: 0,
              reputationScore: 0,
            });
          }
        } catch (apiError) {
          console.log("User API not available, showing empty state");
          setUserStats({
            manuscriptsSubmitted: 0,
            manuscriptsPublished: 0,
            reviewsCompleted: 0,
            fronsTokens: 0,
            totalEarnings: 0,
            reputationScore: 0,
          });
        }
      } catch (err: any) {
        console.error("Failed to fetch stats:", err);
        // Show error state instead of mock data
        setError("Failed to load dashboard data. Please try refreshing the page.");
        setManuscriptStats({
          total: 0,
          submitted: 0,
          underReview: 0,
          published: 0,
          rejected: 0,
          pendingReviews: 0,
          readyForPublication: 0,
        });
        setUserStats({
          manuscriptsSubmitted: 0,
          manuscriptsPublished: 0,
          reviewsCompleted: 0,
          fronsTokens: 0,
          totalEarnings: 0,
          reputationScore: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [connected, validSolanaPublicKey]);

  return {
    manuscriptStats,
    userStats,
    loading,
    error,
  };
}
