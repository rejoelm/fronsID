"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3Icon, BookOpenIcon, TrendingUpIcon } from "lucide-react";
import { OverviewSidebar } from "@/components/overview-sidebar";
import { Sidebar } from "@/components/ui/sidebar";
import { WalletConnection } from "@/components/wallet-connection";
import HeaderImage from "@/components/header-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoading } from "@/context/LoadingContext";
import {
  useAuthorWallet,
  useAuthorManuscripts,
  useAuthorDashboardStats,
  useAuthorDashboardActions,
} from "@/hooks/author-dashboard";

import {
  AuthorDashboardHeader,
  AuthorStatsGrid,
  EmptyManuscriptsState,
  RecentSubmissions,
  ManuscriptCard,
  QuickActionsTab,
} from "@/components/author-dashboard";

export default function AuthorsDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { isLoading } = useLoading();
  const { connected, isWalletConnected } = useAuthorWallet();
  const { manuscripts, refreshManuscripts } = useAuthorManuscripts(
    useAuthorWallet().validSolanaPublicKey
  );
  const stats = useAuthorDashboardStats(manuscripts);
  const {
    navigateToSubmission,
    navigateToProfile,
    handleRefreshPage,
    handleViewManuscript,
    handleViewPublication,
  } = useAuthorDashboardActions();

  const handleRefreshStatus = async () => {
    await refreshManuscripts();
    handleRefreshPage();
  };

  if (isLoading) {
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
                {/* Header skeleton */}
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>

                {/* Stats grid skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-5 rounded" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Main content skeleton */}
                <Card>
                  <div className="p-8 space-y-6">
                    <div className="flex space-x-4 border-b">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-24" />
                      ))}
                    </div>
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="border rounded-lg p-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-4" />
                          <div className="flex space-x-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!isWalletConnected) {
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
            <AuthorDashboardHeader onNewSubmission={navigateToSubmission} />
            <AuthorStatsGrid stats={stats} />

            <Card className="shadow-xl border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm transition-all duration-300">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="border-b border-gray-100">
                  <TabsList className="w-full justify-start bg-transparent p-0 h-auto rounded-none">
                    <TabsTrigger
                      value="overview"
                      className="flex items-center space-x-2 rounded-none border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent px-6 py-4"
                    >
                      <BarChart3Icon className="w-4 h-4" />
                      <span>Overview</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="manuscripts"
                      className="flex items-center space-x-2 rounded-none border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent px-6 py-4"
                    >
                      <BookOpenIcon className="w-4 h-4" />
                      <span>Manuscripts</span>
                      {manuscripts.length > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {manuscripts.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="actions"
                      className="flex items-center space-x-2 rounded-none border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent px-6 py-4"
                    >
                      <TrendingUpIcon className="w-4 h-4" />
                      <span>Actions</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="p-8 space-y-6">
                  {manuscripts.length > 0 ? (
                    <RecentSubmissions manuscripts={stats.recentManuscripts} />
                  ) : (
                    <EmptyManuscriptsState
                      onSubmitManuscript={navigateToSubmission}
                      variant="overview"
                    />
                  )}
                </TabsContent>

                <TabsContent value="manuscripts" className="p-8">
                  {manuscripts.length === 0 ? (
                    <EmptyManuscriptsState
                      onSubmitManuscript={navigateToSubmission}
                      variant="manuscripts"
                    />
                  ) : (
                    <div className="space-y-6">
                      {manuscripts.map((manuscript) => (
                        <ManuscriptCard
                          key={manuscript.id}
                          manuscript={manuscript}
                          onViewManuscript={handleViewManuscript}
                          onViewPublication={handleViewPublication}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="p-8">
                  <QuickActionsTab
                    onNewSubmission={navigateToSubmission}
                    onRefreshStatus={handleRefreshStatus}
                    onViewProfile={navigateToProfile}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
