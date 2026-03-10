"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
  CreditCardIcon,
  ArrowRightIcon,
} from "lucide-react";
import { usePrivy, useSolanaWallets } from "@privy-io/react-auth";
import { Sidebar } from "@/components/ui/sidebar";
import { OverviewSidebar } from "@/components/overview-sidebar";
import { getPrimarySolanaWalletAddress } from "@/utils/wallet";
import { useToast } from "@/hooks/use-toast";

interface PaymentVerificationResponse {
  success: boolean;
  verified: boolean;
  status: string;
  paymentMethod?: string;
  accessGranted: boolean;
  error?: string;
}

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authenticated } = usePrivy();
  const { wallets } = useSolanaWallets();
  const { toast } = useToast();

  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error" | "failed"
  >("loading");
  const [paymentData, setPaymentData] =
    useState<PaymentVerificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const connected = authenticated;
  const publicKey = getPrimarySolanaWalletAddress(wallets);

  // Get transaction ID from URL parameters
  const transactionId =
    searchParams.get("transaction_id") ||
    searchParams.get("transactionId") ||
    searchParams.get("id");
  const status =
    searchParams.get("status") || searchParams.get("payment_status");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!transactionId) {
        setErrorMessage("No transaction ID found in the callback URL.");
        setVerificationStatus("error");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/academic-card-payments/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              transactionId,
              paymentStatus: status || "completed",
              gatewayResponse: Object.fromEntries(searchParams.entries()),
            }),
          }
        );

        const data: PaymentVerificationResponse = await response.json();

        if (data.success && data.verified && data.accessGranted) {
          setPaymentData(data);
          setVerificationStatus("success");

          toast({
            title: "Payment Successful!",
            description: "Your Academic Card access has been activated.",
          });
        } else if (data.success && !data.verified) {
          setPaymentData(data);
          setVerificationStatus("failed");
          setErrorMessage(
            data.error || "Payment verification failed. Please contact support."
          );
        } else {
          setErrorMessage(data.error || "Payment verification failed.");
          setVerificationStatus("error");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setErrorMessage("Unable to verify payment. Please try again.");
        setVerificationStatus("error");
      }
    };

    // Delay verification slightly to ensure the page has loaded
    const timer = setTimeout(verifyPayment, 1000);
    return () => clearTimeout(timer);
  }, [transactionId, status, searchParams, toast]);

  const getUserDisplayName = (user: any) => {
    if (!user) return "User";

    const emailAccount = user.linkedAccounts?.find(
      (account: any) => account.type === "email"
    );

    if (emailAccount?.address) {
      return emailAccount.address.split("@")[0];
    }

    const googleAccount = user.linkedAccounts?.find(
      (account: any) => account.type === "google_oauth"
    );
    if (googleAccount?.email) {
      return googleAccount.email.split("@")[0];
    }

    return "User";
  };

  const handleContinue = () => {
    router.push("/your-profile");
  };

  const handleRetry = () => {
    router.push("/your-profile");
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-white flex w-full justify-center items-center">
        <Sidebar>
          <OverviewSidebar connected={connected} />
        </Sidebar>
        <div className="flex-1">
          <div className="container max-w-full mx-auto py-8 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold text-primary mb-2 text-center">
              Authentication Required
            </h2>
            <p className="text-muted-foreground mb-4 text-sm text-center">
              Please connect your wallet to verify your payment.
            </p>
            <Button
              onClick={() => router.push("/")}
              size="lg"
              className="flex items-center"
            >
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex w-full">
      <div className="hidden lg:block">
        <Sidebar>
          <OverviewSidebar connected={connected} />
        </Sidebar>
      </div>
      <div className="flex-1 w-full">
        <main className="flex-1">
          <div className="container max-w-2xl mx-auto px-4 sm:px-6 py-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Payment Verification
                </h1>
                <p className="text-sm text-gray-500">
                  Processing your Academic Card payment...
                </p>
              </div>

              {/* Verification Card */}
              <Card className="border border-gray-200">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    {verificationStatus === "loading" && (
                      <LoaderIcon className="h-12 w-12 text-blue-500 animate-spin" />
                    )}
                    {verificationStatus === "success" && (
                      <CheckCircleIcon className="h-12 w-12 text-green-500" />
                    )}
                    {(verificationStatus === "error" ||
                      verificationStatus === "failed") && (
                      <XCircleIcon className="h-12 w-12 text-red-500" />
                    )}
                  </div>

                  <CardTitle className="text-lg">
                    {verificationStatus === "loading" && "Verifying Payment..."}
                    {verificationStatus === "success" && "Payment Successful!"}
                    {verificationStatus === "failed" && "Payment Failed"}
                    {verificationStatus === "error" && "Verification Error"}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {verificationStatus === "loading" && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-4">
                        Please wait while we verify your payment with Mayar...
                      </p>
                      {transactionId && (
                        <p className="text-xs text-gray-400">
                          Transaction ID: {transactionId}
                        </p>
                      )}
                    </div>
                  )}

                  {verificationStatus === "success" && paymentData && (
                    <div className="space-y-4">
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          Welcome to Fronsciers Academic Card! Your payment has
                          been processed successfully.
                        </AlertDescription>
                      </Alert>

                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">User:</span>
                          <span className="font-medium">
                            {getUserDisplayName(user)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium text-green-600">
                            Active
                          </span>
                        </div>
                        {paymentData.paymentMethod && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              Payment Method:
                            </span>
                            <span className="font-medium">
                              {paymentData.paymentMethod}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-medium">IDR 225,000</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900">
                          What&apos;s Next?
                        </h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Access exclusive academic content</li>
                          <li>• View your Academic Card in your profile</li>
                          <li>• Enjoy premium platform features</li>
                        </ul>
                      </div>

                      <Button
                        onClick={handleContinue}
                        className="w-full"
                        size="lg"
                      >
                        View My Profile
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {(verificationStatus === "failed" ||
                    verificationStatus === "error") && (
                    <div className="space-y-4">
                      <Alert className="border-red-200 bg-red-50">
                        <XCircleIcon className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">
                          {errorMessage ||
                            "There was an issue processing your payment."}
                        </AlertDescription>
                      </Alert>

                      {transactionId && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              Transaction ID:
                            </span>
                            <span className="font-mono text-xs">
                              {transactionId}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900">
                          Need Help?
                        </h3>
                        <p className="text-sm text-gray-600">
                          If you believe this is an error, please contact
                          support with your transaction ID.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleRetry}
                          variant="outline"
                          className="flex-1"
                        >
                          Back to Profile
                        </Button>
                        <Button
                          onClick={() => router.push("/support")}
                          className="flex-1"
                        >
                          Contact Support
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Info */}
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  This page will automatically redirect you after verification.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex w-full justify-center items-center">
          <div className="flex flex-col items-center space-y-4">
            <LoaderIcon className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-600">Loading payment verification...</p>
          </div>
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
