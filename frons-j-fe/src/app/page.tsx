"use client";

import { useState } from "react";
import Link from 'next/link';
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase conditionally so it doesn't crash without .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!supabase) {
      setMessage("Supabase is not configured yet. Please add credentials to .env.local");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email, created_at: new Date() }]);

      if (error) throw error;
      setMessage("Success! You have been added to the waitlist.");
      setEmail("");
    } catch (err: any) {
      setMessage(`Error: ${err.message || "Failed to join waitlist"}`);
    } finally {
      setLoading(false);
    }
  };

  const scrollToWaitlist = () => {
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="relative flex min-h-screen flex-col bg-black text-white font-sans overflow-x-hidden selection:bg-blue-500/30">
      
      {/* GLOBAL BACKGROUND EFFECTS */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />
      <div className="fixed top-[40%] left-[40%] w-[30%] h-[30%] bg-pink-600/5 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />

      {/* NAVBAR */}
      <nav className="z-50 w-full flex items-center justify-between px-6 py-4 fixed top-0 left-0 right-0 glassmorphism border-b border-white/5 backdrop-blur-xl bg-black/40">
        <div className="flex items-center gap-3">
          <img src="/frons-logo.png" alt="FRONS Logo" className="h-8 md:h-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          <span className="font-bold text-xl md:text-2xl tracking-tighter text-white">FRONS-J</span>
        </div>
        <div>
          <button onClick={scrollToWaitlist} className="px-5 py-2 glassmorphism rounded-full text-sm font-semibold hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Join Waitlist
          </button>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="relative z-10 w-full flex flex-col items-center justify-center text-center pt-40 md:pt-52 px-6 pb-20 md:pb-32 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-bold tracking-widest text-blue-300 uppercase shadow-[0_0_20px_rgba(59,130,246,0.15)]">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          The Ultimate Journal Infrastructure
        </div>
        
        <h1 className="font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tight mb-8 leading-tight">
          Launch Your Journal <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            in Minutes.
          </span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl font-light mb-12 leading-relaxed">
          A radically simple website builder for Scientific Editorial Boards. Claim your custom <strong className="text-white">journal.frons.id</strong>, manage submissions effortlessly, and secure your IP—all without writing a single line of code.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button onClick={scrollToWaitlist} className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2">
            Build Your Journal <span className="text-xl">&rarr;</span>
          </button>
          <Link href="/nature-xyz" className="px-8 py-4 glassmorphism text-white border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-colors flex items-center justify-center">
            View Live Demo
          </Link>
        </div>
      </section>

      {/* 2. PROBLEM SECTION */}
      <section className="relative z-10 w-full bg-white/5 border-y border-white/5 py-24 px-6 backdrop-blur-md">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Legacy systems are holding science back.</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Setting up a robust journal infrastructure shouldn't require an IT department.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🛠️", title: "Technical Overhead", desc: "Open Journal Systems (OJS) and traditional platforms are clunky, hard to host, and a nightmare to maintain." },
              { icon: "💰", title: "No Monetization", desc: "Journals lack native mechanisms to easily collect submission fees or generate ongoing Web3 revenue." },
              { icon: "📉", title: "Poor User Experience", desc: "Outdated, siloed interfaces frustrate authors submitting papers and reviewers evaluating them." },
              { icon: "🤖", title: "AI Web Scraping", desc: "LLMs freely ingest valuable scientific IP without attribution or cryptographic copyright protection." }
            ].map((problem, i) => (
              <div key={i} className="bg-black/40 border border-white/5 p-8 rounded-3xl hover:border-blue-500/30 transition-colors group">
                <div className="text-4xl mb-4 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{problem.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-white/90">{problem.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{problem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SOLUTION SECTION */}
      <section className="relative z-10 w-full py-24 px-6 max-w-6xl mx-auto">
         <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Out-of-the-Box <span className="text-blue-400">Simplicity</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Everything a modern publisher needs, accessible immediately.</p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { tag: "01", title: "Custom .frons.id Domain", desc: "Instantly deploy your journal to a dedicated subdomain (e.g., medicine.frons.id). Your beautiful, responsive homepage is live in seconds." },
            { tag: "02", title: "Zero-Setup OJS Workflow", desc: "Enjoy a standardized editorial board dashboard with robust multi-reviewer tracking right out of the box. No servers to maintain, no complicated software to install." },
            { tag: "03", title: "Native IP Protection", desc: "Every submission is immutably timestamped automatically. Establish unbreakable intellectual property provenance against unauthorized AI scraping seamlessly." }
          ].map((feature, i) => (
            <div key={i} className="relative p-8 glassmorphism rounded-3xl border border-white/10 hover:bg-white/5 hover:border-blue-500/50 transition-all overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 text-6xl font-extrabold text-white/[0.03] group-hover:text-blue-500/10 transition-colors">{feature.tag}</div>
              <h3 className="text-2xl font-bold mb-4 relative z-10">{feature.title}</h3>
              <p className="text-gray-400 text-base leading-relaxed relative z-10">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="relative z-10 w-full bg-gradient-to-b from-transparent to-blue-900/10 border-y border-white/5 py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">3 Steps to Your Own Journal</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">A simple website maker empowering the editorial lifecycle.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-stretch relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/50 to-pink-500/20 z-0"></div>

            {[
              { step: "1", title: "Claim Your Domain", desc: "Pick your name (e.g. quantum.frons.id). Customize your branding, set submission guidelines, and invite your editorial board instantly." },
              { step: "2", title: "Easily Manage Reviews", desc: "Authors upload manuscripts effortlessly. You just assign reviewers and track acceptances through a streamlined, Web2-friendly dashboard." },
              { step: "3", title: "Publish & Protect", desc: "Click 'Publish'. We automatically handle the cryptography to secure authorship IP and distribute the finalized paper to your audience." }
            ].map((step, i) => (
              <div key={i} className="flex-1 flex flex-col items-center text-center relative z-10">
                <div className="w-24 h-24 rounded-full bg-black border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center text-3xl font-bold mb-6 relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-600/20 spin-slow"></div>
                  {step.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[280px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FOR WHOM */}
      <section className="relative z-10 w-full py-24 px-6 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-12">Designed for the Future of Science</h2>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {["Research Groups", "Journal Publishers", "Academic Institutions", "Universities", "Independent Editorial Boards"].map((audience, i) => (
            <span key={i} className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-gray-300 font-medium hover:bg-white/10 hover:text-white transition-colors cursor-default">
              {audience}
            </span>
          ))}
        </div>
      </section>

      {/* 6. WAITLIST FORM */}
      <section id="waitlist" className="relative z-10 w-full py-24 px-6 bg-black">
        <div className="max-w-3xl mx-auto glassmorphism border border-white/10 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full filter blur-[80px]"></div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4 relative z-10">Join the Waitlist</h2>
          <p className="text-gray-400 text-lg mb-10 relative z-10">Get early access to FRONS-J and start migrating your editorial workflows to the new standard.</p>
          
          <form className="flex flex-col sm:flex-row gap-3 relative z-10 max-w-xl mx-auto" onSubmit={handleJoinWaitlist}>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="editor@university.edu" 
              required
              disabled={loading}
              className="flex-1 px-6 py-4 bg-black/50 border border-gray-600 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : "Submit"}
            </button>
          </form>
          {message && (
            <div className={`mt-6 text-sm font-medium ${message.includes("Error") || message.includes("not configured") ? "text-red-400" : "text-green-400"}`}>
              {message}
            </div>
          )}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="relative z-10 w-full border-t border-white/5 bg-black py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/frons-logo.png" alt="FRONS Logo" className="h-6 opacity-50 grayscale" />
            <span className="text-gray-500 font-bold tracking-tighter">FRONS-J</span>
          </div>
          <div className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Fronsciers. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
