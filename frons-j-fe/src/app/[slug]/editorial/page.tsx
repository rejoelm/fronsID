"use client";

import Link from "next/link";
import { useState, use } from "react";

export default function EditorialDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const [publishing, setPublishing] = useState<number | null>(null);
  const { slug } = use(params);

  const handlePublish = (id: number) => {
    setPublishing(id);
    setTimeout(() => {
      setPublishing(null);
      alert("Article published and DOCI NFT minted successfully!");
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-black text-white relative">
      {/* Background blobs */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-red-600/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none" />

      {/* Navbar */}
      <nav className="z-50 w-full flex items-center px-8 py-4 fixed top-0 left-0 right-0 glassmorphism border-b border-white/5">
        <Link href={`/${slug}`} className="text-gray-400 hover:text-white mr-8">&larr; Back</Link>
        <div className="font-bold text-xl tracking-tighter text-white">Editorial Board <span className="text-purple-500 ml-2 bg-purple-500/10 px-3 py-1 text-sm rounded-full capitalize">{slug.replace("-", " ")}</span></div>
      </nav>

      <div className="pt-32 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 pb-24">
        
        {/* Main Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-yellow-500 rounded-full inline-block"></span>
              Needs Review
            </h2>
            <div className="flex flex-col gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-6 glassmorphism rounded-2xl border border-yellow-500/20">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 text-xs font-bold rounded-full">Pending (1/2 Reviews)</span>
                    <span className="text-gray-500 text-sm">Submitted 2 days ago</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4">Novel Approaches to Machine Learning in Genomics</h3>
                  <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-green-600/20 text-green-400 border border-green-600/50 hover:bg-green-600/40 rounded-xl transition font-medium">Accept</button>
                    <button className="flex-1 py-3 bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/40 rounded-xl transition font-medium">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 mt-8">
              <span className="w-2 h-8 bg-green-500 rounded-full inline-block"></span>
              Ready to Publish
            </h2>
            <div className="flex flex-col gap-4">
              {[3].map((i) => (
                <div key={i} className="p-6 glassmorphism rounded-2xl border border-green-500/20">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">Accepted (2/2)</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4">CRISPR-Cas9 Efficiency in Adult Stem Cells</h3>
                  <button 
                    onClick={() => handlePublish(i)}
                    className="w-full py-3 bg-white text-black font-bold rounded-xl transition-all hover:scale-[1.02]"
                  >
                    {publishing === i ? "Minting DOCI NFT..." : "Mint & Publish to Network"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 flex flex-col gap-6">
            <div className="p-6 glassmorphism rounded-3xl border border-purple-500/20">
              <h3 className="text-lg font-bold mb-4">Manage Board Members</h3>
              <p className="text-sm text-gray-400 mb-6">Add reviewers to the smart contract via their email or wallet address.</p>
              
              <div className="flex flex-col gap-3">
                <input className="p-3 bg-black/50 border border-gray-700/50 rounded-lg text-sm text-white" placeholder="Email or Solana Address" />
                <button className="py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-sm transition-colors">Add to Board</button>
              </div>

              <div className="mt-8">
                <h4 className="text-sm font-semibold mb-3 text-gray-300">Current Members (3)</h4>
                <ul className="flex flex-col gap-2">
                  <li className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
                    <span className="text-gray-300">alice@university.edu</span>
                    <button className="text-red-400 hover:text-red-300">Ext</button>
                  </li>
                  <li className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
                    <span className="text-gray-300">bob@research.org</span>
                    <button className="text-red-400 hover:text-red-300">Ext</button>
                  </li>
                  <li className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
                    <span className="text-gray-300 font-mono">HRXq...92sK</span>
                    <button className="text-red-400 hover:text-red-300">Ext</button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
