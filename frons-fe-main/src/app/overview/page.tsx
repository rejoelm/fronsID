"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BookOpenIcon,
  UserIcon,
  CalendarIcon,
  ExternalLinkIcon,
  SearchIcon,
  AlertCircleIcon,
  FileTextIcon,
  PlusIcon,
} from "lucide-react";
import { usePrivy, useSolanaWallets } from "@privy-io/react-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/ui/sidebar";
import { OverviewSidebar } from "@/components/overview-sidebar";
import {
  useManuscriptsOverview,
  PublishedManuscript,
} from "@/hooks/useManuscriptsOverview";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { getPrimarySolanaWalletAddress } from "@/utils/wallet";
import { isValidSolanaAddress } from "@/hooks/useProgram";
import { usePageReady } from "@/hooks/usePageReady";
import { useLoading } from "@/context/LoadingContext";
import { useToast } from "@/hooks/use-toast";
import { WalletPanel } from "@/components/overview";

export default function OverviewPage() {
  const router = useRouter();
  const { user, authenticated } = usePrivy();
  const { wallets } = useSolanaWallets();
  const connected = authenticated;
  const publicKey = getPrimarySolanaWalletAddress(wallets);
  const validSolanaPublicKey = isValidSolanaAddress(publicKey)
    ? publicKey
    : undefined;

  // Combined data using new hook
  const {
    manuscriptStats,
    userStats,
    overviewLoading,
    overviewError,
    manuscripts,
    manuscriptsLoading,
    manuscriptsError,
    filterManuscripts,
    refreshData,
    loading: combinedLoading,
    categories,
  } = useManuscriptsOverview(connected, validSolanaPublicKey);

  const walletBalances = useWalletBalances(validSolanaPublicKey);
  const { toast } = useToast();

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("newest");
  const [filteredManuscripts, setFilteredManuscripts] = useState<
    PublishedManuscript[]
  >([]);

  const [isClient, setIsClient] = useState(false);

  const { isReady, progress } = usePageReady({
    checkImages: false,
    checkFonts: true,
    checkData: true,
    minLoadTime: 600,
    maxLoadTime: 3000,
  });

  const { setIsLoading } = useLoading();

  // Filter manuscripts when search criteria change
  useEffect(() => {
    const filtered = filterManuscripts(searchTerm, selectedCategory, sortBy);
    setFilteredManuscripts(filtered);
  }, [manuscripts, searchTerm, selectedCategory, sortBy, filterManuscripts]);

  // Show toast notification for errors
  useEffect(() => {
    if (overviewError) {
      toast({
        variant: "destructive",
        title: "Error Loading Overview",
        description: overviewError,
      });
    }
  }, [overviewError, toast]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setIsLoading(!isReady);
  }, [isReady, setIsLoading]);

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  const openManuscript = (manuscript: PublishedManuscript) => {
    if (manuscript.ipfsUrls?.manuscript) {
      window.open(manuscript.ipfsUrls.manuscript, "_blank");
    } else if (manuscript.cid) {
      window.open(`https://ipfs.io/ipfs/${manuscript.cid}`, "_blank");
    }
  };

  if (!isReady) {
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
              {/* User Info Skeleton - Mobile Only */}
              {connected && (
                <div className="mb-6 lg:hidden">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                    <Skeleton className="h-4 w-32 mb-3" />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-4" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-4" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-18" />
                        <Skeleton className="h-3 w-4" />
                      </div>
                    </div>
                  </div>
                  {/* Wallet Panel Skeleton */}
                  <div className="p-4 bg-white rounded-lg border border-gray-100">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <div className="space-y-2">
                      <div className="p-2 bg-gray-50 rounded-lg flex justify-between">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg flex justify-between">
                        <Skeleton className="h-3 w-10" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Header skeleton */}
              <div className="mb-4 sm:mb-6">
                <Skeleton className="h-6 sm:h-8 w-32 sm:w-48 mb-2" />
                <Skeleton className="h-3 sm:h-4 w-48 sm:w-64" />
              </div>

              {/* Search and filters skeleton */}
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
                  <Skeleton className="h-9 w-full sm:max-w-md" />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Skeleton className="h-9 w-24 flex-1 sm:flex-none" />
                    <Skeleton className="h-9 w-20 flex-shrink-0" />
                  </div>
                </div>
              </div>

              {/* Manuscripts grid skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
                <div className="col-span-1 lg:col-span-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="p-3 sm:p-4 bg-white rounded-lg border border-gray-100 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-3 rounded" />
                        </div>
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-3 w-20" />
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-10" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidebar skeleton - Desktop only */}
                <div className="hidden lg:block space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <Skeleton className="h-4 w-32 mb-3" />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-4" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-4" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-18" />
                        <Skeleton className="h-3 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-100">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <div className="space-y-2">
                      <div className="p-2 bg-gray-50 rounded-lg flex justify-between">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg flex justify-between">
                        <Skeleton className="h-3 w-10" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!connected || !isClient) {
    return (
      <div className="min-h-screen bg-white flex w-full justify-center items-center">
        <Sidebar>
          <OverviewSidebar connected={connected} />
        </Sidebar>
        <div className="flex-1">
          <div className="container max-w-full mx-auto py-8 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold text-primary mb-2 text-center justify-center">
              Authentication Required
            </h2>
            <p className="text-muted-foreground mb-4 text-sm text-center">
              Please connect your wallet to view your dashboard overview.
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
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            {/* User Info - Mobile Only - Above Title */}
            {connected && (
              <div className="mb-6 lg:hidden">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Welcome back, {getUserDisplayName(user)}
                  </h3>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Submissions</span>
                      <span>{userStats?.manuscriptsSubmitted || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reviews</span>
                      <span>{userStats?.reviewsCompleted || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Published</span>
                      <span>{userStats?.manuscriptsPublished || 0}</span>
                    </div>
                  </div>
                </div>

                <WalletPanel walletBalances={walletBalances} />
              </div>
            )}

            {/* Minimalist Header */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
                Latest Research
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                {filteredManuscripts.length} manuscripts available
              </p>
            </div>

            {/* Search and Filters - Ultra Minimal */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 items-start sm:items-center justify-between">
                <div className="w-full sm:flex-1">
                  <div className="relative w-full sm:max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9 text-sm w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-auto h-auto text-xs flex-1 sm:flex-none">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="text-xs w-56 min-w-56">
                      {categories.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="text-xs"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button asChild size="sm" className="h-9 flex-shrink-0">
                    <Link href="/submit-manuscript">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Submit
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content - Manuscripts First */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
              {/* Manuscripts - Primary Content */}
              <div className="col-span-1 lg:col-span-4">
                {/* Loading State */}
                {manuscriptsLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="p-3 sm:p-4 bg-white rounded-lg border border-gray-100 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-3 rounded" />
                        </div>
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-3 w-20" />
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-10" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {manuscriptsError && (
                  <Alert className="border-red-100 bg-red-50 mb-4">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertDescription className="text-red-700 text-sm">
                      {manuscriptsError}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        className="ml-3 h-7 text-xs"
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Manuscripts Grid */}
                {!manuscriptsLoading && filteredManuscripts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {filteredManuscripts.map((manuscript) => (
                      <div
                        key={manuscript.id}
                        onClick={() => openManuscript(manuscript)}
                        className="cursor-pointer group"
                      >
                        <Card className="h-full border border-gray-100 hover:border-gray-200 transition-all duration-200 bg-white hover:shadow-sm">
                          <CardContent className="p-3 sm:p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700"
                              >
                                {manuscript.category[0] || "Research"}
                              </Badge>
                              <div className="flex items-center space-x-1 text-gray-400 group-hover:text-gray-600 transition-colors">
                                <ExternalLinkIcon className="h-3 w-3" />
                              </div>
                            </div>

                            <h3 className="font-medium text-sm sm:text-base text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                              {manuscript.title}
                            </h3>

                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <UserIcon className="h-3 w-3" />
                              <span className="line-clamp-1 text-xs">
                                {manuscript.author}
                              </span>
                            </div>

                            {manuscript.abstract && (
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                {manuscript.abstract}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center space-x-1 text-xs text-gray-400">
                                <CalendarIcon className="h-3 w-3" />
                                <span>
                                  {formatDate(manuscript.publishedDate)}
                                </span>
                              </div>

                              {manuscript.category.length > 1 && (
                                <div className="flex items-center space-x-1">
                                  {manuscript.category
                                    .slice(1, 2)
                                    .map((cat, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs px-1.5 py-0.5 border-gray-200 text-gray-500"
                                      >
                                        {cat}
                                      </Badge>
                                    ))}
                                  {manuscript.category.length > 2 && (
                                    <span className="text-xs text-gray-400">
                                      +{manuscript.category.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!manuscriptsLoading && filteredManuscripts.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <h3 className="text-base font-medium text-gray-600 mb-2">
                      No manuscripts found
                    </h3>
                    <p className="text-sm text-gray-400 mb-4 max-w-sm mx-auto">
                      {searchTerm || selectedCategory !== "All Categories"
                        ? "Try adjusting your search criteria"
                        : "No published research available yet"}
                    </p>
                    {(searchTerm || selectedCategory !== "All Categories") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("All Categories");
                        }}
                        className="h-8 text-xs"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* User Info */}
              {connected && (
                <div className="space-y-4 lg:block hidden">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Welcome back, {getUserDisplayName(user)}
                    </h3>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Submissions</span>
                        <span>{userStats?.manuscriptsSubmitted || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reviews</span>
                        <span>{userStats?.reviewsCompleted || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Published</span>
                        <span>{userStats?.manuscriptsPublished || 0}</span>
                      </div>
                    </div>
                  </div>

                  <WalletPanel walletBalances={walletBalances} />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
