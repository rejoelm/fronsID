"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function Ctanew() {
  return (
    <section className="py-20 sm:py-28 bg-navy relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-lavender/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-orange-accent" />
          <span className="text-xs font-medium text-white/80">
            Join the future of open science
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
          Start publishing today.
          <br />
          <span className="text-orange-accent">Your research deserves it.</span>
        </h2>

        <p className="mt-5 text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
          $50 publication fee. Transparent peer review. Permanent on-chain proof.
          Earn every time AI cites your work.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/submit-manuscript"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-orange-accent text-white font-semibold text-sm shadow-lg shadow-orange-accent/30 hover:shadow-xl hover:shadow-orange-accent/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            Submit Your Manuscript
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 border border-white/10 text-white font-semibold text-sm hover:bg-white/15 transition-all duration-300"
          >
            Explore Published Research
          </Link>
        </div>

        <p className="mt-8 text-xs text-white/30">
          No subscription required to publish. Free to browse.
        </p>
      </div>
    </section>
  );
}

