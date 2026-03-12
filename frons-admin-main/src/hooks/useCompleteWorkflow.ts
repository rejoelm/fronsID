import { useState, useCallback } from "react";
import { backendAPI } from "@/lib/api";
import { useCVRegistration } from "./useCVRegistration";
import { useManuscriptManagement } from "./useManuscriptManagement";
import { useManuscriptSubmission } from "./useManuscriptSubmission";
import { useNFTIntegration } from "./useNFTIntegration";
import {
  ManuscriptSubmissionRequest,
  ReviewSubmissionRequest,
  NFTMetadataRequest,
} from "@/types/backend";

export interface WorkflowState {
  step:
    | "cv_check"
    | "cv_upload"
    | "manuscript_submit"
    | "under_review"
    | "review_complete"
    | "published"
    | "nft_created";
  progress: number;
  message: string;
  error?: string;
}

export interface CompleteWorkflowData {
  // CV Data
  cvFile?: File;

  // Manuscript Data
  manuscriptFile?: File;
  title: string;
  author: string;
  category: string;
  abstract: string;
  keywords: string;

  // Review Data
  reviewers?: string[];

  // NFT Data
  nftMint?: string;
  doci?: string;
}

export function useCompleteWorkflow(walletAddress?: string) {
  const [state, setState] = useState<WorkflowState>({
    step: "cv_check",
    progress: 0,
    message: "Ready to start workflow",
  });

  const [workflowData, setWorkflowData] = useState<CompleteWorkflowData>({
    title: "",
    author: "",
    category: "",
    abstract: "",
    keywords: "",
  });

  const [manuscriptId, setManuscriptId] = useState<number | null>(null);
  const [reviewIds, setReviewIds] = useState<number[]>([]);
  const [nftCreated, setNftCreated] = useState(false);

  // Hook dependencies
  const { checkCVRegistration, uploadCV, getUserProfile } = useCVRegistration();

  const { assignReviewers, getReviewStatus, publishManuscript } =
    useManuscriptManagement();
    
  const { submitManuscript } = useManuscriptSubmission({
    checkCVRegistration: undefined
  });

  const { checkNFTHealth, createNFTMetadata } = useNFTIntegration();

  // Utility functions
  const updateState = useCallback((newState: Partial<WorkflowState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  }, []);

  const updateWorkflowData = useCallback(
    (newData: Partial<CompleteWorkflowData>) => {
      setWorkflowData((prev) => ({ ...prev, ...newData }));
    },
    []
  );

  // Step 1: Check CV Registration
  const checkCVStep = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) {
      updateState({
        step: "cv_check",
        progress: 0,
        message: "Wallet address required",
        error: "Please connect your wallet",
      });
      return false;
    }

    try {
      updateState({
        step: "cv_check",
        progress: 10,
        message: "Checking CV registration status...",
      });

      const hasCV = await checkCVRegistration(walletAddress);

      if (hasCV) {
        updateState({
          step: "manuscript_submit",
          progress: 20,
          message: "✅ CV verified! Ready to submit manuscript",
        });
        return true;
      } else {
        updateState({
          step: "cv_upload",
          progress: 5,
          message: "❌ CV not found. Please upload your CV first",
        });
        return false;
      }
    } catch (error) {
      updateState({
        step: "cv_check",
        progress: 0,
        message: "Failed to check CV status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }, [walletAddress, checkCVRegistration, updateState]);

  // Step 2: Upload CV
  const uploadCVStep = useCallback(async (): Promise<boolean> => {
    if (!walletAddress || !workflowData.cvFile) {
      updateState({
        step: "cv_upload",
        progress: 5,
        message: "CV file and wallet address required",
        error: "Please select a CV file",
      });
      return false;
    }

    try {
      updateState({
        step: "cv_upload",
        progress: 10,
        message: "Uploading and parsing CV...",
      });

      const result = await uploadCV(workflowData.cvFile, walletAddress);

      if (result?.success) {
        updateState({
          step: "manuscript_submit",
          progress: 20,
          message: "✅ CV uploaded successfully! Ready to submit manuscript",
        });
        return true;
      } else {
        updateState({
          step: "cv_upload",
          progress: 5,
          message: "Failed to upload CV",
          error: "CV upload failed. Please try again.",
        });
        return false;
      }
    } catch (error) {
      updateState({
        step: "cv_upload",
        progress: 5,
        message: "Failed to upload CV",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }, [walletAddress, workflowData.cvFile, uploadCV, updateState]);

  // Step 3: Submit Manuscript
  const submitManuscriptStep = useCallback(async (): Promise<boolean> => {
    if (!walletAddress || !workflowData.manuscriptFile) {
      updateState({
        step: "manuscript_submit",
        progress: 20,
        message: "Manuscript file and wallet address required",
        error: "Please select a manuscript file and fill all fields",
      });
      return false;
    }

    try {
      updateState({
        step: "manuscript_submit",
        progress: 30,
        message: "Submitting manuscript for peer review...",
      });

      const metadata = {
        title: workflowData.title,
        authors: [{ name: workflowData.author }],
        categories: [workflowData.category],
        abstract: workflowData.abstract,
        keywords: workflowData.keywords.split(',').map(k => k.trim()),
        walletAddress: walletAddress,
      };

      const result = await submitManuscript(
        workflowData.manuscriptFile,
        metadata,
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api"
      );

      if (result && result.success) {
        if (result.manuscript && result.manuscript.id) {
          setManuscriptId(Number(result.manuscript.id));
        }
        updateState({
          step: "under_review",
          progress: 40,
          message: `✅ Manuscript submitted! Now under peer review.`,
        });
        return true;
      } else {
        updateState({
          step: "manuscript_submit",
          progress: 20,
          message: "Failed to submit manuscript",
          error: "Manuscript submission failed. Please try again.",
        });
        return false;
      }
    } catch (error) {
      updateState({
        step: "manuscript_submit",
        progress: 20,
        message: "Failed to submit manuscript",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }, [walletAddress, workflowData, updateState, submitManuscript]);

  // Step 4: Assign Reviewers (Editor function)
  const assignReviewersStep = useCallback(
    async (reviewers: string[]): Promise<boolean> => {
      if (!manuscriptId || reviewers.length < 3) {
        updateState({
          step: "under_review",
          progress: 40,
          message: "Manuscript ID and minimum 3 reviewers required",
          error: "Please provide at least 3 reviewer addresses",
        });
        return false;
      }

      try {
        updateState({
          step: "under_review",
          progress: 50,
          message: "Assigning reviewers...",
        });

        const result = await assignReviewers(
          manuscriptId.toString(),
          reviewers.length
        );

        if (result) {
          updateState({
            step: "under_review",
            progress: 60,
            message: `✅ Reviewers assigned successfully. Waiting for reviews...`,
          });
          return true;
        } else {
          updateState({
            step: "under_review",
            progress: 40,
            message: "Failed to assign reviewers",
            error: "Reviewer assignment failed. Please try again.",
          });
          return false;
        }
      } catch (error) {
        updateState({
          step: "under_review",
          progress: 40,
          message: "Failed to assign reviewers",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return false;
      }
    },
    [manuscriptId, assignReviewers, updateState]
  );

  // Step 5: Check Review Status
  const checkReviewStatusStep = useCallback(async (): Promise<boolean> => {
    if (!manuscriptId) {
      updateState({
        step: "under_review",
        progress: 60,
        message: "Manuscript ID required",
        error: "No manuscript ID available",
      });
      return false;
    }

    try {
      updateState({
        step: "under_review",
        progress: 70,
        message: "Checking review status...",
      });

      const result = await getReviewStatus(manuscriptId.toString());

      if (result) {
        const progress =
          60 + (result.reviewsCompleted / result.requiredReviews) * 20;

        if (result.canPublish) {
          updateState({
            step: "review_complete",
            progress: 80,
            message: `✅ All reviews completed! Ready to publish. (${result.reviewsCompleted}/${result.requiredReviews} reviews)`,
          });
          return true;
        } else {
          updateState({
            step: "under_review",
            progress: progress,
            message: `📝 Review in progress: ${result.reviewsCompleted}/${result.requiredReviews} reviews completed`,
          });
          return false;
        }
      } else {
        updateState({
          step: "under_review",
          progress: 60,
          message: "Failed to check review status",
          error: "Could not retrieve review status",
        });
        return false;
      }
    } catch (error) {
      updateState({
        step: "under_review",
        progress: 60,
        message: "Failed to check review status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }, [manuscriptId, getReviewStatus, updateState]);

  // Step 6: Publish Manuscript
  const publishManuscriptStep = useCallback(async (): Promise<boolean> => {
    if (!manuscriptId) {
      updateState({
        step: "review_complete",
        progress: 80,
        message: "Manuscript ID required",
        error: "No manuscript ID available",
      });
      return false;
    }

    try {
      updateState({
        step: "review_complete",
        progress: 85,
        message: "Publishing manuscript...",
      });

      const result = await publishManuscript(
        manuscriptId.toString()
      );

      if (result) {
        updateState({
          step: "published",
          progress: 90,
          message: `✅ Manuscript published successfully!`,
        });
        return true;
      } else {
        updateState({
          step: "review_complete",
          progress: 80,
          message: "Failed to publish manuscript",
          error: "Publication failed. Please try again.",
        });
        return false;
      }
    } catch (error) {
      updateState({
        step: "review_complete",
        progress: 80,
        message: "Failed to publish manuscript",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }, [manuscriptId, publishManuscript, updateState]);

  // Step 7: Create NFT (Optional - Currently disabled in production)
  const createNFTStep = useCallback(async (): Promise<boolean> => {
    if (!workflowData.nftMint || !workflowData.doci) {
      updateState({
        step: "published",
        progress: 90,
        message: "NFT mint address and DOCI required",
        error: "Please provide NFT mint address and DOCI",
      });
      return false;
    }

    try {
      updateState({
        step: "published",
        progress: 95,
        message: "Creating NFT metadata...",
      });

      // Check NFT service health first
      const healthResult = await checkNFTHealth();
      if (!healthResult || healthResult.status !== "healthy") {
        updateState({
          step: "published",
          progress: 90,
          message: "NFT service is currently unavailable",
          error: "NFT service is temporarily disabled in production",
        });
        return false;
      }

      const nftData: NFTMetadataRequest = {
        mint: workflowData.nftMint,
        doci: workflowData.doci,
        title: workflowData.title,
        description: workflowData.abstract,
        ipfs_hash: "QmExample...", // This would be from manuscript submission
        author: workflowData.author,
      };

      const result = await createNFTMetadata(nftData);

      if (result) {
        setNftCreated(true);
        updateState({
          step: "nft_created",
          progress: 100,
          message: `🎯 NFT created successfully! Mint: ${result.mint}`,
        });
        return true;
      } else {
        updateState({
          step: "published",
          progress: 90,
          message: "Failed to create NFT",
          error: "NFT creation failed. Manuscript is still published.",
        });
        return false;
      }
    } catch (error) {
      updateState({
        step: "published",
        progress: 90,
        message: "Failed to create NFT",
        error:
          error instanceof Error ? error.message : "NFT service unavailable",
      });
      return false;
    }
  }, [workflowData, checkNFTHealth, createNFTMetadata, updateState]);

  // Complete workflow runner
  const runCompleteWorkflow = useCallback(async () => {
    try {
      // Step 1: Check CV
      const cvOk = await checkCVStep();
      if (!cvOk) return;

      // Step 2: Submit manuscript (CV already verified)
      const submitOk = await submitManuscriptStep();
      if (!submitOk) return;

      // Note: Steps 3-6 would typically be handled by editors/reviewers
      // This is just to demonstrate the complete flow

      updateState({
        step: "under_review",
        progress: 60,
        message:
          "✅ Workflow initiated! Manuscript is now under peer review. Editor will assign reviewers.",
      });
    } catch (error) {
      updateState({
        step: "cv_check",
        progress: 0,
        message: "Workflow failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [checkCVStep, submitManuscriptStep, updateState]);

  // Reset workflow
  const resetWorkflow = useCallback(() => {
    setState({
      step: "cv_check",
      progress: 0,
      message: "Ready to start workflow",
    });
    setWorkflowData({
      title: "",
      author: "",
      category: "",
      abstract: "",
      keywords: "",
    });
    setManuscriptId(null);
    setReviewIds([]);
    setNftCreated(false);
  }, []);

  return {
    // State
    state,
    workflowData,
    manuscriptId,
    reviewIds,
    nftCreated,

    // Actions
    updateWorkflowData,
    checkCVStep,
    uploadCVStep,
    submitManuscriptStep,
    assignReviewersStep,
    checkReviewStatusStep,
    publishManuscriptStep,
    createNFTStep,
    runCompleteWorkflow,
    resetWorkflow,

    // Utilities
    isStepComplete: (step: WorkflowState["step"]) => {
      const stepOrder = [
        "cv_check",
        "cv_upload",
        "manuscript_submit",
        "under_review",
        "review_complete",
        "published",
        "nft_created",
      ];
      const currentIndex = stepOrder.indexOf(state.step);
      const targetIndex = stepOrder.indexOf(step);
      return currentIndex > targetIndex;
    },

    canProceedToStep: (step: WorkflowState["step"]) => {
      const stepOrder = [
        "cv_check",
        "cv_upload",
        "manuscript_submit",
        "under_review",
        "review_complete",
        "published",
        "nft_created",
      ];
      const currentIndex = stepOrder.indexOf(state.step);
      const targetIndex = stepOrder.indexOf(step);
      return targetIndex <= currentIndex + 1;
    },
  };
}
