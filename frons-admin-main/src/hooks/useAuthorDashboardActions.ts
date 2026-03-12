import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function useAuthorDashboardActions() {
  const router = useRouter();

  const navigateToSubmission = useCallback(() => {
    router.push("/submit-manuscript");
  }, [router]);

  const navigateToProfile = useCallback(() => {
    router.push("/your-profile");
  }, [router]);

  const handleRefreshPage = useCallback(() => {
    window.location.reload();
  }, []);

  const handleViewManuscript = useCallback((ipfsUrl: string) => {
    window.open(ipfsUrl, "_blank");
  }, []);

  const handleViewPublication = useCallback((metadataUrl: string) => {
    window.open(metadataUrl, "_blank");
  }, []);

  return {
    navigateToSubmission,
    navigateToProfile,
    handleRefreshPage,
    handleViewManuscript,
    handleViewPublication,
  };
}