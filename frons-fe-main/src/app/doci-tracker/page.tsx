"use client";
import React, { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  SearchIcon,
  ScanIcon,
  ClipboardIcon,
  ArrowRightIcon,
  AlertCircleIcon,
  FileTextIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { OverviewSidebar } from "@/components/overview-sidebar";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth";
import { useToast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DOCIManuscript } from "@/types/fronsciers";
import { isValidSolanaAddress } from "@/hooks/useProgram";
import { PublicKey } from "@solana/web3.js";
import { getPrimarySolanaWalletAddress } from "@/utils/wallet";
import HeaderImage from "@/components/header-image";
import { Skeleton } from "@/components/ui/skeleton";

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString();
};

export default function DocisPage() {
  const { authenticated: connected } = usePrivy();
  const { wallets } = useSolanaWallets();
  const publicKey = getPrimarySolanaWalletAddress(wallets);
  const validSolanaPublicKey = isValidSolanaAddress(publicKey)
    ? publicKey
    : undefined;
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [manuscripts, setManuscripts] = useState<DOCIManuscript[]>([]);
  const [filteredManuscripts, setFilteredManuscripts] = useState<
    DOCIManuscript[]
  >([]);

  const generateMockDOCIs = (): DOCIManuscript[] => {
    if (typeof window === "undefined") return []; // Prevent SSR issues

    try {
      return [
        {
          doci: "10.fronsciers/manuscript.2024.001.v1",
          manuscriptAccount: new PublicKey("11111111111111111111111111111111"),
          mintAddress: new PublicKey("22222222222222222222222222222222"),
          manuscriptHash: Array.from({ length: 32 }, (_, i) => i),
          authors: [new PublicKey("33333333333333333333333333333333")],
          peerReviewers: [
            new PublicKey("44444444444444444444444444444444"),
            new PublicKey("55555555555555555555555555555555"),
            new PublicKey("66666666666666666666666666666666"),
          ],
          publicationDate: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
          version: 1,
          citationCount: 23,
          accessCount: 156,
          metadataUri:
            "https://ipfs.io/ipfs/QmX7Y8Z9A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6",
          royaltyConfig: {
            authorsShare: 70,
            platformShare: 20,
            reviewersShare: 10,
          },
          bump: 255,
        },
        {
          doci: "10.fronsciers/manuscript.2024.002.v2",
          manuscriptAccount: new PublicKey("77777777777777777777777777777777"),
          mintAddress: new PublicKey("88888888888888888888888888888888"),
          manuscriptHash: Array.from({ length: 32 }, (_, i) => i + 32),
          authors: [
            new PublicKey("99999999999999999999999999999999"),
            new PublicKey("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
          ],
          peerReviewers: [
            new PublicKey("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"),
            new PublicKey("CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"),
            new PublicKey("DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"),
          ],
          publicationDate: Math.floor(Date.now() / 1000) - 86400 * 15, // 15 days ago
          version: 2,
          citationCount: 45,
          accessCount: 289,
          metadataUri:
            "https://ipfs.io/ipfs/QmA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0",
          royaltyConfig: {
            authorsShare: 70,
            platformShare: 20,
            reviewersShare: 10,
          },
          bump: 254,
        },
        {
          doci: "10.fronsciers/manuscript.2024.003.v1",
          manuscriptAccount: new PublicKey(
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE"
          ),
          mintAddress: new PublicKey("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
          manuscriptHash: Array.from({ length: 32 }, (_, i) => i + 64),
          authors: [new PublicKey("1111111111111111111111111111111112")],
          peerReviewers: [
            new PublicKey("1111111111111111111111111111111113"),
            new PublicKey("1111111111111111111111111111111114"),
            new PublicKey("1111111111111111111111111111111115"),
            new PublicKey("1111111111111111111111111111111116"),
          ],
          publicationDate: Math.floor(Date.now() / 1000) - 86400 * 7, // 7 days ago
          version: 1,
          citationCount: 12,
          accessCount: 78,
          metadataUri:
            "https://ipfs.io/ipfs/QmB2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1",
          royaltyConfig: {
            authorsShare: 70,
            platformShare: 20,
            reviewersShare: 10,
          },
          bump: 253,
        },
        {
          doci: "10.fronsciers/manuscript.2024.004.v1",
          manuscriptAccount: new PublicKey(
            "1111111111111111111111111111111117"
          ),
          mintAddress: new PublicKey("1111111111111111111111111111111118"),
          manuscriptHash: Array.from({ length: 32 }, (_, i) => i + 96),
          authors: [
            new PublicKey("1111111111111111111111111111111119"),
            new PublicKey("111111111111111111111111111111111A"),
            new PublicKey("111111111111111111111111111111111B"),
          ],
          peerReviewers: [
            new PublicKey("111111111111111111111111111111111C"),
            new PublicKey("111111111111111111111111111111111D"),
            new PublicKey("111111111111111111111111111111111E"),
          ],
          publicationDate: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
          version: 1,
          citationCount: 8,
          accessCount: 34,
          metadataUri:
            "https://ipfs.io/ipfs/QmC3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2",
          royaltyConfig: {
            authorsShare: 70,
            platformShare: 20,
            reviewersShare: 10,
          },
          bump: 252,
        },
        {
          doci: "10.fronsciers/manuscript.2024.005.v3",
          manuscriptAccount: new PublicKey(
            "111111111111111111111111111111111F"
          ),
          mintAddress: new PublicKey("1111111111111111111111111111111120"),
          manuscriptHash: Array.from({ length: 32 }, (_, i) => i + 128),
          authors: [new PublicKey("1111111111111111111111111111111121")],
          peerReviewers: [
            new PublicKey("1111111111111111111111111111111122"),
            new PublicKey("1111111111111111111111111111111123"),
            new PublicKey("1111111111111111111111111111111124"),
            new PublicKey("1111111111111111111111111111111125"),
            new PublicKey("1111111111111111111111111111111126"),
          ],
          publicationDate: Math.floor(Date.now() / 1000) - 86400 * 1, // 1 day ago
          version: 3,
          citationCount: 67,
          accessCount: 412,
          metadataUri:
            "https://ipfs.io/ipfs/QmD4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3",
          royaltyConfig: {
            authorsShare: 70,
            platformShare: 20,
            reviewersShare: 10,
          },
          bump: 251,
        },
      ];
    } catch (error) {
      console.error("Error generating mock DOCIs:", error);
      return [];
    }
  };

  // Initialize mock data on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mockData = generateMockDOCIs();
      setManuscripts(mockData);
      setFilteredManuscripts(mockData);
    }
  }, []);

  // Filter manuscripts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredManuscripts(manuscripts);
    } else {
      const filtered = manuscripts.filter(
        (manuscript) =>
          manuscript.doci.toLowerCase().includes(searchQuery.toLowerCase()) ||
          manuscript.mintAddress
            .toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredManuscripts(filtered);
    }
  }, [searchQuery, manuscripts]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Searching for DOCI:", searchQuery);

      toast.info("DOCI search functionality is coming soon!");

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error("DOCI search error:", error);
      setError("Failed to search DOCI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setSearchQuery(text.trim());
        toast.success("DOCI ID pasted from clipboard");
      } else {
        toast.error("Clipboard is empty");
      }
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      toast.error("Failed to read from clipboard");
    }
  };

  const handleScanQR = () => {
    toast.info("QR code scanning functionality is coming soon!");
  };

  const handleExampleSearch = (example: string) => {
    setSearchQuery(example);
    toast.info(`Example search "${example}" selected`);
  };

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
          <div className="mb-8">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by DOCI ID or mint address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 pr-24 h-12 text-base bg-white/80 border-gray-200 focus:border-primary focus:ring-primary"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePasteFromClipboard}
                    className="h-8 w-8 p-0"
                    title="Paste from clipboard"
                  >
                    <ClipboardIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleScanQR}
                    className="h-8 w-8 p-0"
                    title="Scan QR code"
                  >
                    <ScanIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <span className="text-sm text-muted-foreground">Examples:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleExampleSearch("10.fronsciers/manuscript.2024.001")
                  }
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                >
                  10.fronsciers/manuscript.2024.001
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExampleSearch("manuscript.2024.005")}
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                >
                  manuscript.2024.005
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-8">
              {/* Header skeleton */}
              <div className="text-center space-y-4">
                <Skeleton className="h-8 w-64 mx-auto" />
                <Skeleton className="h-4 w-96 mx-auto" />
              </div>

              {/* Search section skeleton */}
              <div className="max-w-2xl mx-auto space-y-4">
                {/* Search bar skeleton */}
                <div className="relative">
                  <Skeleton className="h-12 w-full" />
                </div>

                {/* Examples section skeleton */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              {/* DOCI cards grid skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card
                    key={i}
                    className="shadow-sm border border-gray-100 rounded-xl bg-white/80"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          {/* DOCI title */}
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <Skeleton className="h-5 w-48" />
                          </div>

                          {/* Badges section */}
                          <div className="space-y-3 mb-4">
                            <div className="flex flex-wrap gap-2">
                              <Skeleton className="h-5 w-20" />
                              <Skeleton className="h-5 w-16" />
                            </div>
                          </div>

                          {/* Version and publish date */}
                          <div className="space-y-2 mb-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : error ? (
            <Card className="shadow-sm border border-gray-100 rounded-xl bg-white/80 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-8 text-center">
                <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-primary mb-2">
                  Error
                </h2>
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          ) : filteredManuscripts.length === 0 && searchQuery.trim() ? (
            <Card className="shadow-sm border border-gray-100 rounded-xl bg-white/80 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-8 text-center">
                <SearchIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-primary mb-2">
                  No Results Found
                </h2>
                <p className="text-muted-foreground">
                  No DOCIs found matching &quot;{searchQuery}&quot;. Try a
                  different search term.
                </p>
              </CardContent>
            </Card>
          ) : manuscripts.length === 0 ? (
            <Card className=" ">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold text-primary mb-2">
                  No DOCIs Found
                </h2>
                <p className="text-muted-foreground">
                  You have not minted any DOCIs for your manuscripts yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery.trim() ? (
                    <>
                      Showing {filteredManuscripts.length} result
                      {filteredManuscripts.length !== 1 ? "s" : ""} for &quot;
                      {searchQuery}&quot;
                    </>
                  ) : (
                    <>
                      Showing {filteredManuscripts.length} published DOCI
                      {filteredManuscripts.length !== 1 ? "s" : ""}
                    </>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredManuscripts.map((manuscript) => (
                  <Card
                    key={manuscript.doci}
                    className="shadow-sm border border-gray-100 rounded-xl bg-white/80 hover:shadow-lg transition-all duration-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <h3 className="font-medium text-primary leading-tight">
                              DOCI: {manuscript.doci}
                            </h3>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="secondary"
                                className="bg-primary/10 text-primary text-xs"
                              >
                                Citations: {manuscript.citationCount}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="bg-primary/10 text-primary text-xs"
                              >
                                Access: {manuscript.accessCount}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>Version: {manuscript.version}</p>
                            <p>
                              Published:{" "}
                              {formatDate(manuscript.publicationDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(manuscript.metadataUri, "_blank")
                            }
                            className="text-xs"
                          >
                            <ExternalLinkIcon className="h-3 w-3 mr-1" />
                            View Metadata
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `https://explorer.solana.com/address/${manuscript.mintAddress}?cluster=devnet`,
                                "_blank"
                              )
                            }
                            className="text-xs"
                          >
                            <ExternalLinkIcon className="h-3 w-3 mr-1" />
                            View NFT
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
