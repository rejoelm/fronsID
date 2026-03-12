import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { isValidSolanaAddress } from "@/hooks/useProgram";
import { getPrimarySolanaWalletAddress } from "@/utils/wallet";

export function useAuthorWallet() {
  const { authenticated: connected } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  
  const publicKey = getPrimarySolanaWalletAddress(solanaWallets);
  const validSolanaPublicKey = isValidSolanaAddress(publicKey) ? publicKey : undefined;
  const isWalletConnected = connected && !!validSolanaPublicKey;

  return {
    connected,
    publicKey,
    validSolanaPublicKey,
    isWalletConnected,
  };
}