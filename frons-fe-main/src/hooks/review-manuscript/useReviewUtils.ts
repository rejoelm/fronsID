"use client";
import { PendingReviewManuscript } from "@/types/backend";

export const useReviewUtils = () => {
  const parseCategory = (categoryData: any): string => {
    if (!categoryData) return "Uncategorized";

    if (Array.isArray(categoryData)) {
      return categoryData.length > 0 ? categoryData[0] : "Uncategorized";
    }

    if (typeof categoryData === "string") {
      const firstCategory = categoryData.split(",")[0].trim();
      return firstCategory || "Uncategorized";
    }

    return "Uncategorized";
  };

  const extractAllCategories = (categoryData: any): string[] => {
    if (!categoryData) return [];

    if (Array.isArray(categoryData)) {
      return categoryData;
    }

    if (typeof categoryData === "string") {
      return categoryData
        .split(",")
        .map((cat) => cat.trim())
        .filter((cat) => cat.length > 0);
    }

    return [];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-blue-100 text-blue-800";
      case "assigned":
        return "bg-purple-100 text-purple-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending_reviews":
        return "bg-orange-100 text-orange-800";
      case "ready_for_publication":
        return "bg-emerald-100 text-emerald-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "assigned":
        return "Assigned";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "pending_reviews":
        return "Pending Reviews";
      case "ready_for_publication":
        return "Ready for Publication";
      case "overdue":
        return "Overdue";
      default:
        return "Unknown";
    }
  };

  const getStatusBadge = (manuscript: PendingReviewManuscript) => {
    const { reviewsCompleted, reviewsRequired, canPublish } =
      manuscript.reviewInfo;

    if (canPublish) {
      return {
        className: "bg-green-100 text-green-800",
        text: "Ready to Publish",
      };
    } else if (reviewsCompleted > 0) {
      return {
        className: "bg-yellow-100 text-yellow-800",
        text: `In Review (${reviewsCompleted}/${reviewsRequired})`,
      };
    } else {
      return {
        className: "bg-gray-100 text-gray-800",
        text: "Awaiting Reviewers",
      };
    }
  };

  return {
    parseCategory,
    extractAllCategories,
    formatDate,
    getStatusColor,
    getStatusLabel,
    getStatusBadge,
  };
};