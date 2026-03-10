"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchIcon,
  FilterIcon,
  AlertCircleIcon,
  FileTextIcon,
  ExternalLinkIcon,
  PenIcon,
} from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { OverviewSidebar } from "@/components/overview-sidebar";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth";
import { useToast } from "@/components/ui/sonner";
import { isValidSolanaAddress } from "@/hooks/useProgram";
import { getPrimarySolanaWalletAddress } from "@/utils/wallet";
import HeaderImage from "@/components/header-image";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletConnection } from "@/components/wallet-connection";
import {
  useReviewManuscripts,
  useReviewFilters,
  useReviewModal,
  useReviewUtils,
  reviewStatuses,
} from "@/hooks/review-manuscript";

export default function ReviewManuscriptPage() {
  const router = useRouter();
  const { authenticated: connected, user } = usePrivy();
  const { wallets } = useSolanaWallets();
  const publicKey = getPrimarySolanaWalletAddress(wallets);
  const validSolanaPublicKey = isValidSolanaAddress(publicKey)
    ? publicKey
    : undefined;
  const { toast } = useToast();

  // Use modular hooks
  const {
    manuscripts,
    selectedManuscript,
    reviewStatus,
    loading,
    error,
    handleViewManuscript,
    handleAssignReviewers,
    handlePublishManuscript,
    setSelectedManuscript,
    setReviewStatus,
  } = useReviewManuscripts(connected, validSolanaPublicKey);

  const {
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    categories,
    selectedCategory,
    setSelectedCategory,
    filteredManuscripts,
  } = useReviewFilters(manuscripts);

  const {
    showAssignReviewers,
    reviewers,
    openAssignReviewersModal,
    closeAssignReviewersModal,
    updateReviewer,
    getValidReviewers,
    isValidReviewerCount,
  } = useReviewModal();

  const { formatDate, getStatusBadge } = useReviewUtils();

  // Handle reviewer assignment with validation
  const onAssignReviewers = async () => {
    const result = await handleAssignReviewers(getValidReviewers());
    if (result) {
      closeAssignReviewersModal();
      toast("Reviewers assigned successfully!");
    }
  };

  if (!connected) {
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
              <WalletConnection />
            </div>
          </main>
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
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="mb-8 space-y-4">
              <div className="relative max-w-full">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search manuscripts by title, author, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 ">
                <span className="text-sm text-muted-foreground min-w-fit">
                  Filter by category:
                </span>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue
                      className="text-sm"
                      placeholder="Select a category"
                    />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl text-sm">
                    {categories.map((category) => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name}
                        {category.name !== "All" && ` (${category.count})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  Filter by status:
                </span>
                {reviewStatuses.map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                    className="text-xs"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Manuscripts List */}
            <div className="space-y-6 mx-auto">
              {loading ? (
                <div className="space-y-8">
                  {/* Search and Filter skeleton - matching actual layout */}
                  <div className="mb-8 space-y-4">
                    {/* Search Bar skeleton */}
                    <div className="relative max-w-full">
                      <Skeleton className="h-12 w-full" />
                    </div>

                    {/* Category Filter skeleton */}
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-48" />
                    </div>

                    {/* Status Filter skeleton */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-28" />
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-20" />
                      ))}
                    </div>
                  </div>

                  {/* Manuscripts grid skeleton - matching 3-column responsive layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
                    {[...Array(6)].map((_, i) => (
                      <Card
                        key={i}
                        className="shadow-sm border border-gray-100 rounded-xl bg-white/80"
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col h-full">
                            <div className="flex-1">
                              {/* Title and Status badge */}
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-6 w-20" />
                              </div>

                              {/* Author and categories */}
                              <div className="space-y-3 mb-4">
                                <Skeleton className="h-4 w-24" />
                                <div className="flex flex-wrap gap-2">
                                  <Skeleton className="h-5 w-16" />
                                  <Skeleton className="h-5 w-20" />
                                </div>
                              </div>

                              {/* Submission info */}
                              <div className="space-y-2 mb-4">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-28" />
                              </div>
                            </div>

                            {/* Action button */}
                            <div className="pt-4 border-t border-gray-100">
                              <Skeleton className="h-9 w-full" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <Card className="shadow-sm border border-gray-100 rounded-xl bg-white/80 hover:shadow-lg transition-all duration-200 mx-auto">
                  <CardContent className="p-8 text-center">
                    <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-primary mb-2">
                      Error
                    </h2>
                    <p className="text-red-600">{error}</p>
                  </CardContent>
                </Card>
              ) : manuscripts.length === 0 ? (
                <Card className="shadow-sm border border-gray-100 rounded-xl bg-white/80 hover:shadow-lg transition-all duration-200 mx-auto max-w-full">
                  <CardContent className="p-8 text-center">
                    <FileTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-primary mb-2">
                      No Manuscripts to Review
                    </h2>
                    <p className="text-muted-foreground">
                      There are no manuscripts assigned to you for review at
                      this time.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredManuscripts.map((manuscript) => {
                    const statusBadge = getStatusBadge(manuscript);
                    return (
                      <Card
                        key={manuscript.id}
                        className="shadow-sm border border-gray-100 rounded-xl bg-white/80 hover:shadow-lg transition-all duration-200"
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col h-full">
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <h3 className="font-medium text-primary leading-tight">
                                  {manuscript.title}
                                </h3>
                                <Badge className={statusBadge.className}>
                                  {statusBadge.text}
                                </Badge>
                              </div>

                              <div className="space-y-3 mb-4">
                                <p className="text-sm text-muted-foreground">
                                  By {manuscript.author}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {manuscript.category.map((cat, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="bg-primary/10 text-primary text-xs"
                                    >
                                      {cat}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                  Submitted:{" "}
                                  {formatDate(manuscript.submissionDate)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    manuscript.ipfsUrls.manuscript,
                                    "_blank"
                                  )
                                }
                                className="text-xs"
                              >
                                <ExternalLinkIcon className="h-3 w-3 mr-1" />
                                View Paper
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  router.push(`/submit-review/${manuscript.id}`)
                                }
                                className="text-xs"
                              >
                                <PenIcon className="h-3 w-3 mr-1" />
                                Submit Review
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assign Reviewers Modal */}
            {showAssignReviewers && selectedManuscript && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md mx-4 shadow-sm border border-gray-100 rounded-xl bg-white/80">
                  <CardHeader>
                    <CardTitle className="text-primary">
                      Assign Reviewers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Assign at least 3 reviewers to &quot;
                      {selectedManuscript.title}&quot;
                    </p>

                    {reviewers.map((reviewer, index) => (
                      <div key={index}>
                        <label className="text-sm font-medium text-primary">
                          Reviewer {index + 1} Wallet Address
                        </label>
                        <input
                          type="text"
                          value={reviewer}
                          onChange={(e) =>
                            updateReviewer(index, e.target.value)
                          }
                          placeholder="0x..."
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                        />
                      </div>
                    ))}

                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={closeAssignReviewersModal}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={onAssignReviewers}
                        className="flex-1"
                        disabled={loading || !isValidReviewerCount()}
                      >
                        {loading ? "Assigning..." : "Assign Reviewers"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
