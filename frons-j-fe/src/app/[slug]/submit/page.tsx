"use client";

import Link from "next/link";
import { useState, use } from "react";

export default function SubmitArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { slug } = use(params);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Manuscript uploaded to IPFS and submitted to Solana successfully! Transaction fees were subsidized.");
      window.location.href = `/${slug}`;
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-black text-white relative flex flex-col items-center py-24 px-8">
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-green-600/20 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none" />

      <Link href={`/${slug}`} className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors">
        &larr; Back to Journal
      </Link>

      <div className="z-10 w-full max-w-2xl glassmorphism p-10 rounded-3xl mt-12">
        <div className="mb-10 text-center">
          <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-blue-500/10 text-xs font-bold text-blue-400 uppercase tracking-widest">
            {slug.replace("-", " ")}
          </div>
          <h1 className="text-4xl font-extrabold mb-2">Submit Manuscript</h1>
          <p className="text-gray-400">Upload your research. Gas fees are fully subsidized by the protocol.</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title of Manuscript</label>
            <input 
              required
              className="w-full p-4 bg-black/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-gray-600" 
              placeholder="Enter full title..." 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Upload PDF Document</label>
            <label className="w-full flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-700/50 rounded-xl hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-blue-400">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">{file ? file.name : "PDF (Max 10MB)"}</p>
              </div>
              <input type="file" className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-4 mt-2">
            <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm text-blue-200">
              <strong>Seamless Web3:</strong> You do not need Solana or a wallet extension. The 50 USDC submission fee will be deducted, and the network fees will be sponsored automatically.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg mt-4 transition-all flex justify-center items-center gap-2 ${
              loading ? "bg-white/20 cursor-not-allowed" : "bg-white text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing Transaction...
              </>
            ) : "Submit & Anchor to Solana"}
          </button>
        </form>
      </div>
    </main>
  );
}
