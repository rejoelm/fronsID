import { useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useProgram } from "./useProgram";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export interface PrivyUserRegistrationData {
  privyUserId: string;
  education: string;
  academicEmail: string;
  institution: string;
  validation: {
    userId: string;
    email: string;
    signature: string;
    timestamp: BN;
    cvHash: string;
  };
}

export interface CVVerificationData {
  cvHash: string;
  publishedPapers: number;
  backendSignature: string;
}

export function useSmartContractIntegration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticated, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const { program, publicKey, connected } = useProgram();

  const primaryWallet = wallets[0];

  // Register a new Privy user in the smart contract
  const registerPrivyUser = useCallback(
    async (userData: PrivyUserRegistrationData): Promise<boolean> => {
      if (!program || !primaryWallet || !publicKey) {
        setError("Smart contract connection required");
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        // Derive user PDA using embedded wallet address
        const [userPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("user"), publicKey.toBuffer()],
          program.programId
        );


        const tx = await program.methods
          .registerPrivyUser(
            userData.privyUserId,
            userData.education,
            userData.academicEmail,
            userData.institution,
            userData.validation
          )
          .accounts({
            user: userPda,
            embeddedWallet: publicKey,
            payer: publicKey, // Using embedded wallet as payer
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return true;
      } catch (err: any) {
        setError(err.message || "Failed to register Privy user");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [program, primaryWallet, publicKey]
  );

  // Migrate legacy user to Privy
  const migrateToPrivy = useCallback(
    async (
      legacyWallet: PublicKey,
      userData: PrivyUserRegistrationData
    ): Promise<boolean> => {
      if (!program || !primaryWallet) {
        setError("Smart contract connection required");
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        // Derive user PDA using legacy wallet address
        const [userPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("user"), legacyWallet.toBuffer()],
          program.programId
        );

        const tx = await program.methods
          .migrateToPrivy(
            userData.privyUserId,
            publicKey!, // embedded wallet
            userData.academicEmail,
            userData.institution,
            userData.validation
          )
          .accounts({
            user: userPda,
            legacyWallet: legacyWallet,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return true;
      } catch (err: any) {
        setError(err.message || "Failed to migrate to Privy");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [program, primaryWallet, publicKey]
  );

  // Verify CV on-chain
  const verifyCv = useCallback(
    async (cvData: CVVerificationData): Promise<boolean> => {
      if (!program || !primaryWallet || !publicKey) {
        setError("Smart contract connection required");
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        // Derive user PDA
        const [userPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("user"), publicKey.toBuffer()],
          program.programId
        );

        const tx = await program.methods
          .verifyCv(
            cvData.cvHash,
            cvData.publishedPapers,
            cvData.backendSignature
          )
          .accounts({
            user: userPda,
            userWallet: publicKey,
            backendAuthority: publicKey, // For now using same wallet
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return true;
      } catch (err: any) {
        setError(err.message || "Failed to verify CV");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [program, primaryWallet, publicKey]
  );

  // Submit manuscript on-chain
  const submitManuscript = useCallback(
    async (ipfsHash: string): Promise<string | null> => {
      if (!program || !primaryWallet || !publicKey) {
        setError("Smart contract connection required");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Derive user PDA
        const [userPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("user"), publicKey.toBuffer()],
          program.programId
        );

        // Derive escrow PDA
        const [escrowPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("escrow")],
          program.programId
        );

        // Create a new keypair for the manuscript
        const manuscriptKeypair = new (
          await import("@solana/web3.js")
        ).Keypair();

        const tx = await program.methods
          .submitManuscript(ipfsHash)
          .accounts({
            manuscript: manuscriptKeypair.publicKey,
            user: userPda,
            author: publicKey,
            authorUsdAccount: publicKey, // Placeholder - would need proper token account
            escrowUsdAccount: publicKey, // Placeholder - would need proper token account
            escrow: escrowPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([manuscriptKeypair])
          .rpc();

        return tx;
      } catch (err: any) {
        setError(err.message || "Failed to submit manuscript");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, primaryWallet, publicKey]
  );

  // Check if user meets submission requirements
  const checkSubmissionRequirements =
    useCallback(async (): Promise<boolean> => {
      if (!program || !publicKey) {
        return false;
      }

      try {
        // Derive user PDA
        const [userPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("user"), publicKey.toBuffer()],
          program.programId
        );

        const programAccount = program.account as any;
        if (!programAccount.user) {
          return false;
        }
        const userAccount = await programAccount.user.fetch(userPda);

        // Check submission requirements based on smart contract logic
        const hasValidEducation = [
          "PhD",
          "Master",
          "Bachelor",
          "Doctorate",
        ].includes(userAccount.education);
        const hasCvVerified = userAccount.cvVerified;
        const hasEnoughPapers = userAccount.publishedPapers > 2;

        return hasValidEducation && hasCvVerified && hasEnoughPapers;
      } catch (err) {
        return false;
      }
    }, [program, publicKey]);

  // Get user account data
  const getUserAccount = useCallback(async (): Promise<any | null> => {
    if (!program || !publicKey) {
      return null;
    }

    try {
      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), publicKey.toBuffer()],
        program.programId
      );

      const programAccount = program.account as any;
      if (!programAccount.user) {
        return null;
      }
      const userAccount = await programAccount.user.fetch(userPda);
      return userAccount;
    } catch (err) {
      return null;
    }
  }, [program, publicKey]);

  return {
    loading,
    error,
    connected,
    registerPrivyUser,
    migrateToPrivy,
    verifyCv,
    submitManuscript,
    checkSubmissionRequirements,
    getUserAccount,
  };
}
