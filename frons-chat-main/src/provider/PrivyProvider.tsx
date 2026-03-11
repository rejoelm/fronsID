"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clk4v6m200000mh08wuz1n97m"; // Fallback to common dev ID if not set

export default function Providers({ children }: { children: React.ReactNode }) {
  if (!PRIVY_APP_ID) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "wallet", "google"],
        appearance: {
          theme: "light",
          accentColor: "#16007E",
          logo: "https://frons.id/favicon.ico",
          walletChainType: "solana-only",
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
