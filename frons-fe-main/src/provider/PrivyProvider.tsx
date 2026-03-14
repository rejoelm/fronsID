"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_API_KEY || "";

export default function Providers({ children }: { children: React.ReactNode }) {
  if (!PRIVY_APP_ID) {
    console.error("FATAL: NEXT_PUBLIC_PRIVY_API_KEY is not configured. Authentication is disabled.");
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'monospace' }}>
        <p>Authentication not configured. Set NEXT_PUBLIC_PRIVY_API_KEY environment variable.</p>
      </div>
    );
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
