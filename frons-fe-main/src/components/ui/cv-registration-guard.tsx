"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCVRegistration } from "@/hooks/useCVRegistration";

interface CVRegistrationGuardProps {
  walletAddress?: string; // Now optional since we can use Privy
  onCVVerified: () => void;
  children: React.ReactNode;
}

interface CVData {
  fullName: string;
  institution: string;
  profession: string;
  field: string;
  specialization: string;
  email: string;
  registeredAt: string;
}

export function CVRegistrationGuard({
  walletAddress,
  onCVVerified,
  children,
}: CVRegistrationGuardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { authenticated } = usePrivy();
  const [hasShownToast, setHasShownToast] = useState(false);

  // Use the CV registration hook - it handles all the API calls
  const {
    checkCVRegistration,
    checkCVRegistrationPrivy,
    cvStatus: hookCvStatus,
    error: hookError,
  } = useCVRegistration(walletAddress);

  // Simple state derived from hook status
  const [localStatus, setLocalStatus] = useState<
    "checking" | "registered" | "not_found" | "error"
  >("checking");

  // Trigger initial check when component mounts
  useEffect(() => {
    const performInitialCheck = async () => {
      if (!authenticated && !walletAddress) {
        setLocalStatus("error");
        return;
      }

      console.log(
        "🔍 CVRegistrationGuard: Initial check for wallet:",
        walletAddress
      );

      try {
        if (authenticated && walletAddress) {
          await checkCVRegistrationPrivy(walletAddress);
        } else if (walletAddress) {
          await checkCVRegistration(walletAddress);
        }
      } catch (err) {
        console.error("Initial CV check failed:", err);
        setLocalStatus("error");
      }
    };

    performInitialCheck();
  }, [
    authenticated,
    checkCVRegistration,
    checkCVRegistrationPrivy,
    walletAddress,
  ]); // Only run once on mount

  // Watch for hook status updates and sync local state
  useEffect(() => {
    if (hookCvStatus) {
      console.log("📊 Hook status changed:", hookCvStatus);

      if (hookCvStatus.hasCV) {
        setLocalStatus("registered");
        onCVVerified();
        console.log("✅ CV verified, showing content");
      } else if (hookCvStatus.success === false) {
        setLocalStatus("not_found");
        console.log("❌ No CV found");
      } else {
        setLocalStatus("checking");
      }
    }
  }, [hookCvStatus, onCVVerified]);

  useEffect(() => {
    if (localStatus === "registered" && !hasShownToast) {
      toast({
        title: "CV Verified!",
        description: "You can now submit manuscripts.",
      });
      setHasShownToast(true);
    }
  }, [localStatus, hasShownToast, toast]);

  useEffect(() => {
    if (
      localStatus === "not_found" &&
      hookCvStatus?.success === false &&
      hookCvStatus?.hasCV === false
    ) {
      console.log("🔄 Redirecting to CV registration page");
      router.push("/register-cv");
    }
  }, [localStatus, router, hookCvStatus]);

  console.log("Local Status:", localStatus, "Hook CV Status:", hookCvStatus);

  if (localStatus === "checking") {
    return <Loading />;
  }

  if (localStatus === "registered") {
    console.log("✅ Rendering children - CV is registered");
    return <div className="space-y-6">{children}</div>;
  }

  if (localStatus === "not_found") {
    return <Loading />;
  }

  if (localStatus === "error") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <AlertCircleIcon className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700">
                {hookError ||
                  "Failed to check CV registration status. Please try again."}
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
