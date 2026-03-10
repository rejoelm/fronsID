"use client";

import { useEffect, Suspense } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Loading } from "@/components/ui/loading";

function RefreshPageContent() {
  const { getAccessToken, authenticated, ready } = usePrivy();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleRefresh = async () => {
      if (!ready) return;

      try {
        const token = await getAccessToken();

        if (token) {
          const redirectUri = searchParams.get("redirect_uri") || "/";
          router.push(redirectUri);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error refreshing session:", error);
        router.push("/");
      }
    };

    handleRefresh();
  }, [ready, getAccessToken, router, searchParams]);

  return <Loading />;
}

export default function RefreshPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RefreshPageContent />
    </Suspense>
  );
}
