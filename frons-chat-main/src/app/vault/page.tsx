"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lock, Upload, FileText, Image, Database, Trash2,
  Download, Share2, Search, Filter, FolderOpen,
  Shield, Eye, EyeOff, RefreshCw, HardDrive, Key
} from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface VaultFile {
  id: string;
  name: string;
  file_type: "clinical" | "dataset" | "manuscript" | "personal";
  format: string;
  size_bytes: number;
  uploaded_at: string;
  walrus_blob_id: string;
  is_published: boolean;
  has_synthetic: boolean;
  active_shares: number;
  tags: string[];
}

const FILE_TYPE_ICONS: Record<string, typeof FileText> = {
  clinical: Shield,
  dataset: Database,
  manuscript: FileText,
  personal: FolderOpen,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  clinical: "bg-red-50 text-red-700 border-red-200",
  dataset: "bg-blue-50 text-blue-700 border-blue-200",
  manuscript: "bg-purple-50 text-purple-700 border-purple-200",
  personal: "bg-gray-50 text-gray-700 border-gray-200",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function VaultPage() {
  const { ready, authenticated, user, login } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = user?.wallet?.address || wallets[0]?.address;

  const [files, setFiles] = useState<VaultFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState("");
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(104857600); // 100MB default
  const [fileCount, setFileCount] = useState(0);
  const [fileLimit, setFileLimit] = useState(3);

  const loadFiles = useCallback(async () => {
    if (!activeWallet) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vault_files")
        .select("*")
        .eq("user_id", activeWallet)
        .is("deleted_at", null)
        .order("uploaded_at", { ascending: false });

      if (!error && data) {
        setFiles(data);
        setStorageUsed(data.reduce((acc: number, f: VaultFile) => acc + f.size_bytes, 0));
        setFileCount(data.length);
      }
    } catch (err) {
      console.error("Failed to load vault files:", err);
    }
    setIsLoading(false);
  }, [activeWallet]);

  useEffect(() => {
    if (authenticated && isVaultUnlocked) {
      loadFiles();
    }
  }, [authenticated, isVaultUnlocked, loadFiles]);

  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      searchQuery === "" ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === "all" || f.file_type === filterType;
    return matchesSearch && matchesType;
  });

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Lock className="w-16 h-16 text-[#2C337A] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#2C337A] mb-2">My Vault</h1>
          <p className="text-gray-600 mb-6">
            Your encrypted personal data vault. All files are encrypted in your
            browser — the platform cannot read your data.
          </p>
          <button
            onClick={login}
            className="bg-[#2C337A] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#1e2456] transition"
          >
            Connect to Access Vault
          </button>
        </div>
      </div>
    );
  }

  if (!isVaultUnlocked) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Key className="w-12 h-12 text-[#2C337A] mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-[#2C337A]">Unlock Vault</h2>
            <p className="text-gray-500 text-sm mt-1">
              Enter your vault passphrase to decrypt your files
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (vaultPassphrase.length >= 8) {
                setIsVaultUnlocked(true);
              }
            }}
          >
            <input
              type="password"
              value={vaultPassphrase}
              onChange={(e) => setVaultPassphrase(e.target.value)}
              placeholder="Enter vault passphrase..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C337A] mb-4"
              minLength={8}
            />
            <button
              type="submit"
              disabled={vaultPassphrase.length < 8}
              className="w-full bg-[#2C337A] text-white py-3 rounded-xl font-semibold hover:bg-[#1e2456] transition disabled:opacity-50"
            >
              Unlock Vault
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">
            Zero-knowledge encryption — your passphrase never leaves your browser
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FD]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#2C337A] tracking-tight">
                My Vault
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                End-to-end encrypted file storage
              </p>
            </div>
            <Link
              href="/vault/upload"
              className="flex items-center gap-2 bg-[#FB7720] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#e56a1a] transition"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </Link>
          </div>

          {/* Storage Bar */}
          <div className="mt-4 bg-[#E5E0FE] rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#2C337A] h-full rounded-full transition-all"
              style={{
                width: `${Math.min((storageUsed / storageLimit) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>
              {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
            </span>
            <span>
              {fileCount} / {fileLimit === -1 ? "∞" : fileLimit} files
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]"
            />
          </div>
          <div className="flex gap-2">
            {["all", "clinical", "dataset", "manuscript", "personal"].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filterType === type
                      ? "bg-[#2C337A] text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* File Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-[#2C337A] animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-20">
            <HardDrive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">
              {files.length === 0 ? "Your vault is empty" : "No matching files"}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {files.length === 0
                ? "Upload your first encrypted file to get started"
                : "Try adjusting your search or filters"}
            </p>
            {files.length === 0 && (
              <Link
                href="/vault/upload"
                className="inline-flex items-center gap-2 bg-[#FB7720] text-white px-6 py-3 rounded-xl font-semibold"
              >
                <Upload className="w-4 h-4" />
                Upload First File
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => {
              const Icon = FILE_TYPE_ICONS[file.file_type] || FileText;
              return (
                <div
                  key={file.id}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-lg border ${FILE_TYPE_COLORS[file.file_type]}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">
                        Encrypted
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-[#2C337A] truncate mb-1">
                    {file.name}
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    {formatBytes(file.size_bytes)} · {file.format.toUpperCase()} ·{" "}
                    {new Date(file.uploaded_at).toLocaleDateString()}
                  </p>
                  {file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {file.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-[#E5E0FE] text-[#2C337A] px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                    <button className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-[#2C337A] py-1.5 rounded-lg hover:bg-gray-50 transition">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-[#2C337A] py-1.5 rounded-lg hover:bg-gray-50 transition">
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </button>
                    <button className="flex items-center justify-center text-xs text-gray-400 hover:text-red-500 py-1.5 px-2 rounded-lg hover:bg-red-50 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
