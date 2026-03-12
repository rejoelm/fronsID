import { useState, useEffect, useCallback } from "react";
import { backendAPI } from "@/lib/api";
import { useOverview, ManuscriptStats, UserStats } from "./useOverview";
import { toast } from "./use-toast";

export interface PublishedManuscript {
  id: number;
  title: string;
  author: string;
  category: string[];
  abstract?: string;
  status: string;
  submissionDate: string;
  publishedDate: string;
  cid: string;
  ipfsUrls?: {
    manuscript: string;
  };
  reviewsCompleted?: number;
  reviewsApproved?: number;
  reviewInfo?: {
    reviewsCompleted: number;
    reviewsRequired: number;
    reviewsApproved: number;
    canPublish: boolean;
  };
}

const RESEARCH_CATEGORIES = [
  "All Categories",
  "Artificial Intelligence",
  "Machine Learning",
  "Computer Science",
  "Biology",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Engineering",
  "Medicine",
  "Economics",
  "Psychology",
  "Neuroscience",
  "Environmental Science",
  "Quantum Computing",
  "Blockchain Technology",
];

export function useManuscriptsOverview(
  connected: boolean,
  validSolanaPublicKey: string | undefined
) {
  // Overview data from existing hook
  const {
    manuscriptStats,
    userStats,
    loading: overviewLoading,
    error: overviewError,
  } = useOverview(connected, validSolanaPublicKey);

  // Manuscripts data
  const [manuscripts, setManuscripts] = useState<PublishedManuscript[]>([]);
  const [manuscriptsLoading, setManuscriptsLoading] = useState(true);
  const [manuscriptsError, setManuscriptsError] = useState<string | null>(null);

  // Helper function to filter properly reviewed manuscripts
  const filterProperlyReviewedManuscripts = (
    manuscripts: any[]
  ): PublishedManuscript[] => {
    return manuscripts
      .filter((m: any) => {
        // Only show manuscripts that are published and have sufficient reviews
        const reviewsCompleted =
          m.reviewsCompleted || m.reviewInfo?.reviewsCompleted || 0;
        const reviewsApproved =
          m.reviewsApproved || m.reviewInfo?.reviewsApproved || 0;

        return (
          m.status === "published" &&
          reviewsCompleted >= 3 &&
          reviewsApproved >= 3
        );
      })
      .map((m: any) => ({
        id: m.id,
        title: m.title,
        author: m.author,
        category: Array.isArray(m.category)
          ? m.category
          : [m.category || "Research"],
        abstract: m.abstract || "",
        status: m.status,
        submissionDate: m.submissionDate || m.createdAt,
        publishedDate: m.publishedDate || m.updatedAt,
        cid: m.cid || m.ipfsHash,
        ipfsUrls:
          m.ipfsUrls ||
          (m.cid ? { manuscript: `https://ipfs.io/ipfs/${m.cid}` } : undefined),
        reviewsCompleted:
          m.reviewsCompleted || m.reviewInfo?.reviewsCompleted || 0,
        reviewsApproved:
          m.reviewsApproved || m.reviewInfo?.reviewsApproved || 0,
        reviewInfo: m.reviewInfo || {
          reviewsCompleted: m.reviewsCompleted || 0,
          reviewsRequired: 3,
          reviewsApproved: m.reviewsApproved || 0,
          canPublish:
            (m.reviewsCompleted || 0) >= 3 && (m.reviewsApproved || 0) >= 3,
        },
      }));
  };

  // Fetch published manuscripts - only real data, show error toast on failure
  const fetchPublishedManuscripts = useCallback(async () => {
    try {
      setManuscriptsLoading(true);
      setManuscriptsError(null);

      console.log(
        "🔍 Fetching properly reviewed published manuscripts from backend..."
      );

      // Try to fetch real data from backend
      try {
        const allManuscripts: any[] = [];

        // First, try to get all published manuscripts without category filter
        try {
          console.log("📚 Fetching all published manuscripts...");
          const allResult = await backendAPI.getPublishedManuscripts(
            undefined,
            50
          );
          if (allResult && allResult.length > 0) {
            console.log(`✅ Found ${allResult.length} published manuscripts`);
            allManuscripts.push(...allResult);
          }
        } catch (allError) {
          console.warn(
            "⚠️ Failed to fetch all manuscripts, trying category-wise:",
            allError
          );

          // Fallback: fetch by categories
          const categories = RESEARCH_CATEGORIES.filter(
            (cat) => cat !== "All Categories"
          );
          for (const category of categories.slice(0, 8)) {
            // Limit to 8 categories for performance
            try {
              console.log(`📖 Fetching manuscripts for category: ${category}`);
              const result = await backendAPI.getPublishedManuscripts(
                category,
                10
              );
              if (result && result.length > 0) {
                console.log(
                  `✅ Found ${result.length} manuscripts in ${category}`
                );
                allManuscripts.push(...result);
              }
            } catch (err) {
              console.warn(
                `⚠️ Failed to fetch manuscripts for category ${category}:`,
                err
              );
            }
          }
        }

        // Remove duplicates by ID
        const uniqueManuscripts = allManuscripts.filter(
          (manuscript, index, self) =>
            index === self.findIndex((m) => m.id === manuscript.id)
        );

        const properlyReviewedManuscripts =
          filterProperlyReviewedManuscripts(uniqueManuscripts);

        if (properlyReviewedManuscripts.length > 0) {
          console.log(
            `✅ Successfully loaded ${properlyReviewedManuscripts.length} properly reviewed manuscripts`
          );
          setManuscripts(properlyReviewedManuscripts.slice(0, 30)); // Limit to 30 for performance
        } else {
          setManuscripts([]);
        }
      } catch (apiError) {
        const errorMessage =
          "Failed to load manuscripts from server. Please check your connection and try again.";
        console.error("❌ Backend API error:", apiError);
        setManuscriptsError(errorMessage);
        setManuscripts([]);
      }
    } catch (err) {
      const errorMessage =
        "A critical error occurred while loading manuscripts. Please refresh the page.";
      console.error("❌ Critical error fetching published manuscripts:", err);
      setManuscriptsError(errorMessage);
      setManuscripts([]);

      toast({
        title: "Critical Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setManuscriptsLoading(false);
    }
  }, []);

  // Load manuscripts on mount
  useEffect(() => {
    fetchPublishedManuscripts();
  }, [fetchPublishedManuscripts]);

  // Filter manuscripts based on search criteria
  const filterManuscripts = useCallback(
    (searchTerm: string, selectedCategory: string, sortBy: string) => {
      let filtered = manuscripts;

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(
          (manuscript) =>
            manuscript.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            manuscript.author
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            manuscript.abstract
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
        );
      }

      // Filter by category
      if (selectedCategory !== "All Categories") {
        filtered = filtered.filter((manuscript) =>
          manuscript.category.includes(selectedCategory)
        );
      }

      // Sort manuscripts
      const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return (
              new Date(b.publishedDate).getTime() -
              new Date(a.publishedDate).getTime()
            );
          case "oldest":
            return (
              new Date(a.publishedDate).getTime() -
              new Date(b.publishedDate).getTime()
            );
          case "title":
            return a.title.localeCompare(b.title);
          case "author":
            return a.author.localeCompare(b.author);
          default:
            return 0;
        }
      });

      return sorted;
    },
    [manuscripts]
  );

  const refreshData = useCallback(() => {
    fetchPublishedManuscripts();
  }, [fetchPublishedManuscripts]);

  return {
    // Overview data
    manuscriptStats,
    userStats,
    overviewLoading,
    overviewError,

    // Manuscripts data
    manuscripts,
    manuscriptsLoading,
    manuscriptsError,
    filterManuscripts,
    refreshData,

    // Combined loading state
    loading: overviewLoading || manuscriptsLoading,

    // Categories for filtering
    categories: RESEARCH_CATEGORIES,
  };
}

export { RESEARCH_CATEGORIES };
