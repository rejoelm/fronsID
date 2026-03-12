"use client";

import { useEffect, useState } from "react";
import Providers from "@/provider/PrivyProvider";
import { LoadingProvider } from "@/context/LoadingContext";

export default function ConditionalProviders({ children }: { children: React.ReactNode }) {
  const [isCardSubdomain, setIsCardSubdomain] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setIsCardSubdomain(
        hostname.startsWith('card.') || 
        hostname.includes('card.localhost') || 
        hostname === 'card.fronsciers.local'
      );
    }
  }, []);

  // Show loading until we determine the subdomain
  if (isCardSubdomain === null) {
    return <div style={{ opacity: 0 }}>{children}</div>;
  }

  // For card subdomain, don't wrap with any providers
  if (isCardSubdomain) {
    return <>{children}</>;
  }

  // For main domain, wrap with all providers
  return (
    <Providers>
      <LoadingProvider>
        {children}
      </LoadingProvider>
    </Providers>
  );
}