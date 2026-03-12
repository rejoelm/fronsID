"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadToWalrus } from "@/utils/walrus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Sidebar } from "@/components/ui/sidebar";
import { OverviewSidebar } from "@/components/overview-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

import { Database, UploadCloud, Settings, Users, FileText, Fingerprint } from "lucide-react";

export default function GlobalAdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Bypass Privy for local Developer Admin testing
  const connected = true;
  const activeWallet = "FronsMasterAdmin";

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("analytics");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mock checking for Admin role. In production, check from a secured Supabase list or token.
  useEffect(() => {
    if (activeWallet) {
      // Simulating Admin verification
      // For now, allow the user to view it as Admin
      setIsAdmin(true); 
    } else {
      setIsAdmin(false);
    }
  }, [activeWallet]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white dark:bg-navy-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900 dark:border-white"></div>
      </div>
    );
  }

  if (isAdmin === null) return <div className="min-h-screen flex items-center justify-center">Verifying credentials...</div>;
  if (isAdmin === false) return <div className="min-h-screen flex items-center justify-center">Access Denied: Admin Privileges Required</div>;

  return (
    <div className="min-h-screen bg-off-white dark:bg-navy-900 flex w-full">
      <div className="hidden lg:block">
        <Sidebar>
          <OverviewSidebar connected={connected} />
        </Sidebar>
      </div>

      <main className="flex-1 py-8 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-4xl font-extrabold text-navy-900 dark:text-white mb-2 tracking-tight">Global Admin Console</h1>
            <p className="text-gray-500 dark:text-gray-400">Master control panel for the FRONS ecosystem. Manage infrastructure, analytics, and AI seeding.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-2xl bg-white/50 border border-gray-200 shadow-sm p-1 rounded-xl">
              <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <Database className="w-4 h-4 mr-2" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="apiconfig" className="rounded-lg data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <Settings className="w-4 h-4 mr-2" /> Protocols & Vendors
              </TabsTrigger>
              <TabsTrigger value="aiseeding" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <UploadCloud className="w-4 h-4 mr-2" /> AI Evidence Seeds
              </TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <TabsContent value="analytics" className="space-y-6">
                <AnalyticsDashboard />
              </TabsContent>

              <TabsContent value="apiconfig" className="space-y-6">
                <ProtocolConfigDashboard />
              </TabsContent>

              <TabsContent value="aiseeding" className="space-y-6">
                <AISeedingDashboard activeWallet={activeWallet} />
              </TabsContent>
            </div>
          </Tabs>

        </div>
      </main>
      <Toaster />
    </div>
  );
}

// -------------------------------------------------------------------------------------
// Sub-Components (Placeholders for 9.2, 9.3, 9.4)
// -------------------------------------------------------------------------------------

function AnalyticsDashboard() {
  const [stats, setStats] = useState({ users: 0, blobs: 0, chats: 0, doci: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [
          { count: usersCount },
          { count: blobsCount },
          { count: chatsCount },
        ] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("walrus_blobs").select("*", { count: "exact", head: true }),
          supabase.from("chat_history").select("*", { count: "exact", head: true }),
        ]);

        // In a real rollout, DOCI count would query the Solana RPC. 
        // For now, we mock it or query a localized index if available.
        setStats({
          users: usersCount || 0,
          blobs: blobsCount || 0,
          chats: chatsCount || 0,
          doci: Math.floor((usersCount || 0) * 1.5) // Placeholder
        });
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <Card className="shadow-lg border-0 border-t-4 border-t-navy-600 rounded-2xl">
      <CardHeader>
        <CardTitle>Ecosystem Analytics</CardTitle>
        <CardDescription>Real-time data aggregated from Supabase across all products.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={<Users className="w-6 h-6 text-blue-500"/>} title="Total Active Users" value={loading ? "..." : stats.users} />
          <StatCard icon={<Fingerprint className="w-6 h-6 text-green-500"/>} title="DOCI NFTs Minted" value={loading ? "..." : stats.doci} />
          <StatCard icon={<Database className="w-6 h-6 text-purple-500"/>} title="Walrus Blobs" value={loading ? "..." : stats.blobs} />
          <StatCard icon={<FileText className="w-6 h-6 text-orange-500"/>} title="AI Chat Sessions" value={loading ? "..." : stats.chats} />
        </div>
      </CardContent>
    </Card>
  );
}

function ProtocolConfigDashboard() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from('protocol_config').select('*').order('key_name');
      if (data) setConfigs(data);
      setLoading(false);
    }
    fetchConfig();
  }, []);

  const handleSave = async (key_name: string, key_value: string) => {
    setSaving(true);
    const { error } = await supabase.from('protocol_config').upsert({ key_name, key_value });
    setSaving(false);
    if (error) {
      toast({ title: "Error Saving Config", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Config Saved", description: `Updated ${key_name} successfully.` });
    }
  };

  return (
    <Card className="shadow-lg border-0 border-t-4 border-t-gray-600 rounded-2xl">
      <CardHeader>
        <CardTitle>Vendor API Management</CardTitle>
        <CardDescription>Modify protected credentials for third-party infrastructure. Changes are recorded in the `protocol_config` table.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-gray-500 italic">Loading parameters...</p> : (
          <div className="space-y-6">
            {configs.length === 0 && <p className="text-gray-500 italic">No configurations found. Add some in the Supabase Dashboard.</p>}
            {configs.map((conf) => (
              <div key={conf.key_name} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-semibold text-gray-700">{conf.key_name.toUpperCase()}</label>
                  <p className="text-xs text-gray-500 mb-2">{conf.description}</p>
                  <Input 
                    type="password"
                    defaultValue={conf.key_value}
                    onChange={(e) => {
                      const updated = [...configs];
                      const idx = updated.findIndex(c => c.key_name === conf.key_name);
                      updated[idx].key_value = e.target.value;
                      setConfigs(updated);
                    }}
                  />
                </div>
                <Button 
                  onClick={() => handleSave(conf.key_name, conf.key_value)}
                  disabled={saving}
                  className="bg-navy-900"
                >
                  Save Sync
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AISeedingDashboard({ activeWallet }: { activeWallet: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleSeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return alert("Missing file or title");
    
    setUploading(true);
    toast({ title: "Uploading to Walrus...", description: "Anchoring bypassing smart contract review..." });
    
    try {
      const blob_id = await uploadToWalrus(file);
      
      const { error } = await supabase.from('admin_seeds').insert({
        blob_id,
        title,
        uploaded_by: activeWallet
      });

      if (error) throw error;
      
      toast({ title: "Seed Successful", description: `Walrus Blob ${blob_id} ingested into AI database.` });
      setFile(null);
      setTitle("");
    } catch (err: any) {
      toast({ title: "Seed Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 border-t-4 border-t-orange-500 rounded-2xl">
      <CardHeader>
        <CardTitle>Direct AI Evidence Seeding</CardTitle>
        <CardDescription>Upload high-quality PDFs directly to the Walrus Testnet to bootstrap the Evidence Cascade AI, bypassing the public peer-review pipeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSeed} className="space-y-6 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Title / Reference</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. 2024 Stanford Machine Learning Survey" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF Document</label>
            <Input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} required />
          </div>
          <Button type="submit" disabled={uploading} className="w-full bg-orange-500 hover:bg-orange-600">
            {uploading ? "Anchoring to Walrus..." : "Seed Database Directly"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, title, value }: { icon: any, title: string, value: string | number }) {
  return (
    <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500">{title}</h3>
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-navy-900">{value}</p>
    </div>
  );
}
