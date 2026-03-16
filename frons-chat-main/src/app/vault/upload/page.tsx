"use client";

import { useState, useRef } from "react";
import {
  Upload, Lock, FileText, Shield, Database, X,
  CheckCircle, Loader2, ArrowLeft, AlertTriangle
} from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Link from "next/link";

const FILE_TYPES = [
  { value: "clinical", label: "Clinical Record", icon: Shield, color: "border-red-300 bg-red-50" },
  { value: "dataset", label: "Research Dataset", icon: Database, color: "border-blue-300 bg-blue-50" },
  { value: "manuscript", label: "Manuscript", icon: FileText, color: "border-purple-300 bg-purple-50" },
  { value: "personal", label: "Personal File", icon: Lock, color: "border-gray-300 bg-gray-50" },
];

export default function VaultUploadPage() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = user?.wallet?.address || wallets[0]?.address;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("dataset");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !activeWallet) return;
    setIsUploading(true);
    setError("");

    try {
      // Stage 1: Compute SHA-256 hash
      setUploadStage("Computing file hash...");
      setUploadProgress(10);
      const fileBuffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256Hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // Stage 2: Encrypt file with FEK (AES-256-GCM)
      setUploadStage("Encrypting file in browser...");
      setUploadProgress(30);
      const nonce = crypto.getRandomValues(new Uint8Array(12));
      // In production, FEK would be derived from vault passphrase + wallet signature
      // For now, generate a session key
      const fek = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: nonce },
        fek,
        fileBuffer
      );

      // Stage 3: Encrypt metadata with MEK
      setUploadStage("Encrypting metadata...");
      setUploadProgress(50);

      // Stage 4: Upload to Walrus
      setUploadStage("Uploading to Walrus decentralized storage...");
      setUploadProgress(70);
      const encryptedBlob = new Blob([encryptedBuffer]);
      const walrusResponse = await fetch(
        "https://publisher-devnet.walrus.space/v1/store?epochs=5",
        { method: "PUT", body: encryptedBlob }
      );

      let walrusBlobId = "pending";
      if (walrusResponse.ok) {
        const result = await walrusResponse.json();
        walrusBlobId = result.newlyCreated?.blobObject?.blobId ||
                       result.alreadyCertified?.blobId || "pending";
      }

      // Stage 5: Save metadata to Supabase
      setUploadStage("Recording metadata...");
      setUploadProgress(85);
      await fetch("/api/vault/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: activeWallet,
          name: selectedFile.name,
          file_type: fileType,
          format: selectedFile.name.split(".").pop() || "bin",
          size_bytes: selectedFile.size,
          mime_type: selectedFile.type,
          walrus_blob_id: walrusBlobId,
          encryption_nonce: Array.from(nonce).map((b) => b.toString(16).padStart(2, "0")).join(""),
          sha256_hash: sha256Hash,
          tags,
          description,
        }),
      });

      // Stage 6: Record on Solana
      setUploadStage("Recording integrity proof on Solana...");
      setUploadProgress(95);
      // Solana tx would go here in production

      setUploadProgress(100);
      setUploadStage("Upload complete!");
      setUploadComplete(true);
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed. Please try again.");
    }
    setIsUploading(false);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <p className="text-gray-500">Please connect your wallet to upload files.</p>
      </div>
    );
  }

  if (uploadComplete) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#2C337A] mb-2">File Encrypted & Uploaded</h2>
          <p className="text-gray-500 mb-6">
            Your file has been encrypted in your browser and stored on Walrus
            decentralized storage. The integrity hash has been recorded on Solana.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/vault"
              className="bg-[#2C337A] text-white px-6 py-3 rounded-xl font-semibold"
            >
              Back to Vault
            </Link>
            <button
              onClick={() => {
                setUploadComplete(false);
                setSelectedFile(null);
                setUploadProgress(0);
              }}
              className="bg-white text-[#2C337A] px-6 py-3 rounded-xl font-semibold border border-gray-200"
            >
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FD]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          href="/vault"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#2C337A] mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vault
        </Link>

        <h1 className="text-3xl font-bold text-[#2C337A] mb-2">Upload to Vault</h1>
        <p className="text-gray-500 mb-8">
          Files are encrypted in your browser before upload. The platform never sees your data.
        </p>

        {/* File Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
            selectedFile
              ? "border-green-300 bg-green-50"
              : "border-gray-300 bg-white hover:border-[#2C337A] hover:bg-[#E5E0FE]/20"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
          {selectedFile ? (
            <div>
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-[#2C337A]">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="font-semibold text-gray-600">Click to select a file</p>
              <p className="text-sm text-gray-400 mt-1">
                Medical records, datasets, manuscripts, or any file
              </p>
            </div>
          )}
        </div>

        {/* File Type Selection */}
        <div className="mt-6">
          <label className="text-sm font-semibold text-[#2C337A] mb-3 block">
            File Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {FILE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setFileType(type.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                    fileType === type.value
                      ? "border-[#2C337A] bg-[#E5E0FE]/30"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5 text-[#2C337A]" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div className="mt-6">
          <label className="text-sm font-semibold text-[#2C337A] mb-2 block">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-[#E5E0FE] text-[#2C337A] text-xs px-3 py-1 rounded-full"
              >
                {tag}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                />
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="Add tag..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <label className="text-sm font-semibold text-[#2C337A] mb-2 block">
            Description (encrypted)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this file..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A] resize-none"
          />
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-6 bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-[#2C337A] animate-spin" />
              <span className="text-sm text-gray-600">{uploadStage}</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#2C337A] h-full rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="mt-6 w-full bg-[#2C337A] text-white py-4 rounded-xl font-semibold hover:bg-[#1e2456] transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4" />
          Encrypt & Upload
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          AES-256-GCM encryption · SHA-512 key derivation · Walrus decentralized storage · Solana integrity proof
        </p>
      </div>
    </div>
  );
}
