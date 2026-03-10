import { useState, useCallback } from "react";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { useProgram } from "./useProgram";
import { usePDAs } from "./usePDAs";
import { ManuscriptSubmission } from "@/types/fronsciers";
import {
  SOLANA_CONFIG,
  CONTRACT_CONSTANTS,
  PROGRAM_ERRORS,
  DEVNET_USDCF_ADDRESS,
  DEVNET_FRONS_ADDRESS,
} from "@/lib/constants/solana";
import { useLoading } from "@/context/LoadingContext";

export const useManuscriptWorkflow = () => {
  const { program, wallet, connection } = useProgram();
  const { pdas, getDOCIManuscriptPDA, getAssociatedTokenAddress } = usePDAs(
    wallet?.publicKey || undefined
  );
  const { isLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle Solana errors
  const handleSolanaError = (error: any) => {
    console.error("Solana error:", error);
    let errorMessage = "Transaction failed";

    if (error?.error?.errorMessage) {
      errorMessage = error.error.errorMessage;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    // Handle specific program errors
    if (errorMessage.includes("SubmissionRequirementsNotMet")) {
      setError(PROGRAM_ERRORS.SUBMISSION_REQUIREMENTS_NOT_MET);
    } else if (errorMessage.includes("InvalidEducationLevel")) {
      setError(PROGRAM_ERRORS.INVALID_EDUCATION_LEVEL);
    } else if (errorMessage.includes("InsufficientPublishedPapers")) {
      setError(PROGRAM_ERRORS.INSUFFICIENT_PUBLISHED_PAPERS);
    } else if (errorMessage.includes("InvalidDecision")) {
      setError(PROGRAM_ERRORS.INVALID_DECISION);
    } else if (errorMessage.includes("MissingIpfsHash")) {
      setError(PROGRAM_ERRORS.MISSING_IPFS_HASH);
    } else if (errorMessage.includes("ReviewerAlreadyAdded")) {
      setError(PROGRAM_ERRORS.REVIEWER_ALREADY_ADDED);
    } else if (errorMessage.includes("ManuscriptNotPending")) {
      setError(PROGRAM_ERRORS.MANUSCRIPT_NOT_PENDING);
    } else if (errorMessage.includes("ManuscriptNotAccepted")) {
      setError(PROGRAM_ERRORS.MANUSCRIPT_NOT_ACCEPTED);
    } else if (errorMessage.includes("insufficient funds")) {
      setError("Insufficient SOL balance for transaction");
    } else if (errorMessage.includes("user rejected")) {
      setError("Transaction was rejected by user");
    } else {
      setError(errorMessage);
    }
  };

  // Register user
  const registerUser = useCallback(
    async (education: string, publishedPapers: number = 0) => {
      if (!program || !wallet?.publicKey || !pdas) {
        throw new Error("Wallet not connected or program not available");
      }

      try {
        setError(null);
        console.log("Registering user with education:", education);

        const tx = await program.methods
          .registerUser(education, publishedPapers)
          .accounts({
            user: pdas.user.address,
            wallet: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log("✅ User registered successfully:", tx);
        return { signature: tx, userPDA: pdas.user.address };
      } catch (error) {
        handleSolanaError(error);
        throw error;
      }
    },
    [program, wallet, pdas]
  );

  // Submit manuscript
  const submitManuscript = useCallback(
    async (submission: ManuscriptSubmission) => {
      if (!program || !wallet?.publicKey || !pdas) {
        throw new Error("Wallet not connected or program not available");
      }

      try {
        setError(null);
        console.log("Submitting manuscript:", submission);

        // Create manuscript keypair
        const manuscriptKeypair = Keypair.generate();

        // Get token mints
        const usdMint = new PublicKey(DEVNET_USDCF_ADDRESS);
        const fronsMint = new PublicKey(DEVNET_FRONS_ADDRESS);

        // Get or create associated token accounts
        const authorUsdAccount = await getAssociatedTokenAddress(
          usdMint,
          wallet.publicKey
        );
        const escrowUsdAccount = await getAssociatedTokenAddress(
          usdMint,
          pdas.escrow.address
        );

        // Check if accounts exist and create instructions if needed
        const transaction = new Transaction();

        try {
          await connection.getAccountInfo(authorUsdAccount);
        } catch {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              wallet.publicKey,
              authorUsdAccount,
              wallet.publicKey,
              usdMint
            )
          );
        }

        try {
          await connection.getAccountInfo(escrowUsdAccount);
        } catch {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              wallet.publicKey,
              escrowUsdAccount,
              pdas.escrow.address,
              usdMint
            )
          );
        }

        // Add submit manuscript instruction
        const submitInstruction = await program.methods
          .submitManuscript(submission.ipfsHash)
          .accounts({
            manuscript: manuscriptKeypair.publicKey,
            user: pdas.user.address,
            author: wallet.publicKey,
            authorUsdAccount,
            escrowUsdAccount,
            escrow: pdas.escrow.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([manuscriptKeypair])
          .instruction();

        transaction.add(submitInstruction);

        // Sign and send transaction
        if (!program.provider?.sendAndConfirm) {
          throw new Error("Provider not available");
        }
        const tx = await program.provider.sendAndConfirm(transaction, [
          manuscriptKeypair,
        ]);

        console.log("✅ Manuscript submitted successfully:", tx);
        return {
          signature: tx,
          manuscriptPDA: manuscriptKeypair.publicKey,
          manuscriptKeypair,
        };
      } catch (error) {
        handleSolanaError(error);
        throw error;
      }
    },
    [program, wallet, pdas, connection, getAssociatedTokenAddress]
  );

  // Review manuscript
  const reviewManuscript = useCallback(
    async (
      manuscriptPDA: PublicKey,
      decision: string,
      manuscriptAuthor: PublicKey
    ) => {
      if (!program || !wallet?.publicKey || !pdas) {
        throw new Error("Wallet not connected or program not available");
      }

      try {
        setError(null);
        console.log(
          "Reviewing manuscript:",
          manuscriptPDA.toString(),
          "Decision:",
          decision
        );

        // Get token mints
        const usdMint = new PublicKey(DEVNET_USDCF_ADDRESS);
        const fronsMint = new PublicKey(DEVNET_FRONS_ADDRESS);

        // Get associated token accounts
        const escrowUsdAccount = await getAssociatedTokenAddress(
          usdMint,
          pdas.escrow.address
        );
        const authorUsdAccount = await getAssociatedTokenAddress(
          usdMint,
          manuscriptAuthor
        );
        const platformUsdAccount = await getAssociatedTokenAddress(
          usdMint,
          new PublicKey("11111111111111111111111111111111") // Placeholder platform account
        );
        const escrowFronsAccount = await getAssociatedTokenAddress(
          fronsMint,
          pdas.escrow.address
        );

        // Get author user PDA
        const [authorUserPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("user"), manuscriptAuthor.toBuffer()],
          new PublicKey(SOLANA_CONFIG.PROGRAM_ID)
        );

        const tx = await program.methods
          .reviewManuscript(decision)
          .accounts({
            manuscript: manuscriptPDA,
            reviewer: wallet.publicKey,
            author: authorUserPDA,
            escrowUsdAccount,
            authorUsdAccount,
            platformUsdAccount,
            fronsMint,
            escrow: pdas.escrow.address,
            escrowTokenAccount: escrowFronsAccount,
            reviewerEscrowTokenAccount: escrowFronsAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();

        console.log(
          `✅ Manuscript ${decision.toLowerCase()} successfully:`,
          tx
        );
        return { signature: tx };
      } catch (error) {
        handleSolanaError(error);
        throw error;
      }
    },
    [program, wallet, pdas, getAssociatedTokenAddress]
  );

  // Mint DOCI NFT
  const mintDOCINFT = useCallback(
    async (manuscriptPDA: PublicKey, title: string, description: string) => {
      if (!program || !wallet?.publicKey || !pdas) {
        throw new Error("Wallet not connected or program not available");
      }

      try {
        setError(null);
        console.log(
          "Minting DOCI NFT for manuscript:",
          manuscriptPDA.toString()
        );

        // Generate DOCI manuscript PDA
        const dociManuscriptPDA = getDOCIManuscriptPDA(manuscriptPDA);
        if (!dociManuscriptPDA) {
          throw new Error("Failed to generate DOCI manuscript PDA");
        }

        // Create NFT mint keypair
        const dociMintKeypair = Keypair.generate();

        // Get author's NFT token account
        const authorNftTokenAccount = await getAssociatedTokenAddress(
          dociMintKeypair.publicKey,
          wallet.publicKey
        );

        const tx = await program.methods
          .mintDociNft(title, description)
          .accounts({
            manuscript: manuscriptPDA,
            dociRegistry: pdas.dociRegistry.address,
            dociManuscript: dociManuscriptPDA.address,
            dociMint: dociMintKeypair.publicKey,
            author: wallet.publicKey,
            authorTokenAccount: authorNftTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([dociMintKeypair])
          .rpc();

        console.log("✅ DOCI NFT minted successfully:", tx);
        return {
          signature: tx,
          mintAddress: dociMintKeypair.publicKey,
          dociManuscriptPDA: dociManuscriptPDA.address,
        };
      } catch (error) {
        handleSolanaError(error);
        throw error;
      }
    },
    [program, wallet, pdas, getDOCIManuscriptPDA, getAssociatedTokenAddress]
  );

  // Get manuscript account data
  const getManuscript = useCallback(
    async (manuscriptPDA: PublicKey) => {
      if (!program) return null;
      try {
        // TODO: Fix account type mismatch between IDL and TypeScript
        return await (program.account as any).dociManuscript.fetch(
          manuscriptPDA
        );
      } catch (error) {
        console.error("Error fetching manuscript:", error);
        return null;
      }
    },
    [program]
  );

  // Get user account data
  const getUser = useCallback(
    async (userPDA: PublicKey) => {
      if (!program) return null;
      try {
        // TODO: Fix account type mismatch between IDL and TypeScript
        return await (program.account as any).user.fetch(userPDA);
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
    [program]
  );

  // Get DOCI manuscript data
  const getDOCIManuscript = useCallback(
    async (dociManuscriptPDA: PublicKey) => {
      if (!program) return null;
      try {
        // Use the correct account accessor based on the IDL
        const programAccount = program.account as any;
        if (programAccount.dociManuscript) {
          return await programAccount.dociManuscript.fetch(dociManuscriptPDA);
        } else {
          console.warn("dociManuscript account not found in program");
          return null;
        }
      } catch (error) {
        console.error("Error fetching DOCI manuscript:", error);
        return null;
      }
    },
    [program]
  );

  // Get token balance
  const getTokenBalance = useCallback(
    async (mint: PublicKey, owner: PublicKey) => {
      if (!connection) return 0;
      try {
        const tokenAccount = await getAssociatedTokenAddress(mint, owner);
        const accountInfo = await connection.getTokenAccountBalance(
          tokenAccount
        );
        return accountInfo.value.uiAmount || 0;
      } catch (error) {
        console.error("Error fetching token balance:", error);
        return 0;
      }
    },
    [connection, getAssociatedTokenAddress]
  );

  return {
    // Core functions
    registerUser,
    submitManuscript,
    reviewManuscript,
    mintDOCINFT,

    // Data fetching
    getManuscript,
    getUser,
    getDOCIManuscript,
    getTokenBalance,

    // State
    isLoading,
    error,
  };
};
