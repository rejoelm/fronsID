"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/landing/footer";
import {
  Loader2,
  ArrowLeft,
  Shield,
  CheckCircle2,
  ExternalLink,
  Copy,
  Clock,
  Fingerprint,
  Link2,
  Award,
  Sparkles,
} from "lucide-react";

interface SoulboundToken {
  mint_address: string;
  token_id: string;
  researcher_wallet: string;
  institution: string;
  credential_type: string;
  issued_at: string;
  issuer: string;
  metadata_uri: string;
  verification_status: "verified" | "pending" | "expired";
  on_chain_tx: string;
  attributes: {
    h_index: number;
    papers_published: number;
    total_citations: number;
    verified_since: string;
    specializations: string[];
  };
}

const MOCK_SBT: SoulboundToken = {
  mint_address: "FroN5Sbt1dR8ejQmVcX2CpPkAh9qWnZ6bR1vKt3yN7Ud",
  token_id: "SBT-8A2B9F4C",
  researcher_wallet: "7xKp...vN3d",
  institution: "Stanford University",
  credential_type: "Verified Scholar",
  issued_at: "2025-09-15T12:00:00Z",
  issuer: "Fronsciers Protocol v1.0",
  metadata_uri: "https://arweave.net/abc123...metadata.json",
  verification_status: "verified",
  on_chain_tx:
    "5GxRf7YkVh2nZ4tPL8sW9bQe3dK1mN6jU0cA4xE2vF8hT3rD7yJ1wB5sM9kL2pQ6nX4",
  attributes: {
    h_index: 42,
    papers_published: 28,
    total_citations: 1091,
    verified_since: "2025-09-15",
    specializations: ["Bioinformatics", "Machine Learning", "CRISPR-Cas9"],
  },
};

function truncateAddress(addr: string, start = 6, end = 4): string {
  if (addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

export default function VerifyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const unwrappedParams = use(params);
  const [loading, setLoading] = useState(true);
  const [sbt, setSbt] = useState<SoulboundToken | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSbt(MOCK_SBT);
      setDisplayName(
        unwrappedParams.slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      );
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [unwrappedParams.slug]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#2C337A] animate-spin" />
      </div>
    );
  }

  if (!sbt) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">
              No Soulbound Token Found
            </h2>
            <p className="text-gray-500 mt-2">
              This researcher has not yet minted a verification badge.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FD] text-gray-900 font-sans selection:bg-[#FFC6DE] selection:text-[#2C337A] flex flex-col pt-16">
      <Navbar />

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back navigation */}
        <Link
          href={`/p/${unwrappedParams.slug}`}
          className="inline-flex items-center gap-2 text-[#2C337A] hover:text-[#FB7720] transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {displayName}&apos;s Profile
        </Link>

        {/* Main verification card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Top banner with gradient */}
          <div className="bg-gradient-to-r from-[#2C337A] via-[#4A55A2] to-[#7895CB] px-6 md:px-10 py-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  On-Chain Verification
                </h1>
                <p className="text-white/70 text-sm mt-1">
                  Soulbound Token (SBT) for {displayName}
                </p>
              </div>
            </div>

            {/* Status badge */}
            <div className="absolute top-6 right-6 md:top-8 md:right-10">
              {sbt.verification_status === "verified" ? (
                <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-full px-4 py-2">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span className="text-green-200 text-sm font-semibold">
                    Verified
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-full px-4 py-2">
                  <Clock className="w-5 h-5 text-yellow-300" />
                  <span className="text-yellow-200 text-sm font-semibold">
                    {sbt.verification_status === "pending"
                      ? "Pending"
                      : "Expired"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Token details */}
          <div className="p-6 md:p-10">
            {/* Token ID and type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#F8F8FD] rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Fingerprint className="w-4 h-4" />
                  Token ID
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-[#2C337A]">
                    {sbt.token_id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(sbt.token_id, "token_id")}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                  {copied === "token_id" && (
                    <span className="text-xs text-green-500">Copied!</span>
                  )}
                </div>
              </div>

              <div className="bg-[#F8F8FD] rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Award className="w-4 h-4" />
                  Credential Type
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#2C337A]">
                    {sbt.credential_type}
                  </span>
                  <Sparkles className="w-5 h-5 text-[#FB7720]" />
                </div>
              </div>
            </div>

            {/* On-chain details */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#2C337A]" />
              On-Chain Details
            </h3>

            <div className="space-y-3 mb-8">
              <DetailRow
                label="Mint Address"
                value={sbt.mint_address}
                fullValue={sbt.mint_address}
                onCopy={copyToClipboard}
                copied={copied}
                explorerUrl={`https://explorer.solana.com/address/${sbt.mint_address}?cluster=devnet`}
              />
              <DetailRow
                label="Transaction Signature"
                value={truncateAddress(sbt.on_chain_tx, 12, 8)}
                fullValue={sbt.on_chain_tx}
                onCopy={copyToClipboard}
                copied={copied}
                explorerUrl={`https://explorer.solana.com/tx/${sbt.on_chain_tx}?cluster=devnet`}
              />
              <DetailRow
                label="Researcher Wallet"
                value={sbt.researcher_wallet}
                fullValue={sbt.researcher_wallet}
                onCopy={copyToClipboard}
                copied={copied}
              />
              <DetailRow
                label="Issuer"
                value={sbt.issuer}
                fullValue={sbt.issuer}
                onCopy={copyToClipboard}
                copied={copied}
              />
              <DetailRow
                label="Issued At"
                value={new Date(sbt.issued_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                fullValue={sbt.issued_at}
                onCopy={copyToClipboard}
                copied={copied}
              />
              <DetailRow
                label="Institution"
                value={sbt.institution}
                fullValue={sbt.institution}
                onCopy={copyToClipboard}
                copied={copied}
              />
            </div>

            {/* Verified Attributes */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#2C337A]" />
              Verified Attributes
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <AttributeCard
                label="h-index"
                value={sbt.attributes.h_index.toString()}
                color="bg-[#E5E0FE]"
              />
              <AttributeCard
                label="Papers Published"
                value={sbt.attributes.papers_published.toString()}
                color="bg-[#FFC6DE]"
              />
              <AttributeCard
                label="Total Citations"
                value={sbt.attributes.total_citations.toLocaleString()}
                color="bg-[#E5E0FE]"
              />
              <AttributeCard
                label="Verified Since"
                value={new Date(
                  sbt.attributes.verified_since
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                })}
                color="bg-orange-50"
              />
            </div>

            {/* Specializations */}
            <div className="mb-8">
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Verified Specializations
              </h4>
              <div className="flex flex-wrap gap-2">
                {sbt.attributes.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-[#2C337A] text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Metadata link */}
            <div className="bg-[#F8F8FD] rounded-xl p-4 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Full Metadata (Arweave)</p>
                <p className="text-sm font-mono text-[#2C337A] truncate max-w-md">
                  {sbt.metadata_uri}
                </p>
              </div>
              <a
                href={sbt.metadata_uri}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-[#FB7720]" />
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center mt-6 max-w-xl mx-auto">
          This Soulbound Token is non-transferable and permanently bound to the
          researcher&apos;s wallet. It serves as an on-chain attestation of
          academic credentials verified by the Fronsciers protocol.
        </p>
      </main>

      <Footer />
    </div>
  );
}

function DetailRow({
  label,
  value,
  fullValue,
  onCopy,
  copied,
  explorerUrl,
}: {
  label: string;
  value: string;
  fullValue: string;
  onCopy: (text: string, label: string) => void;
  copied: string | null;
  explorerUrl?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-[#F8F8FD] border border-gray-100">
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-mono text-gray-800">{value}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onCopy(fullValue, label)}
          className="p-1.5 rounded hover:bg-white transition-colors"
          title="Copy to clipboard"
        >
          <Copy className="w-3.5 h-3.5 text-gray-400" />
        </button>
        {copied === label && (
          <span className="text-xs text-green-500">Copied!</span>
        )}
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-white transition-colors"
            title="View on Solana Explorer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#FB7720]" />
          </a>
        )}
      </div>
    </div>
  );
}

function AttributeCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`${color} rounded-xl p-4 text-center`}>
      <p className="text-2xl font-bold text-[#2C337A]">{value}</p>
      <p className="text-xs text-[#2C337A]/70 mt-1">{label}</p>
    </div>
  );
}
