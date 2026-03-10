"use client";

import { usePrivy as usePrivyOriginal } from "@privy-io/react-auth";

/**
 * Safe wrapper around usePrivy that returns a fallback state
 * when Privy is not configured (no NEXT_PUBLIC_PRIVY_API_KEY).
 */
export function useSafePrivy() {
  const privyConfigured = !!process.env.NEXT_PUBLIC_PRIVY_API_KEY;

  // When Privy is not configured, the PrivyProvider is skipped,
  // so the hook will throw. Return a safe default instead.
  if (!privyConfigured) {
    return {
      authenticated: false,
      ready: true,
      user: null,
      login: async () => {},
      logout: async () => {},
      createWallet: async () => {},
      privyConfigured: false,
    };
  }

  // Privy IS configured — use the real hook
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const privy = usePrivyOriginal();
  return { ...privy, privyConfigured: true };
}
