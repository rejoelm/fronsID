import React from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  XCircleIcon,
  SendIcon,
  FileTextIcon,
} from "lucide-react";

export const getStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "accepted":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "under_review":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "revision_required":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "submitted":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "published":
      return <CheckCircleIcon className="h-3.5 w-3.5" />;
    case "accepted":
      return <CheckCircleIcon className="h-3.5 w-3.5" />;
    case "under_review":
      return <ClockIcon className="h-3.5 w-3.5" />;
    case "revision_required":
      return <AlertCircleIcon className="h-3.5 w-3.5" />;
    case "rejected":
      return <XCircleIcon className="h-3.5 w-3.5" />;
    case "submitted":
      return <SendIcon className="h-3.5 w-3.5" />;
    default:
      return <FileTextIcon className="h-3.5 w-3.5" />;
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case "published":
      return "Published";
    case "accepted":
      return "Accepted";
    case "under_review":
      return "Under Review";
    case "revision_required":
      return "Revision Required";
    case "rejected":
      return "Rejected";
    case "submitted":
      return "Submitted";
    default:
      return "Unknown";
  }
};
