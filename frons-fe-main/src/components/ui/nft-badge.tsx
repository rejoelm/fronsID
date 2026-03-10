"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLinkIcon, LoaderIcon } from "lucide-react";
import { useNFTIntegration } from "@/hooks/useNFTIntegration";
import { NFTMetadata } from "@/types/backend";
import { useLoading } from "@/context/LoadingContext";

interface NFTBadgeProps {
  mintAddress: string;
  className?: string;
}

export function NFTBadge({ mintAddress, className = "" }: NFTBadgeProps) {
  const [nftData, setNftData] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const { getNFTMetadata, verifyNFTMetadata } = useNFTIntegration();
  const { isLoading } = useLoading();
  useEffect(() => {
    const fetchNFTData = async () => {
      try {
        setLoading(true);

        // First verify the NFT exists
        const verification = await verifyNFTMetadata(mintAddress);
        if (!verification?.exists) {
          setLoading(false);
          return;
        }

        // Get detailed metadata
        const result = await getNFTMetadata(mintAddress);
        if (result?.success) {
          setNftData(result.metadata);
        }
      } catch (error) {
        console.error("Failed to fetch NFT data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (mintAddress) {
      fetchNFTData();
    }
  }, [mintAddress, getNFTMetadata, verifyNFTMetadata]);

  if (isLoading) {
    return (
      <Badge className={`bg-gray-100 text-gray-600 ${className}`}>
        <LoaderIcon className="h-3 w-3 mr-1 animate-spin" />
        Loading NFT...
      </Badge>
    );
  }

  if (!nftData) {
    return (
      <Badge className={`bg-red-100 text-red-600 ${className}`}>
        NFT not found
      </Badge>
    );
  }

  const getAuthorShare = () => {
    const authorAttr = nftData.attributes.find(
      (a) => a.trait_type === "Authors Share"
    );
    return authorAttr?.value || "Unknown";
  };

  const getDOI = () => {
    const doiAttr = nftData.attributes.find((a) => a.trait_type === "DOI");
    return doiAttr?.value || "N/A";
  };

  const getPublicationDate = () => {
    const dateAttr = nftData.attributes.find(
      (a) => a.trait_type === "Publication Date"
    );
    return dateAttr?.value || "Unknown";
  };

  return (
    <div className={`inline-block ${className}`}>
      <button
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        🎯 Academic NFT
      </button>

      {showDetails && (
        <Card className="absolute z-10 mt-2 w-80 shadow-lg border-purple-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                Academic NFT Details
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">DOI:</span>
                <span className="font-medium">{getDOI()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Author Share:</span>
                <span className="font-medium">{getAuthorShare()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Published:</span>
                <span className="font-medium">{getPublicationDate()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Peer Reviewed:</span>
                <span className="font-medium text-green-600">Yes</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  window.open(
                    `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`,
                    "_blank"
                  )
                }
              >
                <ExternalLinkIcon className="h-3 w-3 mr-1" />
                View on Solana Explorer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
