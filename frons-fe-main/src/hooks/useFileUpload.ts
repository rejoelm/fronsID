import { useState, useCallback } from "react";

interface UploadResult {
  success: boolean;
  message: string;
  ipfsHash?: string;
}

export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileChange = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    setUploadResult(null);
    setUploadProgress(0);
  }, []);

  const uploadToIPFS = useCallback(
    async (
      manuscriptData: any,
      walletAddress: string,
      apiUrl: string
    ): Promise<string | null> => {
      if (!file) {
        setUploadResult({
          success: false,
          message: "No file selected",
        });
        return null;
      }

      try {
        setUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 10;
          });
        }, 200);

        const formData = new FormData();
        formData.append("manuscript", file);
        formData.append("title", manuscriptData.title);
        formData.append(
          "author",
          manuscriptData.authors[0]?.name || "Unknown Author"
        );
        formData.append("category", manuscriptData.categories.join(","));
        formData.append("abstract", manuscriptData.abstract);
        formData.append("keywords", manuscriptData.keywords.join(","));
        formData.append("authorWallet", walletAddress);

        const response = await fetch(`${apiUrl}/api/manuscripts/submit`, {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        const result = await response.json();

        if (result.success) {
          const uploadResult: UploadResult = {
            success: true,
            message: "Manuscript uploaded successfully to IPFS",
            ipfsHash: result.manuscript.cid,
          };
          setUploadResult(uploadResult);
          return result.manuscript.cid;
        } else {
          const uploadResult: UploadResult = {
            success: false,
            message: result.message || "Failed to upload manuscript",
          };
          setUploadResult(uploadResult);
          return null;
        }
      } catch (error) {
        console.error("Failed to upload to IPFS:", error);
        const uploadResult: UploadResult = {
          success: false,
          message: "Network error while uploading to IPFS",
        };
        setUploadResult(uploadResult);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [file]
  );

  const resetUpload = useCallback(() => {
    setFile(null);
    setUploading(false);
    setUploadProgress(0);
    setUploadResult(null);
  }, []);

  return {
    file,
    uploading,
    uploadProgress,
    uploadResult,
    handleFileChange,
    uploadToIPFS,
    resetUpload,
  };
}
