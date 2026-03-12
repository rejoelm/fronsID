import { useState, useCallback } from "react";
import { backendAPI } from "@/lib/api";
import {
  NFTHealthResponse,
  NFTMetadataRequest,
  NFTMetadataResponse,
  NFTMetadataGetResponse,
  NFTVerificationResponse,
} from "@/types/backend";
import { useLoading } from "@/context/LoadingContext";

export function useNFTIntegration() {
  const { isLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);

  // Check NFT service health
  const checkNFTHealth =
    useCallback(async (): Promise<NFTHealthResponse | null> => {
      try {
        setError(null);

        const result = await backendAPI.checkNFTHealth();
        return result;
      } catch (err) {
        console.error("Failed to check NFT health:", err);
        setError(
          err instanceof Error ? err.message : "Failed to check NFT services"
        );
        return null;
      }
    }, []);

  // Create NFT metadata
  const createNFTMetadata = useCallback(
    async (data: NFTMetadataRequest): Promise<NFTMetadataResponse | null> => {
      try {
        setError(null);

        const result = await backendAPI.createNFTMetadata(data);
        return result;
      } catch (err) {
        console.error("Failed to create NFT metadata:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create NFT metadata"
        );
        return null;
      }
    },
    []
  );

  // Get NFT metadata
  const getNFTMetadata = useCallback(
    async (mint: string): Promise<NFTMetadataGetResponse | null> => {
      try {
        setError(null);

        const result = await backendAPI.getNFTMetadata(mint);
        return {
          success: result.success,
          mint: result.mint,
          metadata: result.metadata,
          explorerUrl: result.explorerUrl,
        };
      } catch (err) {
        console.error("Failed to get NFT metadata:", err);
        setError(
          err instanceof Error ? err.message : "Failed to get NFT metadata"
        );
        return null;
      }
    },
    []
  );

  // Update NFT metadata
  const updateNFTMetadata = useCallback(
    async (
      mint: string,
      data: Partial<NFTMetadataRequest>
    ): Promise<NFTMetadataResponse | null> => {
      try {
        setError(null);

        const result = await backendAPI.updateNFTMetadata(mint, data);
        return result;
      } catch (err) {
        console.error("Failed to update NFT metadata:", err);
        setError(
          err instanceof Error ? err.message : "Failed to update NFT metadata"
        );
        return null;
      }
    },
    []
  );

  // Verify NFT metadata exists
  const verifyNFTMetadata = useCallback(
    async (mint: string): Promise<NFTVerificationResponse | null> => {
      try {
        setError(null);

        const result = await backendAPI.verifyNFTMetadata(mint);
        return result;
      } catch (err) {
        console.error("Failed to verify NFT metadata:", err);
        setError(
          err instanceof Error ? err.message : "Failed to verify NFT metadata"
        );
        return null;
      }
    },
    []
  );

  // Generate NFT preview image
  const generateNFTPreviewImage = useCallback(
    async (data: {
      doci: string;
      ownerName: string;
      title: string;
      publicationDate: string;
    }): Promise<any> => {
      try {
        setError(null);

        const result = await backendAPI.generateNFTPreviewImage(data);
        return result;
      } catch (err) {
        console.error("Failed to generate NFT preview image:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to generate preview image"
        );
        return null;
      }
    },
    []
  );

  // Create academic NFT for published manuscript
  const createAcademicNFT = useCallback(
    async (
      manuscriptData: {
        title: string;
        abstract: string;
        author: string;
        ipfs_hash: string;
        reviewers?: string[];
      },
      mintAddress: string,
      doci: string
    ): Promise<NFTMetadataResponse | null> => {
      try {
        setError(null);

        const nftData: NFTMetadataRequest = {
          mint: mintAddress,
          doci: doci,
          title: manuscriptData.title,
          description: manuscriptData.abstract,
          ipfs_hash: manuscriptData.ipfs_hash,
          author: manuscriptData.author,
          reviewers: manuscriptData.reviewers || [],
          authors_share: 5000, // 50%
          platform_share: 2000, // 20%
          reviewers_share: 3000, // 30%
        };

        const result = await backendAPI.createNFTMetadata(nftData);
        return result;
      } catch (err) {
        console.error("Failed to create academic NFT:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create academic NFT"
        );
        return null;
      }
    },
    []
  );

  // Complete workflow: publish manuscript and create NFT
  const publishManuscriptAndCreateNFT = useCallback(
    async (
      manuscriptId: number,
      mintAddress: string,
      manuscriptData: {
        title: string;
        abstract: string;
        author: string;
        ipfs_hash: string;
        reviewers?: string[];
      },
      publishedBy: string,
      doci: string
    ): Promise<{
      success: boolean;
      publication?: any;
      nft?: NFTMetadataResponse;
      error?: string;
    }> => {
      try {
        setError(null);

        // 1. Publish manuscript
        const publicationResult = await backendAPI.publishManuscript(
          manuscriptId.toString()
        );

        if (!publicationResult?.success) {
          throw new Error("Failed to publish manuscript");
        }

        // 2. Create NFT
        const nftResult = await createAcademicNFT(
          manuscriptData,
          mintAddress,
          doci
        );

        if (!nftResult?.success) {
          throw new Error("Failed to create NFT");
        }

        // 3. Verify NFT creation
        const verified = await verifyNFTMetadata(mintAddress);
        if (!verified?.exists) {
          throw new Error("NFT verification failed");
        }

        return {
          success: true,
          publication: publicationResult,
          nft: nftResult,
        };
      } catch (err) {
        console.error("Failed to publish manuscript and create NFT:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Workflow failed";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
      }
    },
    [createAcademicNFT, verifyNFTMetadata]
  );

  return {
    isLoading,
    error,
    checkNFTHealth,
    createNFTMetadata,
    getNFTMetadata,
    updateNFTMetadata,
    verifyNFTMetadata,
    generateNFTPreviewImage,
    createAcademicNFT,
    publishManuscriptAndCreateNFT,
  };
}
