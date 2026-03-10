import type { ConnectedWallet } from "@privy-io/react-auth";
import type { ConnectedSolanaWallet } from "@privy-io/react-auth/solana";

/**
 * Get the primary wallet address to use for the application.
 * Prioritizes Privy embedded wallets over external wallets like Phantom.
 * 
 * @param wallets - Array of connected wallets from useSolanaWallets or useWallets
 * @returns The wallet address to use, or undefined if no suitable wallet found
 */
export function getPrimaryWalletAddress(wallets: ConnectedWallet[] | ConnectedSolanaWallet[]): string | undefined {
  if (!wallets || wallets.length === 0) {
    return undefined;
  }

  // First, try to find a Privy embedded wallet
  const privyWallet = wallets.find((wallet) => wallet.walletClientType === "privy");
  if (privyWallet) {
    return privyWallet.address;
  }

  // Fallback to the first available wallet
  return wallets[0]?.address || undefined;
}

/**
 * Get the primary wallet object to use for the application.
 * Prioritizes Privy embedded wallets over external wallets like Phantom.
 * 
 * @param wallets - Array of connected wallets from useSolanaWallets or useWallets
 * @returns The wallet object to use, or null if no suitable wallet found
 */
export function getPrimaryWallet(wallets: ConnectedWallet[] | ConnectedSolanaWallet[]): ConnectedWallet | ConnectedSolanaWallet | null {
  if (!wallets || wallets.length === 0) {
    return null;
  }

  // First, try to find a Privy embedded wallet
  const privyWallet = wallets.find((wallet) => wallet.walletClientType === "privy");
  if (privyWallet) {
    return privyWallet;
  }

  // Fallback to the first available wallet
  return wallets[0] || null;
}

/**
 * Get the primary Solana wallet address to use for the application.
 * Prioritizes Privy embedded wallets over external wallets like Phantom.
 * 
 * @param wallets - Array of connected Solana wallets from useSolanaWallets
 * @returns The wallet address to use, or undefined if no suitable wallet found
 */
export function getPrimarySolanaWalletAddress(wallets: ConnectedSolanaWallet[]): string | undefined {
  if (!wallets || wallets.length === 0) {
    return undefined;
  }

  // First, try to find a Privy embedded wallet
  const privyWallet = wallets.find((wallet) => wallet.walletClientType === "privy");
  if (privyWallet) {
    return privyWallet.address;
  }

  // Fallback to the first available wallet
  return wallets[0]?.address || undefined;
}

/**
 * Get the primary Solana wallet object to use for the application.
 * Prioritizes Privy embedded wallets over external wallets like Phantom.
 * 
 * @param wallets - Array of connected Solana wallets from useSolanaWallets
 * @returns The wallet object to use, or null if no suitable wallet found
 */
export function getPrimarySolanaWallet(wallets: ConnectedSolanaWallet[]): ConnectedSolanaWallet | null {
  if (!wallets || wallets.length === 0) {
    return null;
  }

  // First, try to find a Privy embedded wallet
  const privyWallet = wallets.find((wallet) => wallet.walletClientType === "privy");
  if (privyWallet) {
    return privyWallet;
  }

  // Fallback to the first available wallet
  return wallets[0] || null;
}