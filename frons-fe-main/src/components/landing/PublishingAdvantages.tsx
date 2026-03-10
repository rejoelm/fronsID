"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, X } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const comparisons = [
  { feature: "Publication fee", traditional: "$3,000 – $5,000", fronsciers: "$50" },
  { feature: "Review timeline", traditional: "6 – 18 months", fronsciers: "< 30 days" },
  { feature: "Open access", traditional: "Extra $2,000+", fronsciers: "Included" },
  { feature: "Citation earnings", traditional: "$0", fronsciers: "$0.01 per AI cite" },
  { feature: "Proof of authorship", traditional: "PDF receipt", fronsciers: "DOCI NFT on Solana" },
  { feature: "Data privacy", traditional: "Publisher owns data", fronsciers: "You own everything" },
  { feature: "Transparent reviews", traditional: "Hidden", fronsciers: "On-chain verifiable" },
  { feature: "Global payments", traditional: "Wire transfer only", fronsciers: "Stripe / QRIS / USDC" },
];

export function PublishingAdvantages() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".comparison-table",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".comparison-table",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 bg-white dark:bg-navy-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-orange-accent tracking-wider uppercase">
            Why Fronsciers
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-navy dark:text-white tracking-tight">
            Traditional vs. Fronsciers
          </h2>
          <p className="mt-3 text-base text-navy/50 dark:text-white/50 max-w-xl mx-auto">
            A side-by-side look at why researchers are switching.
          </p>
        </div>

        <div className="comparison-table overflow-hidden rounded-2xl border border-navy/10 dark:border-white/10 shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-3 bg-navy text-white">
            <div className="px-5 py-4 text-sm font-semibold">Feature</div>
            <div className="px-5 py-4 text-sm font-semibold text-center border-l border-white/10">
              Traditional
            </div>
            <div className="px-5 py-4 text-sm font-semibold text-center border-l border-white/10">
              <span className="text-orange-accent">Fronsciers</span>
            </div>
          </div>

          {/* Rows */}
          {comparisons.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 ${
                i % 2 === 0 ? "bg-off-white dark:bg-white/5" : "bg-white dark:bg-white/[0.02]"
              } border-t border-navy/5 dark:border-white/5`}
            >
              <div className="px-5 py-3.5 text-sm font-medium text-navy dark:text-white">
                {row.feature}
              </div>
              <div className="px-5 py-3.5 text-sm text-navy/40 dark:text-white/40 text-center border-l border-navy/5 dark:border-white/5 flex items-center justify-center gap-1.5">
                <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 hidden sm:block" />
                <span>{row.traditional}</span>
              </div>
              <div className="px-5 py-3.5 text-sm text-navy dark:text-white font-medium text-center border-l border-navy/5 dark:border-white/5 flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-success flex-shrink-0 hidden sm:block" />
                <span>{row.fronsciers}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
