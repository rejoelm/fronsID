import { useState, useCallback } from "react";
import { Transaction, PublicKey } from "@solana/web3.js";
import { usePrivy } from "@privy-io/react-auth";
import axios from "axios";

export enum TransactionType {
  MANUSCRIPT_SUBMISSION = "manuscript_submission",
  REVIEW_REWARD = "review_reward",
  AUTHOR_REWARD = "author_reward",
  DOCI_MINTING = "doci_minting",
  ESCROW_OPERATION = "escrow_operation",
}

interface SponsorshipResult {
  success: boolean;
  signature?: string;
  gasUsed?: number;
  error?: string;
  explorerUrl?: string;
}

interface UseGasSponsorshipProps {
  walletAddress?: string;
}

export function useGasSponsorship({ walletAddress }: UseGasSponsorshipProps) {
  const [isSponsoring, setIsSponsoring] = useState(false);
  const [sponsorshipError, setSponsorshipError] = useState<string | null>(null);
  const { authenticated, getAccessToken } = usePrivy();

  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";

  const sponsorTransaction = useCallback(
    async (
      transaction: Transaction,
      transactionType: TransactionType,
      metadata?: Record<string, any>
    ): Promise<SponsorshipResult> => {

      if (!authenticated || !walletAddress) {
        const error = `User must be authenticated with a wallet. authenticated=${authenticated}, walletAddress=${walletAddress}`;
        throw new Error(error);
      }
      setIsSponsoring(true);
      setSponsorshipError(null);

      try {

        const accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error("Failed to get authentication token");
        }

        let serializedTransaction;
        try {
          serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          });
        } catch (serializeError) {
          throw new Error(
            `Transaction serialization failed: ${
              serializeError instanceof Error
                ? serializeError.message
                : "Unknown error"
            }`
          );
        }

        const base64Transaction = Buffer.from(serializedTransaction).toString(
          "base64"
        );

        const { data: responseData } = await axios.post(
          `${apiUrl}/transactions/sponsor-gas`,
          {
            serializedTransaction: base64Transaction,
            transactionType,
            userWallet: walletAddress,
            metadata,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!responseData.success) {
          throw new Error(responseData.error || "Gas sponsorship failed");
        }

        return {
          success: true,
          signature: responseData.signature,
          gasUsed: responseData.gasUsed,
          explorerUrl: responseData.explorerUrl,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Gas sponsorship failed";
        setSponsorshipError(errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsSponsoring(false);
      }
    },
    [authenticated, walletAddress, apiUrl, getAccessToken]
  );

  const prepareAndSponsorTransaction = useCallback(
    async (
      instructions: any[],
      transactionType: TransactionType,
      userPublicKey: PublicKey,
      metadata?: Record<string, any>
    ): Promise<SponsorshipResult> => {
      try {
        const feePayerResponse = await fetch(
          `${apiUrl}/transactions/fee-payer-public-key`
        );

        if (!feePayerResponse.ok) {
          const errorText = await feePayerResponse.text();
          throw new Error(
            `Failed to fetch fee payer public key: ${feePayerResponse.status} ${errorText}`
          );
        }

        const feePayerData = await feePayerResponse.json();

        if (!feePayerData.success) {
          throw new Error(
            feePayerData.error || "Failed to get fee payer public key"
          );
        }

        const feePayerPublicKey = new PublicKey(feePayerData.feePayerPublicKey);

        const transaction = new Transaction();
        transaction.add(...instructions);
        transaction.feePayer = feePayerPublicKey;

        return await sponsorTransaction(transaction, transactionType, metadata);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Transaction preparation failed";
        setSponsorshipError(errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [sponsorTransaction, apiUrl]
  );

  const checkSponsorshipHealth = useCallback(async (): Promise<{
    isHealthy: boolean;
    feePayerBalance?: number;
    status?: string;
    error?: string;
  }> => {
    try {
      const { data } = await axios.get(`${apiUrl}/transactions/health`);

      return {
        isHealthy: data.status === "healthy",
        feePayerBalance: data.feePayerBalance,
        status: data.status,
      };
    } catch (error) {
      return {
        isHealthy: false,
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }, [apiUrl]);

  const getSponsorshipStats = useCallback(async (): Promise<{
    success: boolean;
    stats?: {
      feePayerBalance: number;
      totalTransactionsSponsored: number;
      totalGasUsed: number;
      status: string;
    };
    error?: string;
  }> => {
    if (!authenticated) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Failed to get authentication token");
      }

      const { data } = await axios.get(`${apiUrl}/transactions/stats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        success: true,
        stats: data.stats,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get statistics",
      };
    }
  }, [authenticated, getAccessToken, apiUrl]);

  return {
    isSponsoring,
    sponsorshipError,
    sponsorTransaction,
    prepareAndSponsorTransaction,
    checkSponsorshipHealth,
    getSponsorshipStats,
  };
}
