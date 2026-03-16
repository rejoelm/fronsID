"use client";

import { useState } from "react";
import {
  FileText, Upload, Users, Tag, BookOpen, DollarSign,
  Loader2, CheckCircle, ArrowLeft, AlertTriangle, X
} from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Link from "next/link";

const FIELDS_OF_STUDY = [
  "Medicine", "Biology", "Chemistry", "Physics", "Computer Science",
  "Environmental Science", "Psychology", "Public Health", "Pharmacology",
  "Neuroscience", "Genetics", "Epidemiology", "Nursing", "Dentistry",
  "Veterinary Medicine", "Agricultural Science", "Materials Science", "Other",
];

interface Author {
  name: string;
  wallet: string;
  affiliation: string;
}

export default function SubmitManuscriptPage() {
  const { authenticated, user, login } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = user?.wallet?.address || wallets[0]?.address;

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [field, setField] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [authors, setAuthors] = useState<Author[]>([
    { name: "", wallet: activeWallet || "", affiliation: "" },
  ]);
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !keywords.includes(kw) && keywords.length < 10) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  };

  const addAuthor = () => {
    setAuthors([...authors, { name: "", wallet: "", affiliation: "" }]);
  };

  const updateAuthor = (idx: number, field: keyof Author, value: string) => {
    const updated = [...authors];
    updated[idx][field] = value;
    setAuthors(updated);
  };

  const removeAuthor = (idx: number) => {
    if (authors.length > 1) {
      setAuthors(authors.filter((_, i) => i !== idx));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !abstract || !field || !manuscriptFile) {
      setError("Please fill in all required fields and upload your manuscript.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      // In production:
      // 1. Encrypt manuscript with session key
      // 2. Upload to Walrus
      // 3. Call Solana submit_manuscript (pays $50 USDC fee)
      // 4. Save metadata to Supabase
      await new Promise((r) => setTimeout(r, 2000));
      setSubmitted(true);
    } catch (err) {
      setError("Submission failed. Please try again.");
    }
    setIsSubmitting(false);
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-[#2C337A] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#2C337A] mb-2">Submit Manuscript</h1>
          <p className="text-gray-500 mb-6">Connect your wallet to submit a paper for peer review</p>
          <button onClick={login} className="bg-[#2C337A] text-white px-8 py-3 rounded-xl font-semibold">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#2C337A] mb-2">Manuscript Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Your manuscript has been submitted for peer review. The $50 USDC submission fee
            has been split: 40% platform, 30% sharing pool, 10% author deposit (returned if published),
            20% protocol reserve.
          </p>
          <Link href="/dashboard" className="bg-[#2C337A] text-white px-8 py-3 rounded-xl font-semibold">
            View in Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FD]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#2C337A] mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-[#2C337A] mb-2">Submit Manuscript</h1>
        <p className="text-gray-500 mb-8">
          Submit your paper to the Fronsciers on-chain peer-reviewed library
        </p>

        {/* Fee Notice */}
        <div className="bg-[#E5E0FE] rounded-xl p-4 mb-8 flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-[#2C337A] mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#2C337A]">Submission Fee: $50 USDC</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Split: 40% platform · 30% sharing pool · 10% author deposit (refunded on publish) · 20% reserve
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-[#2C337A] mb-2 block">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter manuscript title..." required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C337A]" />
          </div>

          {/* Abstract */}
          <div>
            <label className="text-sm font-semibold text-[#2C337A] mb-2 block">Abstract *</label>
            <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)}
              placeholder="Enter abstract..." rows={6} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C337A] resize-none" />
            <p className="text-xs text-gray-400 mt-1">{abstract.length} characters</p>
          </div>

          {/* Field of Study */}
          <div>
            <label className="text-sm font-semibold text-[#2C337A] mb-2 block">Field of Study *</label>
            <select value={field} onChange={(e) => setField(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C337A] bg-white">
              <option value="">Select field...</option>
              {FIELDS_OF_STUDY.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Keywords */}
          <div>
            <label className="text-sm font-semibold text-[#2C337A] mb-2 block">Keywords</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {keywords.map((kw) => (
                <span key={kw} className="flex items-center gap-1 bg-[#E5E0FE] text-[#2C337A] text-xs px-3 py-1 rounded-full">
                  {kw}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setKeywords(keywords.filter((k) => k !== kw))} />
                </span>
              ))}
            </div>
            <input type="text" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              placeholder="Add keyword and press Enter..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]" />
          </div>

          {/* Authors */}
          <div>
            <label className="text-sm font-semibold text-[#2C337A] mb-2 block">Authors *</label>
            {authors.map((author, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input type="text" value={author.name} onChange={(e) => updateAuthor(idx, "name", e.target.value)}
                  placeholder="Name" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]" />
                <input type="text" value={author.affiliation} onChange={(e) => updateAuthor(idx, "affiliation", e.target.value)}
                  placeholder="Institution" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]" />
                <input type="text" value={author.wallet} onChange={(e) => updateAuthor(idx, "wallet", e.target.value)}
                  placeholder="Solana wallet" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]" />
                {authors.length > 1 && (
                  <button type="button" onClick={() => removeAuthor(idx)} className="text-red-400 hover:text-red-600 px-2">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addAuthor} className="text-sm text-[#2C337A] font-semibold hover:underline flex items-center gap-1">
              <Users className="w-4 h-4" /> Add Author
            </button>
          </div>

          {/* Manuscript File */}
          <div>
            <label className="text-sm font-semibold text-[#2C337A] mb-2 block">Manuscript File *</label>
            <input type="file" accept=".pdf,.doc,.docx,.tex" onChange={(e) => setManuscriptFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
            <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, or LaTeX. File will be encrypted before upload.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-[#FB7720] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#e56a1a] transition disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
              <Upload className="w-5 h-5" /> Submit & Pay $50 USDC
            </>}
          </button>
        </form>
      </div>
    </div>
  );
}
