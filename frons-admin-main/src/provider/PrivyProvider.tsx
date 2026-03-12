"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_API_KEY || "";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Skip Privy when no API key configured — allows build without env vars
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
          logo: "/Logo.png",
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
