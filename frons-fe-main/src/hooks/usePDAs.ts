import { useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import { SOLANA_CONFIG, PDA_SEEDS } from "@/lib/constants/solana";
import { useProgram } from "./useProgram";

export const usePDAs = (userWallet?: PublicKey) => {
  const { program } = useProgram();

  const pdas = useMemo(() => {
    if (!userWallet || !program) return null;

    const programId = new PublicKey(SOLANA_CONFIG.PROGRAM_ID);

    // User PDA: [b"user", user_wallet.key()]
    const [userPDA, userBump] = PublicKey.findProgramAddressSync(
      [Buffer.from(PDA_SEEDS.USER), userWallet.toBuffer()],
      programId
    );

    // Escrow PDA: [b"escrow"] (global escrow, no user-specific seed)
    const [escrowPDA, escrowBump] = PublicKey.findProgramAddressSync(
      [Buffer.from(PDA_SEEDS.ESCROW)],
      programId
    );

    // DOCI Registry PDA: [b"doci_registry"] (global registry)
    const [dociRegistryPDA, dociRegistryBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from(PDA_SEEDS.DOCI_REGISTRY)],
        programId
      );

    return {
      user: { address: userPDA, bump: userBump },
      escrow: { address: escrowPDA, bump: escrowBump },
      dociRegistry: { address: dociRegistryPDA, bump: dociRegistryBump },
    };
  }, [userWallet, program]);

  // Generate DOCI manuscript PDA: [b"doci_manuscript", manuscript_account.key()]
  const getDOCIManuscriptPDA = (manuscriptAccount: PublicKey) => {
    if (!program) return null;
    const programId = new PublicKey(SOLANA_CONFIG.PROGRAM_ID);
    const [dociPDA, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from(PDA_SEEDS.DOCI_MANUSCRIPT), manuscriptAccount.toBuffer()],
      programId
    );
    return { address: dociPDA, bump };
  };

  // Helper to get token account PDAs
  const getAssociatedTokenAddress = async (
    mint: PublicKey,
    owner: PublicKey
  ) => {
    const { getAssociatedTokenAddress } = await import("@solana/spl-token");
    return await getAssociatedTokenAddress(mint, owner);
  };

  return {
    pdas,
    getDOCIManuscriptPDA,
    getAssociatedTokenAddress,
  };
};
