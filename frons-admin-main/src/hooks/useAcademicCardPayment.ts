import { useState, useCallback, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import axios from "axios";

interface PaymentStatusResponse {
  success: boolean;
  hasAccess: boolean;
  paymentId?: number;
  purchasedAt?: string;
  paymentAmount?: number;
  paymentStatus?: string;
  error?: string;
}

interface InitiatePaymentResponse {
  success: boolean;
  paymentId?: number;
  transactionId?: string;
  paymentUrl?: string;
  amount?: number;
  currency?: string;
  expiresAt?: string;
  error?: string;
  hasAccess?: boolean;
}

interface VerifyPaymentResponse {
  success: boolean;
  verified?: boolean;
  status?: string;
  paymentMethod?: string;
  accessGranted?: boolean;
  error?: string;
}

export function useAcademicCardPayment() {
  const { user } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatusResponse | null>(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";

  const apiClient = useMemo(
    () =>
      axios.create({
        baseURL: apiBaseUrl,
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    [apiBaseUrl]
  );

  // Check if user has access to Academic Card
  const checkPaymentStatus =
    useCallback(async (): Promise<PaymentStatusResponse> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!user) {
          throw new Error("User not authenticated");
        }

        // Use user ID as identifier
        const identifier = user.id;

        const response = await apiClient.get(
          `/academic-card-payments/status/${identifier}`,
          {
            headers: {
              Authorization: `Bearer ${user.id}`,
            },
          }
        );

        const data = response.data;
        setPaymentStatus(data);
        return data;
      } catch (err) {
        let errorMessage = "Failed to check payment status";

        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.error || err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        return {
          success: false,
          hasAccess: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    }, [user, apiClient]);

  // Initiate payment for Academic Card
  const initiatePayment = useCallback(
    async (
      amount: number = 225000,
      callbackUrl?: string,
      shippingAddress?: any
    ): Promise<InitiatePaymentResponse> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!user) {
          throw new Error("User not authenticated");
        }

        const requestBody = {
          privyUserId: user.id,
          amount,
          callbackUrl:
            callbackUrl || `${window.location.origin}/payment-callback`,
          ...(shippingAddress && { shippingAddress }),
        };

        console.log("🎯 Initiating payment request:", requestBody);

        const response = await apiClient.post(
          "/academic-card-payments/initiate",
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${user.id}`,
            },
          }
        );

        const data = response.data;

        if (!data.success) {
          throw new Error(data.error || "Failed to initiate payment");
        }

        console.log("✅ Payment initiated successfully:", data);
        return data;
      } catch (err) {
        let errorMessage = "Failed to initiate payment";

        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.error || err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        console.error("❌ Payment initiation error:", err);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [user, apiClient]
  );

  // Verify payment completion
  const verifyPayment = useCallback(
    async (
      transactionId: string,
      paymentStatus?: string,
      gatewayResponse?: any
    ): Promise<VerifyPaymentResponse> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!user) {
          throw new Error("User not authenticated");
        }

        const requestBody = {
          transactionId,
          paymentStatus: paymentStatus || "completed",
          gatewayResponse,
        };

        console.log("🔍 Verifying payment:", requestBody);

        const response = await apiClient.post(
          "/academic-card-payments/verify",
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${user.id}`,
            },
          }
        );

        const data = response.data;

        if (!data.success) {
          throw new Error(data.error || "Payment verification failed");
        }

        console.log("✅ Payment verified successfully:", data);

        // Refresh payment status if payment was successful
        if (data.verified && data.accessGranted) {
          await checkPaymentStatus();
        }

        return data;
      } catch (err) {
        let errorMessage = "Payment verification failed";

        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.error || err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        console.error("❌ Payment verification error:", err);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [user, apiClient, checkPaymentStatus]
  );

  // Handle payment redirect/callback
  const handlePaymentCallback = useCallback(
    async (transactionId: string, status?: string): Promise<boolean> => {
      try {
        console.log("🔄 Processing payment callback:", {
          transactionId,
          status,
        });

        const verificationResult = await verifyPayment(transactionId, status);

        if (verificationResult.success && verificationResult.verified) {
          console.log("✅ Payment callback processed successfully");
          return true;
        }

        console.log(
          "❌ Payment callback processing failed:",
          verificationResult.error
        );
        return false;
      } catch (err) {
        console.error("❌ Payment callback error:", err);
        return false;
      }
    },
    [verifyPayment]
  );

  // Format currency for display
  const formatCurrency = useCallback(
    (amount: number, currency: string = "IDR"): string => {
      if (currency === "IDR") {
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(amount);
      }

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(amount);
    },
    []
  );

  return {
    isLoading,
    error,
    paymentStatus,

    checkPaymentStatus,
    initiatePayment,
    verifyPayment,
    handlePaymentCallback,

    formatCurrency,

    hasAccess: paymentStatus?.hasAccess || false,
    isPaymentPending: paymentStatus?.paymentStatus === "pending",
    isPaymentCompleted: paymentStatus?.paymentStatus === "completed",
    paymentAmount: paymentStatus?.paymentAmount || 225000,
  };
}
