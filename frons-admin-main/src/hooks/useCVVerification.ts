import { useState, useEffect, useCallback } from "react";
import { useCVRegistration } from "./useCVRegistration";
import { useToast } from "./use-toast";
import { useRouter } from "next/navigation";

interface UseCVVerificationProps {
  walletAddress?: string;
  connected: boolean;
  authenticated: boolean;
}

export function useCVVerification({
  walletAddress,
  connected,
  authenticated,
}: UseCVVerificationProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { checkCVRegistration, checkCVRegistrationPrivy, cvStatus } =
    useCVRegistration(walletAddress);

  const [cvVerified, setCvVerified] = useState(false);
  const [cvChecking, setCvChecking] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );

  const handleCVVerified = useCallback(() => {
    setCvVerified(true);
  }, []);

  // Main CV verification logic
  const performCVCheck = useCallback(async () => {
    if (!connected || !walletAddress) {
      setCvChecking(false);
      return false;
    }

    try {
      setCvChecking(true);
      setVerificationError(null);
      console.log("🔍 Checking CV status for wallet:", walletAddress);

      let hasCV = false;

      // Try Privy auth first, then fallback to wallet-based check
      if (authenticated) {
        hasCV = await checkCVRegistrationPrivy(walletAddress);
      } else {
        hasCV = await checkCVRegistration(walletAddress);
      }

      // Check the detailed CV status from hook
      if (cvStatus?.hasCV) {
        console.log("✅ CV found in database, allowing access");
        setCvVerified(true);
        handleCVVerified();
        return true;
      } else if (cvStatus?.success === false && cvStatus?.hasCV === false) {
        console.log("❌ No CV found, redirecting to registration");

        router.push("/register-cv");
        return false;
      } else if (hasCV) {
        console.log("✅ CV check passed (fallback), allowing access");
        setCvVerified(true);
        handleCVVerified();
        return true;
      } else {
        console.log("❌ CV verification failed, redirecting to registration");

        router.push("/register-cv");
        return false;
      }
    } catch (err) {
      console.error("CV check failed:", err);
      const errorMsg = "Failed to verify CV status. Please try again.";
      setVerificationError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      router.push("/register-cv");
      return false;
    } finally {
      setCvChecking(false);
    }
  }, [
    connected,
    walletAddress,
    authenticated,
    checkCVRegistrationPrivy,
    checkCVRegistration,
    cvStatus,
    handleCVVerified,
    toast,
    router,
  ]);

  // Initial CV check when component mounts
  useEffect(() => {
    if (connected && walletAddress && cvChecking) {
      performCVCheck();
    }
  }, [connected, walletAddress, authenticated, cvChecking, performCVCheck]);

  // Watch for CV status changes from the hook
  useEffect(() => {
    if (cvStatus) {
      console.log("📊 CV Status updated from hook:", cvStatus);

      if (cvStatus.hasCV && !cvVerified) {
        console.log("✅ CV found via hook update, allowing access");
        setCvVerified(true);
        handleCVVerified();
        setCvChecking(false);
      }
    }
  }, [cvStatus, cvVerified, handleCVVerified]);

  return {
    cvVerified,
    cvChecking,
    verificationError,
    performCVCheck,
    handleCVVerified,
  };
}
