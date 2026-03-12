import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { getPrimarySolanaWalletAddress } from "@/utils/wallet";

export function useWalletConnection() {
  const { authenticated: connected } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  
  const walletAddress = getPrimarySolanaWalletAddress(solanaWallets);

  return {
    connected,
    solanaWallets,
    walletAddress,
  };
}