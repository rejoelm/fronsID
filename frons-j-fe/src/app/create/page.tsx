"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { useState } from "react";

export default function CreateJournalPage() {
  const { authenticated, login } = usePrivy();
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Journal registered successfully on Solana!");
      window.location.href = "/nature-xyz";
    }, 2000);
  };

  return (
    <main className="min-h-screen p-8 md:p-24 bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px]" />

      <Link href="/" className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors">
        &larr; Back to Home
      </Link>

      <div className="z-10 w-full max-w-lg glassmorphism p-10 rounded-2xl shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Register a Journal</h1>
          <p className="text-gray-400">Deploy your institution's smart contract on Solana.</p>
        </div>

        {!authenticated ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-gray-300 mb-6 text-center">You need to connect your account to register a new journal.</p>
            <button onClick={login} className="px-8 py-4 bg-white text-black font-bold rounded-full w-full hover:scale-105 transition-transform">
              Login via Email or Wallet
            </button>
          </div>
        ) : (
          <form className="flex flex-col gap-6" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Journal Name</label>
              <input 
                required
                className="w-full p-4 bg-black/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-gray-600 text-white" 
                placeholder="e.g. Nature XYZ" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Custom Subdomain</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-700/50 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                <span className="bg-black/80 px-4 flex items-center text-gray-500 select-none border-r border-gray-700/50">
                  https://
                </span>
                <input 
                  required
                  id="slug"
                  className="w-full p-4 bg-black/50 focus:outline-none text-white placeholder-gray-600" 
                  placeholder="nature-xyz" 
                  pattern="[a-z0-9-]+"
                  title="Only lowercase letters, numbers, and hyphens are allowed."
                />
                <span className="bg-black/80 px-4 flex items-center text-gray-500 select-none border-l border-gray-700/50">
                  .frons.id
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <textarea 
                required
                className="w-full p-4 bg-black/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-gray-600 text-white resize-none" 
                placeholder="Brief description of the journal's scope..." 
                rows={4} 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg mt-4 transition-all ${
                loading ? "bg-blue-600/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
              }`}
            >
              {loading ? "Approving Transaction..." : "Initialize on Solana"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
