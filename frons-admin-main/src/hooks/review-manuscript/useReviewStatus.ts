"use client";
import {
  EyeIcon,
  ClipboardCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  LoaderIcon,
  AlertCircleIcon,
  FileTextIcon,
} from "lucide-react";

export const reviewStatuses = [
  "All",
  "Available",
  "Assigned",
  "In Progress",
  "Completed",
  "Pending Reviews",
  "Ready for Publication",
  "Overdue",
];

export const useReviewStatus = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return EyeIcon;
      case "assigned":
        return ClipboardCheckIcon;
      case "in_progress":
        return ClockIcon;
      case "completed":
        return CheckCircleIcon;
      case "pending_reviews":
        return LoaderIcon;
      case "ready_for_publication":
        return CheckCircleIcon;
      case "overdue":
        return AlertCircleIcon;
      default:
        return FileTextIcon;
    }
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

  return {
    reviewStatuses,
    getStatusIcon,
    getStatusColor,
    getStatusLabel,
  };
};