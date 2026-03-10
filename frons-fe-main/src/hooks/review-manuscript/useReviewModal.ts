"use client";
import { useState } from "react";

export const useReviewModal = () => {
  const [showAssignReviewers, setShowAssignReviewers] = useState(false);
  const [reviewers, setReviewers] = useState<string[]>(["", "", ""]);

  const openAssignReviewersModal = () => {
    setShowAssignReviewers(true);
    setReviewers(["", "", ""]); // Reset reviewers
  };

  const closeAssignReviewersModal = () => {
    setShowAssignReviewers(false);
    setReviewers(["", "", ""]);
  };

  const updateReviewer = (index: number, value: string) => {
    const newReviewers = [...reviewers];
    newReviewers[index] = value;
    setReviewers(newReviewers);
  };

  const addReviewer = () => {
    setReviewers([...reviewers, ""]);
  };

  const removeReviewer = (index: number) => {
    if (reviewers.length > 3) {
      const newReviewers = reviewers.filter((_, i) => i !== index);
      setReviewers(newReviewers);
    }
  };

  const getValidReviewers = () => {
    return reviewers.filter((r) => r.trim() !== "");
  };

  const isValidReviewerCount = () => {
    return getValidReviewers().length >= 3;
  };

  return {
    showAssignReviewers,
    reviewers,
    openAssignReviewersModal,
    closeAssignReviewersModal,
    updateReviewer,
    addReviewer,
    removeReviewer,
    getValidReviewers,
    isValidReviewerCount,
  };
};