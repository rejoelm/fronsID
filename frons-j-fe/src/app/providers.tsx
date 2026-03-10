"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clyt3xw9z0044r7015v80m0vw"}
      config={{
        loginMethods: ["email", "wallet", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#3b82f6", // tailwind blue-500
          logo: "https://cryptologos.cc/logos/solana-sol-logo.png",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets", // Automatically create a Solana wallet
          }
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
