"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { WalletConnection } from "@/components/wallet-connection";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewSidebar } from "@/components/overview-sidebar";
import { Sidebar } from "@/components/ui/sidebar";
import { isValidSolanaAddress } from "@/hooks/useProgram";
import { getPrimarySolanaWallet } from "@/utils/wallet";
import { Toaster } from "@/components/ui/toaster";
import HeaderImage from "@/components/header-image";
import {
  FileTextIcon,
  ExternalLinkIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EditIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import axios from "axios";

interface Manuscript {
  id: number;
  title: string;
  author: string;
  category: string[];
  abstract: string;
  keywords: string[];
  status: string;
  submissionDate: string;
  cid: string;
  authorWallet: string;
  ipfsUrls: {
    manuscript: string;
    metadata: string | null;
  };
}

type ReviewDecision =
  | "accepted"
  | "minor_revision"
  | "major_revision"
  | "rejected";

interface ReviewDecisionConfig {
  value: ReviewDecision;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const reviewDecisions: ReviewDecisionConfig[] = [
  {
    value: "accepted",
    label: "Accept",
    description: "Manuscript is ready for publication with no changes required",
    icon: <CheckCircleIcon className="w-5 h-5" />,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    value: "minor_revision",
    label: "Minor Revision",
    description: "Manuscript requires minor changes before publication",
    icon: <EditIcon className="w-5 h-5" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    value: "major_revision",
    label: "Major Revision",
    description: "Manuscript requires substantial changes and re-review",
    icon: <AlertCircleIcon className="w-5 h-5" />,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    value: "rejected",
    label: "Reject",
    description: "Manuscript is not suitable for publication",
    icon: <XCircleIcon className="w-5 h-5" />,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
];

export default function SubmitReviewPage() {
  const { toast } = useToast();
  const { authenticated: connected } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  const router = useRouter();
  const params = useParams();
  const reviewId = params.reviewId as string;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";

  const solanaWallet = getPrimarySolanaWallet(solanaWallets);
  const validSolanaPublicKey =
    solanaWallet?.address && isValidSolanaAddress(solanaWallet.address)
      ? solanaWallet.address
      : undefined;

  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision | "">("");
  const [reviewComments, setReviewComments] = useState("");
  const [confidentialComments, setConfidentialComments] = useState("");

  // Clear comments when switching between decision types that use different comment styles
  const handleDecisionChange = (newDecision: ReviewDecision) => {
    const oldRequiresSpecific = [
      "minor_revision",
      "major_revision",
      "rejected",
    ].includes(reviewDecision);
    const newRequiresSpecific = [
      "minor_revision",
      "major_revision",
      "rejected",
    ].includes(newDecision);

    // Clear comments when switching between different comment contexts
    if (oldRequiresSpecific !== newRequiresSpecific) {
      setReviewComments("");
    }

    setReviewDecision(newDecision);
  };

  const selectedDecision = reviewDecisions.find(
    (d) => d.value === reviewDecision
  );

  useEffect(() => {
    const loadManuscript = async () => {
      if (!reviewId || !connected || !validSolanaPublicKey) return;

      try {
        setLoading(true);

        try {
          const canReviewResponse = await axios.get(
            `${apiUrl}/reviews/reviewer/${validSolanaPublicKey}/can-review/${reviewId}`
          );

          if (!canReviewResponse.data.canReview) {
            toast({
              title: "Cannot Review Manuscript",
              description:
                canReviewResponse.data.reason ||
                "You are not qualified to review this manuscript.",
              variant: "destructive",
            });
            router.push("/review-manuscript");
            return;
          }
        } catch (qualificationError) {
          console.warn(
            "Could not check reviewer qualification:",
            qualificationError
          );
        }

        const response = await axios.get(
          `${apiUrl}/manuscripts/pending-review?limit=100&reviewerWallet=${validSolanaPublicKey}`
        );

        if (response.data.success) {
          const manuscripts = response.data.manuscripts;
          const targetManuscript = manuscripts.find(
            (m: any) => m.id.toString() === reviewId
          );

          if (targetManuscript) {
            setManuscript(targetManuscript);
          } else {
            toast({
              title: "Manuscript Not Found",
              description:
                "The manuscript you&apos;re trying to review could not be found or you don&apos;t have access to it.",
              variant: "destructive",
            });
            router.push("/review-manuscript");
          }
        }
      } catch (error) {
        console.error("Failed to load manuscript:", error);
        toast({
          title: "Error Loading Manuscript",
          description: "Failed to load manuscript details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadManuscript();
  }, [reviewId, connected, validSolanaPublicKey, apiUrl, toast, router]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewDecision) {
      toast({
        title: "Review Decision Required",
        description: "Please select a review decision before submitting.",
        variant: "destructive",
      });
      return;
    }

    const requiresComments = [
      "minor_revision",
      "major_revision",
      "rejected",
    ].includes(reviewDecision);
    if (requiresComments && !reviewComments.trim()) {
      toast({
        title: "Review Comments Required",
        description: `Please provide specific ${
          reviewDecision === "rejected"
            ? "reasons for rejection"
            : "changes required"
        }.`,
        variant: "destructive",
      });
      return;
    }

    if (!validSolanaPublicKey || !manuscript) {
      toast({
        title: "Error",
        description: "Wallet connection required to submit review.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const reviewData = {
        manuscriptId: manuscript.id,
        reviewerWallet: validSolanaPublicKey,
        decision: reviewDecision,
        comments: reviewComments,
        confidentialComments: confidentialComments,
        submittedAt: new Date().toISOString(),
      };

      console.log("📝 Submitting review data:", reviewData);

      const response = await axios.post(`${apiUrl}/reviews/submit`, reviewData);

      if (response.data.success) {
        toast({
          title: "Review Submitted Successfully",
          description: `Your ${selectedDecision?.label.toLowerCase()} review has been submitted.`,
        });

        setTimeout(() => {
          router.push("/review-manuscript");
        }, 2000);
      } else {
        throw new Error(response.data.message || "Failed to submit review");
      }
    } catch (error: any) {
      console.error("Failed to submit review:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      let errorMessage = "Failed to submit review. Please try again.";

      if (error.response?.data?.code === "REVIEWER_NOT_QUALIFIED") {
        errorMessage =
          "You need to upload your CV and be qualified as a reviewer before submitting reviews. Please visit the CV registration page first.";
      } else if (error.response?.data?.code === "AUTHOR_REVIEW_FORBIDDEN") {
        errorMessage =
          "You cannot review your own manuscript. Please select a different manuscript to review.";
      } else if (error.response?.data?.code === "MISSING_FIELDS") {
        errorMessage =
          "Missing required information. Please ensure all required fields are filled.";
      } else if (error.response?.data?.code === "INVALID_DECISION") {
        errorMessage =
          "Invalid review decision selected. Please choose a valid option.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
              <div className="flex justify-center">
                <WalletConnection />
              </div>
            </div>
          </main>
        </div>
        <Toaster />
      </div>
    );
  }

  if (loading) {
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
                <Skeleton className="h-8 w-64" />
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-32 w-full" />
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

  if (!manuscript) {
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
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-primary mb-2">
                    Manuscript Not Found
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    The manuscript you&apos;re trying to review could not be
                    found.
                  </p>
                  <Button onClick={() => router.push("/review-manuscript")}>
                    Return to Review Dashboard
                  </Button>
                </CardContent>
              </Card>
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
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => router.push("/review-manuscript")}
                className="mb-4 px-0 py-0"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-semibold text-primary">
                Submit Manuscript Review
              </h1>
              <p className="text-muted-foreground">
                Review the manuscript and provide your recommendation
              </p>
            </div>

            <div className="space-y-6">
              {/* Manuscript Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Manuscript Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-primary">
                      {manuscript.title}
                    </h3>
                    <p className="text-muted-foreground">
                      By {manuscript.author}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {manuscript.category.map((cat, index) => (
                      <Badge key={index} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Abstract</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {manuscript.abstract}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Keywords</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {manuscript.keywords.map((keyword, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Submitted</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(
                          manuscript.submissionDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(manuscript.ipfsUrls.manuscript, "_blank")
                      }
                      className="flex items-center gap-2"
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                      View Full Paper
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Review Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    {/* Review Decision */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">
                        Review Decision
                      </Label>
                      <RadioGroup
                        value={reviewDecision}
                        onValueChange={(value: string) =>
                          handleDecisionChange(value as ReviewDecision)
                        }
                        className="space-y-3"
                      >
                        {reviewDecisions.map((decision) => (
                          <div
                            key={decision.value}
                            className={`border rounded-lg transition-all ${
                              reviewDecision === decision.value
                                ? `${decision.borderColor} ${decision.bgColor}`
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="p-4 cursor-pointer">
                              <div className="flex items-center space-x-3">
                                <RadioGroupItem
                                  value={decision.value}
                                  id={decision.value}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={decision.color}>
                                      {decision.icon}
                                    </span>
                                    <Label
                                      htmlFor={decision.value}
                                      className={`font-medium cursor-pointer ${decision.color}`}
                                    >
                                      {decision.label}
                                    </Label>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {decision.description}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {reviewDecision === decision.value &&
                              (decision.value === "minor_revision" ||
                                decision.value === "major_revision" ||
                                decision.value === "rejected") && (
                                <div className="px-4 pb-4 border-t border-gray-100 mt-3 pt-3">
                                  <Label className="text-sm font-medium mb-2 block">
                                    {decision.value === "rejected"
                                      ? "Reasons for rejection *"
                                      : `Specific changes required for ${decision.label.toLowerCase()} *`}
                                  </Label>
                                  <Textarea
                                    value={reviewComments}
                                    onChange={(e) =>
                                      setReviewComments(e.target.value)
                                    }
                                    placeholder={
                                      decision.value === "rejected"
                                        ? "Please explain why this manuscript should be rejected..."
                                        : decision.value === "minor_revision"
                                        ? "Please specify the minor changes needed (e.g., typos, formatting, small clarifications)..."
                                        : "Please detail the major revisions required (e.g., additional experiments, rewriting sections, addressing methodological issues)..."
                                    }
                                    className="min-h-[120px] resize-none"
                                    required
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {decision.value === "rejected"
                                      ? "This feedback will help the author understand the decision"
                                      : "Be specific to help the author make the necessary improvements"}
                                  </p>
                                </div>
                              )}
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {reviewDecision === "accepted" ? (
                      <div>
                        <Label
                          htmlFor="review-comments"
                          className="text-base font-medium"
                        >
                          Comments for Author
                        </Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Optional: Provide positive feedback or commendations
                          for the accepted manuscript
                        </p>
                        <Textarea
                          id="review-comments"
                          value={reviewComments}
                          onChange={(e) => setReviewComments(e.target.value)}
                          placeholder="This manuscript is well-written and makes a valuable contribution to the field..."
                          className="min-h-[120px]"
                        />
                      </div>
                    ) : reviewDecision &&
                      ![
                        "minor_revision",
                        "major_revision",
                        "rejected",
                      ].includes(reviewDecision) ? (
                      <div>
                        <Label
                          htmlFor="review-comments"
                          className="text-base font-medium"
                        >
                          Additional Comments for Author
                        </Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Provide any additional feedback that will be shared
                          with the author
                        </p>
                        <Textarea
                          id="review-comments"
                          value={reviewComments}
                          onChange={(e) => setReviewComments(e.target.value)}
                          placeholder="Please provide detailed feedback on the manuscript's strengths, weaknesses, and suggestions for improvement..."
                          className="min-h-[120px]"
                        />
                      </div>
                    ) : null}

                    {/* Confidential Comments */}
                    <div>
                      <Label
                        htmlFor="confidential-comments"
                        className="text-base font-medium"
                      >
                        Confidential Comments for Editor
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Optional comments that will only be visible to the
                        editorial team
                      </p>
                      <Textarea
                        id="confidential-comments"
                        value={confidentialComments}
                        onChange={(e) =>
                          setConfidentialComments(e.target.value)
                        }
                        placeholder="Additional comments for the editorial team only..."
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Summary */}
                    {selectedDecision && (
                      <div
                        className={`p-4 rounded-lg ${selectedDecision.bgColor} ${selectedDecision.borderColor} border`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={selectedDecision.color}>
                            {selectedDecision.icon}
                          </span>
                          <span
                            className={`font-medium ${selectedDecision.color}`}
                          >
                            Review Summary: {selectedDecision.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {selectedDecision.description}
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/review-manuscript")}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          submitting ||
                          !reviewDecision ||
                          ([
                            "minor_revision",
                            "major_revision",
                            "rejected",
                          ].includes(reviewDecision) &&
                            !reviewComments.trim())
                        }
                        className="min-w-[120px]"
                      >
                        {submitting ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Toaster />
      </div>
    </div>
  );
}
