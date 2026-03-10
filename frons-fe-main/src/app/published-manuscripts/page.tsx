"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  UserIcon,
  CalendarIcon,
  ExternalLinkIcon,
  SearchIcon,
  AlertCircleIcon,
  RefreshCwIcon,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewSidebar } from "@/components/overview-sidebar";
import { Sidebar } from "@/components/ui/sidebar";
import {
  useManuscriptsOverview,
  RESEARCH_CATEGORIES,
} from "@/hooks/useManuscriptsOverview";

export default function PublishedManuscriptsPage() {
  const { authenticated } = usePrivy();
  const { wallets } = useSolanaWallets();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("newest");

  const validSolanaPublicKey = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  )?.address;

  // Use the shared manuscripts hook with proper filtering
  const {
    manuscripts,
    manuscriptsLoading: loading,
    manuscriptsError: error,
    filterManuscripts,
    refreshData,
  } = useManuscriptsOverview(authenticated, validSolanaPublicKey);

  // Filter manuscripts based on search criteria
  const filteredManuscripts = filterManuscripts(
    searchTerm,
    selectedCategory,
    sortBy
  );

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const openIPFS = (url: string) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-white flex w-full">
      <div className="hidden lg:block">
        <Sidebar>
          <OverviewSidebar connected={authenticated} />
        </Sidebar>
      </div>
      <div className="flex-1 w-full">
        <main className="flex-1">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
                    Published Research
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Browse peer-reviewed manuscripts with complete review verification
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Button
                    onClick={refreshData}
                    variant="outline"
                    className="flex items-center space-x-2"
                    disabled={loading}
                  >
                    <RefreshCwIcon
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 items-start sm:items-center justify-between">
                <div className="w-full sm:flex-1">
                  <div className="relative w-full sm:max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search manuscripts, authors, or abstracts..."
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
                      {RESEARCH_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category} className="text-xs">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-auto h-auto text-xs flex-shrink-0">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="title">By Title</SelectItem>
                      <SelectItem value="author">By Author</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
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

            {/* Manuscripts Grid */}
            {!loading && (
              <>
                {filteredManuscripts.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <h3 className="text-base font-medium text-gray-600 mb-2">
                      No manuscripts found
                    </h3>
                    <p className="text-sm text-gray-400 mb-4 max-w-sm mx-auto">
                      {manuscripts.length === 0
                        ? "No properly reviewed manuscripts are available. Manuscripts must have 3+ completed reviews and 3+ approved reviews to be displayed."
                        : "Try adjusting your search criteria or filters."}
                    </p>
                    {manuscripts.length === 0 && (
                      <Button onClick={refreshData} variant="outline" size="sm" className="h-8 text-xs">
                        <RefreshCwIcon className="h-4 w-4 mr-2" />
                        Refresh Data
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mb-4 text-sm text-gray-600">
                      Showing {filteredManuscripts.length} of {manuscripts.length} properly reviewed manuscripts
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {filteredManuscripts.map((manuscript) => (
                        <div
                          key={manuscript.id}
                          onClick={() =>
                            openIPFS(
                              manuscript.ipfsUrls?.manuscript ||
                                `https://ipfs.io/ipfs/${manuscript.cid}`
                            )
                          }
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

                              {/* Review Information */}
                              {manuscript.reviewInfo && (
                                <div className="flex items-center space-x-4 text-xs text-gray-600 bg-green-50 p-2 rounded">
                                  <span>
                                    ✅ {manuscript.reviewInfo.reviewsCompleted} reviews
                                  </span>
                                  <span>
                                    👍 {manuscript.reviewInfo.reviewsApproved} approved
                                  </span>
                                </div>
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
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}