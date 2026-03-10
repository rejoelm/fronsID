"use client";

export const dynamic = "force-dynamic";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { WalletConnection } from "@/components/wallet-connection";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { useRouter } from "next/navigation";
import { useLoading } from "@/context/LoadingContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/ui/sidebar";
import { OverviewSidebar } from "@/components/overview-sidebar";

import { isValidSolanaAddress } from "@/hooks/useProgram";
import { getPrimarySolanaWallet } from "@/utils/wallet";
import { useManuscriptSubmission } from "@/hooks/useManuscriptSubmission";
import { Toaster } from "@/components/ui/toaster";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircleIcon } from "lucide-react";
import { BasicInformationForm } from "@/components/manuscript/BasicInformationForm";
import { AbstractKeywordsForm } from "@/components/manuscript/AbstractKeywordsForm";
import { FileUploadForm } from "@/components/manuscript/FileUploadForm";
import { IPFSInfoDisplay } from "@/components/manuscript/IPFSInfoDisplay";
import { SubmissionProgress } from "@/components/manuscript/SubmissionProgress";
import { useSubmissionForm } from "@/hooks/useSubmissionForm";
import { useCVVerification } from "@/hooks/useCVVerification";
import { usePayment } from "@/hooks/usePayment";
import HeaderImage from "@/components/header-image";

export default function SubmitManuscriptPage() {
  const { toast } = useToast();
  const { authenticated: connected, authenticated } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  const router = useRouter();
  const { isLoading } = useLoading();

  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";

  const solanaWallet = getPrimarySolanaWallet(solanaWallets);
  const validSolanaPublicKey =
    solanaWallet?.address && isValidSolanaAddress(solanaWallet.address)
      ? solanaWallet.address
      : undefined;

  const {
    formData,
    selectedFile,
    authors,
    keywords,

    handleInputChange,
    handleRemoveItem,
    handleCategoriesChange,
    handleFileChange,
    handleRemoveFile,
    validateForm,
    resetForm,
    getArrayFromCommaString,
  } = useSubmissionForm();

  const { cvVerified, cvChecking } = useCVVerification({
    walletAddress: validSolanaPublicKey,
    connected,
    authenticated,
  });

  const paymentHook = usePayment({
    walletAddress: validSolanaPublicKey,
    wallet: solanaWallet,
  });

  const { processUSDCPayment, paymentProcessing, paymentError } = paymentHook;

  const { submitManuscript } = useManuscriptSubmission({
    checkCVRegistration: undefined,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [ipfsData, setIpfsData] = useState<{
    cid: string;
    ipfsUrl: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState("basic-info");
  const [completedTabs, setCompletedTabs] = useState<Set<string>>(new Set());
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setShowValidationErrors(false);
  };

  useEffect(() => {
    const newCompletedTabs = new Set<string>();

    if (formData.title && formData.author && formData.category) {
      newCompletedTabs.add("basic-info");
    }

    if (formData.abstract && formData.keywords) {
      newCompletedTabs.add("authors-keywords");
    }

    if (selectedFile) {
      newCompletedTabs.add("manuscript-file");
    }

    setCompletedTabs(newCompletedTabs);
  }, [formData, selectedFile]);

  const navigateToErrorTab = (errorMessage: string) => {
    if (
      errorMessage.includes("Title") ||
      errorMessage.includes("Author") ||
      errorMessage.includes("Category")
    ) {
      setActiveTab("basic-info");
    } else if (
      errorMessage.includes("Abstract") ||
      errorMessage.includes("Keywords")
    ) {
      setActiveTab("authors-keywords");
    } else if (errorMessage.includes("file")) {
      setActiveTab("manuscript-file");
    }
  };

  const validateFormWithTabs = useCallback((): string | null => {
    if (!formData.title.trim())
      return "Title is required (Basic Information tab)";
    if (!formData.author.trim())
      return "Author is required (Basic Information tab)";
    if (!formData.category.trim())
      return "Category is required (Basic Information tab)";

    if (!formData.abstract.trim())
      return "Abstract is required (Abstract & Keywords tab)";
    if (!formData.keywords.trim())
      return "Keywords are required (Abstract & Keywords tab)";

    if (!selectedFile)
      return "Manuscript file is required (Manuscript File tab)";

    return null;
  }, [formData, selectedFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setShowValidationErrors(true);

    const validationError = validateFormWithTabs();
    if (validationError) {
      navigateToErrorTab(validationError);

      return;
    }

    if (!validSolanaPublicKey || !cvVerified) {
      toast({
        title: "Error",
        description: "Wallet connection and CV verification required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      setSubmitProgress(0);
      setSuccess(null);
      setIpfsData(null);

      setSubmitProgress(10);

      toast({
        title: "Processing Payment",
        description:
          "You're paying $50 USDC that will be saved in the escrow account. If the manuscript is rejected, the payment will be refunded",
      });

      const paymentSignature = await processUSDCPayment();

      setSubmitProgress(30);
      toast({
        title: "Payment Successful",
        description: "Payment processed successfully. Submitting manuscript...",
      });

      setSubmitProgress(50);

      const submissionMetadata = {
        title: formData.title,
        authors: getArrayFromCommaString(formData.author).map((name) => ({
          name,
        })),
        categories: getArrayFromCommaString(formData.category),
        abstract: formData.abstract,
        keywords: getArrayFromCommaString(formData.keywords),
        walletAddress: validSolanaPublicKey,
      };

      const result = await submitManuscript(
        selectedFile!,
        submissionMetadata,
        apiUrl
      );

      if (!result) {
        throw new Error("Failed to submit manuscript");
      }

      setSubmitProgress(100);
      const successMsg = `Manuscript "${formData.title}" submitted successfully!`;
      toast({
        title: "Success!",
        description: successMsg,
      });
      setSuccess(successMsg);

      setIpfsData({
        cid: result.manuscript.cid,
        ipfsUrl: result.ipfsUrls.manuscript,
      });

      toast({
        title: "Manuscript Links",
        description: (
          <div className="space-y-2">
            <p>Your manuscript has been uploaded onchain:</p>
            <a
              href={result.ipfsUrls.manuscript}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Manuscript
            </a>
          </div>
        ),
      });

      resetForm();

      setTimeout(() => {
        router.push("/overview");
      }, 5000);
    } catch (err: any) {
      console.error("Failed to submit manuscript:", err);

      let errorMsg = "Failed to submit manuscript. Please try again.";
      if (paymentError || err.message?.includes("Payment failed")) {
        errorMsg =
          paymentError ||
          "Payment failed. Please ensure you have sufficient USDCF balance.";
      } else if (
        err.message?.toLowerCase().includes("insufficient") ||
        err.message?.toLowerCase().includes("balance") ||
        err.message?.toLowerCase().includes("usdc") ||
        err.message?.toLowerCase().includes("usdcf") ||
        err.message?.includes("token amount") ||
        err.message?.includes("0x1") || // Solana insufficient funds error
        err.code === "INSUFFICIENT_BALANCE" ||
        err.response?.data?.code === "INSUFFICIENT_BALANCE" ||
        err.response?.data?.code === "INSUFFICIENT_GAS_FUNDS" ||
        err.response?.data?.message?.toLowerCase().includes("insufficient")
      ) {
        errorMsg =
          "Insufficient USDC/USDCF balance. Please add funds to your wallet and try again.";
      } else if (err.response?.data?.code === "CV_REQUIRED") {
        errorMsg = err.response.data.message;
        setTimeout(() => router.push("/register-cv"), 2000);
      } else if (err.response?.data?.code === "MISSING_WALLET") {
        errorMsg =
          err.response.data.message || "Valid wallet connection required.";
      } else if (err.response?.data?.code === "DUPLICATE_MANUSCRIPT") {
        errorMsg = "This manuscript has been uploaded before";
      } else if (err.response?.data?.code === "DUPLICATE_DATA") {
        errorMsg = "This data has already been submitted";
      } else if (err.response?.data?.code === "PINATA_ERROR") {
        errorMsg = "IPFS upload failed. Please try again later.";
      } else if (err.response?.status === 503) {
        errorMsg = "Service temporarily unavailable. Please try again later.";
      }

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setSubmitProgress(0);
    }
  };

  if (!connected || !validSolanaPublicKey) {
    return (
      <div className="min-h-screen bg-white flex w-full">
        <div className="hidden lg:block">
          <Sidebar>
            <OverviewSidebar connected={connected} />
          </Sidebar>
        </div>
        <div className="flex-1 w-full">
          <main className="flex-1">
            <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 justify-center">
              <div className="text-center py-8 justify-center">
                <WalletConnection />
              </div>
            </div>
          </main>
        </div>
        <Toaster />
      </div>
    );
  }

  if (cvChecking || !cvVerified) {
    return (
      <div className="min-h-screen bg-white flex w-full">
        <div className="hidden lg:block">
          <Sidebar>
            <OverviewSidebar connected={connected} />
          </Sidebar>
        </div>
        <div className="flex-1 w-full">
          <main className="flex-1">
            <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
              <div className="space-y-6">
                {/* Form Container Skeleton */}
                <Card className="shadow-xl border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm transition-all duration-300">
                  <CardContent className="p-0">
                    {/* Tab Navigation Skeleton */}
                    <div className="border-b border-gray-100">
                      <div className="flex w-full justify-start bg-transparent p-0 h-auto">
                        <div className="flex items-center space-x-2 px-6 py-4">
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <div className="flex items-center space-x-2 px-6 py-4">
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex items-center space-x-2 px-6 py-4">
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>

                    {/* Basic Information Form Skeleton */}
                    <div className="p-8 space-y-6">
                      {/* Header Section */}
                      <div className="border-b border-gray-100/50 pb-6 p-6">
                        <div className="flex items-center space-x-3">
                          <div>
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64 mt-1" />
                          </div>
                        </div>
                        <div className="mt-6">
                          <Skeleton className="h-px w-full" />
                        </div>
                      </div>

                      {/* Form Content */}
                      <div className="space-y-6 px-6">
                        {/* Title Field */}
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-10 w-full" />
                        </div>

                        {/* Author Field */}
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>

                        {/* Category Field */}
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-36" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>

                      {/* Next Button */}
                      <div className="flex justify-end pt-6">
                        <Skeleton className="h-10 w-48" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
        <Toaster />
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
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {ipfsData && <IPFSInfoDisplay ipfsData={ipfsData} />}

              {submitting && (
                <SubmissionProgress submitProgress={submitProgress} />
              )}

              <Card className="shadow-xl border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm transition-all duration-300">
                <CardContent className="p-0">
                  <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="w-full"
                  >
                    <div className="border-b border-gray-100">
                      <TabsList className="w-full justify-start bg-transparent p-0 h-auto rounded-none">
                        <TabsTrigger
                          value="basic-info"
                          className="flex items-center space-x-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent px-6 py-4 relative rounded-none"
                        >
                          Basic Information
                          {completedTabs.has("basic-info") && (
                            <CheckCircleIcon className="w-4 h-4 text-green-600 ml-1" />
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="authors-keywords"
                          className="flex items-center space-x-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent px-6 py-4 relative rounded-none"
                        >
                          Abstract & Keywords
                          {completedTabs.has("authors-keywords") && (
                            <CheckCircleIcon className="w-4 h-4 text-green-600 ml-1" />
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="manuscript-file"
                          className="flex items-center space-x-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent px-6 py-4 relative rounded-none"
                        >
                          Manuscript File
                          {completedTabs.has("manuscript-file") && (
                            <CheckCircleIcon className="w-4 h-4 text-green-600 ml-1" />
                          )}
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="basic-info" className="p-8 space-y-6">
                      <BasicInformationForm
                        formData={formData}
                        authors={authors}
                        submitting={submitting}
                        onInputChange={handleInputChange}
                        onRemoveItem={handleRemoveItem}
                        onCategoriesChange={handleCategoriesChange}
                      />
                      <div className="flex justify-end pt-6">
                        <Button
                          type="button"
                          onClick={() => handleTabChange("authors-keywords")}
                          disabled={!completedTabs.has("basic-info")}
                          className="min-w-[120px]"
                        >
                          Next: Abstract & Keywords
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="authors-keywords"
                      className="p-8 space-y-6"
                    >
                      <AbstractKeywordsForm
                        formData={{
                          abstract: formData.abstract,
                          keywords: formData.keywords,
                        }}
                        keywords={keywords}
                        submitting={submitting}
                        onInputChange={handleInputChange}
                        onRemoveItem={handleRemoveItem}
                      />
                      <div className="flex justify-between pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleTabChange("basic-info")}
                          className="min-w-[120px]"
                        >
                          Previous: Basic Info
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleTabChange("manuscript-file")}
                          disabled={!completedTabs.has("authors-keywords")}
                          className="min-w-[120px]"
                        >
                          Next: Upload File
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="manuscript-file"
                      className="p-8 space-y-6"
                    >
                      <FileUploadForm
                        selectedFile={selectedFile}
                        submitting={submitting}
                        onFileChange={handleFileChange}
                        onRemoveFile={handleRemoveFile}
                      />
                      <div className="flex justify-between pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleTabChange("authors-keywords")}
                          className="min-w-[120px]"
                        >
                          Previous: Authors & Keywords
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            submitting ||
                            !cvVerified ||
                            paymentProcessing ||
                            !completedTabs.has("basic-info") ||
                            !completedTabs.has("authors-keywords") ||
                            !completedTabs.has("manuscript-file")
                          }
                        >
                          {paymentProcessing
                            ? "Processing..."
                            : submitting
                            ? "Submitting..."
                            : "Submit Manuscript"}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </form>
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
