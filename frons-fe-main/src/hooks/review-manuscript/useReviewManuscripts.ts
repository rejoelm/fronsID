"use client";
import { useState, useEffect, useCallback } from "react";
import { useManuscriptManagement } from "@/hooks/useManuscriptManagement";
import { isValidSolanaAddress } from "@/hooks/useProgram";
import { PendingReviewManuscript } from "@/types/backend";
import { useToast } from "@/hooks/use-toast";

export const useReviewManuscripts = (
  connected: boolean,
  validSolanaPublicKey?: string
) => {
  const [manuscripts, setManuscripts] = useState<PendingReviewManuscript[]>([]);
  const [selectedManuscript, setSelectedManuscript] = useState<PendingReviewManuscript | null>(null);
  const [reviewStatus, setReviewStatus] = useState<any>(null);
  const { toast } = useToast();

  const {
    isLoading: loading,
    error,
    getPendingReviewManuscripts,
    getReviewStatus,
    assignReviewers,
    publishManuscript,
  } = useManuscriptManagement();

  const loadPendingManuscripts = useCallback(async () => {
    console.log("🔄 Loading pending manuscripts for review...");

    try {
      // Pass the reviewer's wallet to exclude their own manuscripts
      const result = await getPendingReviewManuscripts(
        20,
        undefined,
        validSolanaPublicKey // This now acts as the reviewerWallet parameter
      );

      if (result && result.length > 0) {
        console.log(`✅ Received ${result.length} manuscripts from API`);

        const convertedResults = result.map((m: any) => ({
          ...m,
          author: m.author || m.authorWallet || "Unknown",
          reviewCount: m.reviewCount || 0,
          averageRating: m.averageRating || 0,
          deadline:
            m.deadline ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          reviewer: m.reviewer || "N/A",
          reviewStatus: m.reviewStatus || "pending",
          progress: m.progress || 0,
          priority: m.priority || "medium",
          assignedDate: m.assignedDate || m.submittedAt || m.created_at,
          reviewId: m.reviewId || `review-${m.id}`,
          manuscriptId: m.id,
        }));

        setManuscripts(convertedResults);
      } else {
        console.log("⚠️ No manuscripts received from API");
        setManuscripts([]);
      }
    } catch (error) {
      console.error("❌ API call failed:", error);
      setManuscripts([]);
    }
  }, [getPendingReviewManuscripts, validSolanaPublicKey]);

  useEffect(() => {
    if (connected) {
      loadPendingManuscripts();
    }
  }, [connected, loadPendingManuscripts]);

  const handleViewManuscript = async (manuscript: PendingReviewManuscript) => {
    setSelectedManuscript(manuscript);

    // Load review status
    const status = await getReviewStatus(manuscript.id.toString());
    if (status?.success) {
      setReviewStatus(status);
    }
  };

  const handleAssignReviewers = async (reviewers: string[]) => {
    if (!selectedManuscript || !validSolanaPublicKey) return false;

    const validReviewers = reviewers.filter((r) => r.trim() !== "");
    if (validReviewers.length < 3) {
      toast({
        variant: "destructive",
        title: "Insufficient Reviewers",
        description: "Please provide at least 3 reviewer wallet addresses.",
      });
      return false;
    }

    const result = await assignReviewers(
      selectedManuscript.id.toString(),
      validReviewers.length
    );

    if (result) {
      toast({
        variant: "success",
        title: "Reviewers Assigned",
        description: "Successfully assigned reviewers to the manuscript.",
      });
      loadPendingManuscripts(); // Refresh list
      return true;
    }
    return false;
  };

  const handlePublishManuscript = async () => {
    if (!selectedManuscript || !validSolanaPublicKey) return false;

    const confirmed = confirm(
      `Are you sure you want to publish "${selectedManuscript.title}"? This action cannot be undone.`
    );

    if (!confirmed) return false;

    const result = await publishManuscript(selectedManuscript.id.toString());

    if (result) {
      toast({
        variant: "success",
        title: "Manuscript Published",
        description: "The manuscript has been published successfully!",
      });
      setSelectedManuscript(null);
      setReviewStatus(null);
      loadPendingManuscripts(); // Refresh list
      return true;
    }
    return false;
  };

  return {
    manuscripts,
    selectedManuscript,
    reviewStatus,
    loading,
    error,
    loadPendingManuscripts,
    handleViewManuscript,
    handleAssignReviewers,
    handlePublishManuscript,
    setSelectedManuscript,
    setReviewStatus,
  };
};