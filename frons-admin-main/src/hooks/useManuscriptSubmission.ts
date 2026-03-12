import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import axios from "axios";

interface UseManuscriptSubmissionProps {
  checkCVRegistration?: (walletAddress: string) => Promise<boolean>;
}

interface SubmissionResponse {
  success: boolean;
  manuscript: {
    id: string;
    cid: string;
    title: string;
    author: string;
    category: string;
    filename: string;
    size: number;
    type: string;
    uploadedAt: string;
    submittedAt: string;
  };
  metadata: {
    cid: string;
    filename: string;
  };
  ipfsUrls: {
    manuscript: string;
    metadata: string;
  };
  review: {
    id: string;
    status: string;
    autoAssignmentAttempted: boolean;
    autoAssignmentResult: any;
  };
  smartContract: {
    ipfs_hash: string;
    metadata_cid: string;
    callData: {
      function: string;
      parameter: string;
    };
  };
  message: string;
}

export function useManuscriptSubmission({
  checkCVRegistration,
}: UseManuscriptSubmissionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticated, getAccessToken } = usePrivy();

  const submitManuscript = useCallback(
    async (
      file: File,
      metadata: {
        title: string;
        authors: { name: string }[];
        categories: string[];
        abstract: string;
        keywords: string[];
        walletAddress?: string; // Now optional since we use Privy auth
      },
      apiUrl: string
    ): Promise<SubmissionResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated with Privy
        if (!authenticated) {
          setError("Please authenticate to submit a manuscript.");
          return null;
        }

        // Get authentication token
        console.log("🔐 Getting Privy access token...");
        const accessToken = await getAccessToken();
        if (!accessToken) {
          console.error("❌ Failed to get access token");
          setError("Failed to get authentication token. Please login again.");
          return null;
        }
        console.log("✅ Access token obtained:", accessToken.substring(0, 20) + "...");

        // For legacy support, still check CV registration if function provided
        if (checkCVRegistration && metadata.walletAddress) {
          const cvVerified = await checkCVRegistration(metadata.walletAddress);
          if (!cvVerified) {
            const errorMsg =
              "CV verification failed. Please ensure your CV is registered.";
            setError(errorMsg);
            return null;
          }
        }

        // Create FormData with all required fields
        console.log("📝 Creating FormData for submission...");
        const formData = new FormData();
        formData.append("manuscript", file);
        formData.append("title", metadata.title);
        formData.append(
          "author",
          metadata.authors[0]?.name || "Unknown Author"
        );
        formData.append("category", metadata.categories.join(","));
        formData.append("abstract", metadata.abstract || "");
        formData.append("keywords", metadata.keywords.join(","));

        // Optional wallet address for backward compatibility
        if (metadata.walletAddress) {
          formData.append("authorWallet", metadata.walletAddress);
        }

        // Optional flags for auto-assignment
        formData.append("autoAssign", "true");
        formData.append("aiAutoAssign", "true");
        
        console.log("📋 FormData fields prepared:");
        console.log("- File:", file.name, "(" + file.size + " bytes)");
        console.log("- Title:", metadata.title);
        console.log("- Author:", metadata.authors[0]?.name);
        console.log("- Categories:", metadata.categories.join(","));
        console.log("- Wallet:", metadata.walletAddress);

        // Use Privy-enabled endpoint with authentication
        const apiEndpoint = `${apiUrl}/manuscripts/submit/privy`;
        console.log("🌐 Making API request to:", apiEndpoint);
        console.log("📡 Request headers:", {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${accessToken.substring(0, 20)}...`
        });
        
        const result = await axios.post<SubmissionResponse>(
          apiEndpoint,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": `Bearer ${accessToken}`,
            },
          }
        );

        console.log("📨 API Response received:");
        console.log("- Status:", result.status);
        console.log("- Success:", result.data.success);
        console.log("- Full response:", result.data);

        // Enhanced success detection - check for actual submission indicators
        const hasManuscriptId = result.data.manuscript?.id;
        const hasIpfsHash = result.data.manuscript?.cid || result.data.smartContract?.ipfs_hash;
        const hasIpfsUrls = result.data.ipfsUrls?.manuscript;
        
        console.log("🔍 Enhanced success detection:");
        console.log("- Has manuscript ID:", !!hasManuscriptId);
        console.log("- Has IPFS hash:", !!hasIpfsHash);
        console.log("- Has IPFS URLs:", !!hasIpfsUrls);
        console.log("- Backend success flag:", result.data.success);

        // Consider submission successful if manuscript was created and stored, 
        // even if there were non-critical errors (like storage fallback)
        if (result.data.success || (hasManuscriptId && hasIpfsHash)) {
          console.log("✅ Manuscript submission successful!");
          return result.data;
        }

        console.error("❌ Submission failed with response:", result.data);
        setError("Submission failed - no manuscript data received");
        return null;
      } catch (error: any) {
        console.error("❌ API Request failed with error:");
        console.error("- Error type:", error.constructor.name);
        console.error("- Error message:", error.message);
        console.error("- HTTP Status:", error.response?.status);
        console.error("- Response data:", error.response?.data);
        console.error("- Full error object:", error);
        
        const errorData = error.response?.data;
        
        // Check if this is a storage fallback scenario where submission actually succeeded
        const hasManuscriptData = errorData?.manuscript?.id || errorData?.smartContract?.ipfs_hash;
        const isStorageError = errorData?.code === "STORAGE_ERROR" || 
                              errorData?.code === "WALRUS_ERROR" ||
                              (error.message && error.message.includes("Walrus"));
        
        console.log("🔍 Error analysis:");
        console.log("- Has manuscript data:", !!hasManuscriptData);
        console.log("- Is storage error:", isStorageError);
        console.log("- Error code:", errorData?.code);
        
        // If we have manuscript data despite storage errors, treat as success
        if (hasManuscriptData && isStorageError) {
          console.log("✅ Storage fallback successful - treating as success despite error");
          return errorData;
        }
        
        let errorMessage = "Failed to submit manuscript";

        if (errorData?.code === "CV_REQUIRED") {
          errorMessage = errorData.message || "CV registration required";
        } else if (errorData?.code === "ACADEMIC_PERMISSIONS_REQUIRED") {
          errorMessage = "Academic credentials required for manuscript submission";
        } else if (errorData?.code === "INVALID_TOKEN") {
          errorMessage = "Authentication expired. Please login again.";
        } else if (errorData?.code === "MISSING_WALLET") {
          errorMessage = errorData.message || "Wallet address required";
        } else if (errorData?.code === "DUPLICATE_MANUSCRIPT") {
          // For duplicate manuscript, preserve the original error for proper handling in main page
          console.log("🔄 Rethrowing DUPLICATE_MANUSCRIPT error for main page handling");
          throw error; // Rethrow the original axios error so main page can access error.response.data.code
        } else if (errorData?.code === "DUPLICATE_DATA") {
          errorMessage = "This data has already been submitted";
        } else if (errorData?.code === "PINATA_ERROR") {
          errorMessage = "IPFS upload failed. Please try again.";
        } else if (errorData?.code === "STORAGE_ERROR" && !hasManuscriptData) {
          // Only show storage error if no manuscript data was created
          errorMessage = "Storage service error. Please try again.";
        } else if (errorData?.code === "NETWORK_ERROR") {
          errorMessage = "Network connection failed. Please check your connection.";
        }

        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticated, getAccessToken, checkCVRegistration]
  );

  return {
    loading,
    error,
    submitManuscript,
  };
}
