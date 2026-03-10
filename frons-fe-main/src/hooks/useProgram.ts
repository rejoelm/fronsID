import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { SOLANA_CONFIG } from "@/lib/constants/solana";
import IDL from "@/lib/constants/fronsciers.json";

export function isValidSolanaAddress(address: string | undefined): boolean {
  if (!address) return false;
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export const useProgram = () => {
  const { wallets } = useWallets();
  const primaryWallet = wallets[0];

  const connection = useMemo(
    () => new Connection(SOLANA_CONFIG.RPC_URL, SOLANA_CONFIG.COMMITMENT),
    []
  );

  const wallet = useMemo(() => {
    if (!primaryWallet) return null;

    return {
      publicKey: isValidSolanaAddress(primaryWallet.address)
        ? new PublicKey(primaryWallet.address)
        : null,
    };
  }, [primaryWallet]);

  const provider = useMemo(() => {
    if (!wallet || !wallet.publicKey) return null;

    return new AnchorProvider(connection, wallet as any, {
      commitment: SOLANA_CONFIG.COMMITMENT,
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(IDL as any, provider);
  }, [provider]);

  return {
    program,
    provider,
    connection,
    wallet,
    publicKey: wallet?.publicKey || null,
    connected: !!wallet?.publicKey,
  };
};
