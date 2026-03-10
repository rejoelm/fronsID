"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { use } from "react";

export default function JournalHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { login, logout, authenticated, user } = usePrivy();
  const { slug } = use(params);

  return (
    <main className="min-h-screen bg-black text-white relative">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none" />

      {/* Navbar */}
      <nav className="z-50 w-full flex items-center justify-between px-8 py-4 fixed top-0 left-0 right-0 glassmorphism border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <img src="/frons-logo.png" alt="FRONS Logo" className="h-8 md:h-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          <span className="font-bold text-xl tracking-tighter text-white">FRONS-J</span>
        </Link>
        <div>
          {authenticated ? (
             <div className="flex gap-4 items-center">
               <span className="text-gray-300 text-sm hidden md:block px-4 py-2 glassmorphism rounded-full font-mono">
                 {user?.email?.address || user?.wallet?.address}
               </span>
               <button onClick={logout} className="px-5 py-2 glassmorphism rounded-full text-sm font-medium hover:bg-white/10 transition-all text-red-400">Logout</button>
             </div>
          ) : (
             <button onClick={login} className="px-6 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-200 transition-all">Login</button>
          )}
        </div>
      </nav>

      <div className="pt-32 px-8 max-w-6xl mx-auto flex flex-col md:flex-row gap-12 relative z-10">
        
        {/* Sidebar / Info */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <div className="p-8 glassmorphism rounded-3xl">
            <h1 className="text-4xl font-extrabold mb-2 capitalize">{slug.replace("-", " ")}</h1>
            <p className="text-gray-400 text-sm mb-6">Open-access, peer-reviewed scientific breakthroughs secured on Solana.</p>
            
            <div className="flex flex-col gap-3">
              <Link href={`/${slug}/submit`} className="w-full text-center px-6 py-3 bg-white text-black rounded-xl font-bold hover:scale-[1.02] transition-transform">
                Submit Manuscript
              </Link>
              <Link href={`/${slug}/editorial`} className="w-full text-center px-6 py-3 glassmorphism text-white border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-colors">
                Editorial Board Access
              </Link>
            </div>
          </div>

          <div className="p-6 glassmorphism rounded-2xl">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Journal Statistics</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Published</span>
                <span className="font-mono text-xl font-bold">124</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">In Review</span>
                <span className="font-mono text-xl font-bold">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Impact Score</span>
                <span className="font-mono text-xl font-bold text-blue-400">4.8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="w-full md:w-2/3">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-500 rounded-full inline-block"></span>
            Recent Publications
          </h2>
          
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 glassmorphism rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">DOCI Minted</span>
                  <span className="text-gray-500 text-sm">March 10, 2026</span>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">Quantum Supremacy in Superconducting Qubits</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  We report on the experimental realization of quantum supremacy using a programmable superconducting processor...
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500"></div>
                  <span className="text-sm text-gray-300">Dr. Alice Smith, et al.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
