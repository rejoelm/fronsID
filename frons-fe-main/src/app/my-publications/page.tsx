"use client";

import { useEffect, useState } from "react";
import { useSafePrivy } from "@/hooks/useSafePrivy";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { getPrimarySolanaWallet } from "@/utils/wallet";
import { Connection, PublicKey } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";
import { isValidSolanaAddress } from "@/hooks/useProgram";

import { Sidebar } from "@/components/ui/sidebar";
import { OverviewSidebar } from "@/components/overview-sidebar";
import { WalletConnection } from "@/components/wallet-connection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fingerprint, ArrowRight, ExternalLink } from "lucide-react";

export default function MyPublicationsDashboard() {
  const { authenticated: connected } = useSafePrivy();
  const { wallets } = useSolanaWallets();
  const activeWallet = getPrimarySolanaWallet(wallets);
  const walletAddress = activeWallet?.address;

  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNfts() {
      if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
        setLoading(false);
        return;
      }

      try {
        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
          "confirmed"
        );
        const metaplex = new Metaplex(connection);
        const owner = new PublicKey(walletAddress);

        // Fetch all NFTs owned by the user
        const rawNfts = await metaplex.nfts().findAllByOwner({ owner });
        
        // Filter down to DOCI tokens. 
        // We know DOCI tokens start with either FRONS/R- (Phase 6 Implementation Plan)
        // or 10.fronsciers (Legacy plan). We will accept both.
        const dociNfts = rawNfts.filter((nft: any) => 
          nft.name.startsWith("FRONS") || nft.name.startsWith("10.fronsciers")
        );

        // Load JSON metadata for the visual rendering
        const loadedNfts = await Promise.all(
          dociNfts.map(async (nft) => {
            try {
              if (nft.model === 'metadata' && !nft.json) {
                const loaded = await metaplex.nfts().load({ metadata: nft as any });
                return loaded;
              }
              return nft;
            } catch {
              return nft;
            }
          })
        );

        setNfts(loadedNfts);
      } catch (err) {
        console.error("Failed to fetch DOCI NFTs via Metaplex:", err);
      } finally {
        setLoading(false);
      }
    }

    if (connected && walletAddress) {
      fetchNfts();
    }
  }, [connected, walletAddress]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-off-white dark:bg-navy-900 flex w-full">
        <div className="hidden lg:block"><Sidebar><OverviewSidebar connected={connected} /></Sidebar></div>
        <div className="flex-1 w-full"><main className="flex-1 container max-w-6xl mx-auto py-8"><WalletConnection /></main></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white dark:bg-navy-900 flex w-full">
      <div className="hidden lg:block">
        <Sidebar>
          <OverviewSidebar connected={connected} />
        </Sidebar>
      </div>

      <main className="flex-1 py-10 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-navy-900 dark:text-white mb-2 tracking-tight flex items-center">
                <Fingerprint className="w-8 h-8 mr-3 text-orange-500" /> Tokenized Ownership
              </h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-lg">
                Your published manuscripts and Vault datasets, cryptographically secured on the Solana blockchain through the Metaplex DOCI standard.
              </p>
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl border border-gray-200"></div>
                ))}
              </div>
            ) : nfts.length === 0 ? (
              <Card className="shadow-lg border-0 border-t-4 border-t-orange-500 rounded-2xl py-12 text-center bg-white">
                <CardContent className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-6 bg-orange-50 rounded-full">
                    <Fingerprint className="w-12 h-12 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-900">No DOCI Assets Found</h3>
                  <p className="text-gray-500 max-w-md">
                    You haven't published any articles or secured any datasets into an authentic Digital Object Citation Identifier (DOCI) yet.
                  </p>
                  <Button className="mt-4 bg-orange-500 hover:bg-orange-600">Submit a Manuscript</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map((nft) => (
                  <Card key={nft.address.toString()} className="group overflow-hidden relative shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 rounded-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Fingerprint className="w-24 h-24" />
                    </div>
                    
                    <CardHeader className="relative z-10 pb-2">
                      <div className="flex justify-between items-start">
                        <span className="px-3 py-1 bg-navy-100 text-navy-900 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">
                          DOCI ASSET
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold text-navy-900 leading-tight">
                        {nft.name}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs text-gray-500 mt-2 line-clamp-2">
                        Mint: {nft.mintAddress?.toString() || nft.address?.toString() || "Unknown"}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="relative z-10 mt-4 space-y-4">
                      {nft.json?.description && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {nft.json.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 pt-4 border-t border-gray-100">
                        {nft.json?.attributes?.map((attr: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-medium">{attr.trait_type}</span>
                            <span className="text-navy-900 font-bold max-w-[150px] truncate">{attr.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 flex gap-2">
                        <Button variant="outline" className="w-full text-xs" onClick={() => window.open(`https://explorer.solana.com/address/${nft.mintAddress?.toString() || nft.address?.toString()}?cluster=devnet`, '_blank')}>
                          View on Explorer <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
