"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BookOpen,
  Brain,
  HardDrive,
  CreditCard,
  ArrowRight,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const products = [
  {
    icon: BookOpen,
    name: "Fronsciers",
    tagline: "Research Library",
    description:
      "Publish peer-reviewed papers for $50. Earn DOCI NFTs as permanent proof of authorship. Every AI citation pays you $0.01.",
    features: ["Transparent peer review", "DOCI NFT on publication", "On-chain citations"],
    color: "bg-navy",
    iconColor: "text-white",
    tagColor: "text-lavender",
    badge: "Live",
    badgeColor: "bg-success text-white",
    href: "/submit-manuscript",
  },
  {
    icon: Brain,
    name: "Frons.id",
    tagline: "AI Chat Engine",
    description:
      "Evidence-based AI with zero hallucinations. Answers backed by real papers — never fabricates sources. Honest by design.",
    features: ["4-tier evidence cascade", "Zero hallucinations", "Pay-per-question credits"],
    color: "bg-gradient-to-br from-navy via-navy-600 to-navy-400",
    iconColor: "text-orange-accent",
    tagColor: "text-orange-accent-light",
    badge: "Coming Soon",
    badgeColor: "bg-orange-accent/10 text-orange-accent",
    href: "#",
  },
  {
    icon: HardDrive,
    name: "My Vault",
    tagline: "Encrypted Storage",
    description:
      "Your personal data vault with military-grade encryption. Medical records, datasets, manuscripts — we never see your data.",
    features: ["AES-256-GCM encryption", "Decentralized storage", "Client-side encryption"],
    color: "bg-gradient-to-br from-navy-700 to-navy-500",
    iconColor: "text-pink-accent",
    tagColor: "text-pink-accent",
    badge: "Coming Soon",
    badgeColor: "bg-pink-accent/10 text-pink-accent-dark",
    href: "#",
  },
  {
    icon: CreditCard,
    name: "NFC Card",
    tagline: "Identity Card",
    description:
      "Physical NFC card with your research portfolio. Tap on any phone to share your published work, citations, and credentials.",
    features: ["NTAG 424 DNA chip", "Anti-clone protection", "Instant portfolio share"],
    color: "bg-gradient-to-br from-navy-800 to-navy-600",
    iconColor: "text-lavender",
    tagColor: "text-lavender-light",
    badge: "Coming Soon",
    badgeColor: "bg-lavender/20 text-navy",
    href: "#",
  },
];

export function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".feature-card").forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 sm:py-28 bg-gradient-to-b from-white to-off-white"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-orange-accent tracking-wider uppercase">
            The Ecosystem
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-navy tracking-tight">
            Four products. One mission.
          </h2>
          <p className="mt-3 text-base text-navy/50 max-w-xl mx-auto">
            True data ownership, transparent science, and fair compensation for
            researchers — all connected by Solana blockchain.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {products.map((product) => (
            <div
              key={product.name}
              className="feature-card group relative overflow-hidden rounded-2xl border border-navy/5 bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
            >
              {/* Colored header */}
              <div className={`${product.color} p-6 pb-8`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <product.icon className={`w-5 h-5 ${product.iconColor}`} />
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${product.badgeColor}`}
                  >
                    {product.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{product.name}</h3>
                <p className={`text-sm ${product.tagColor} mt-0.5`}>
                  {product.tagline}
                </p>
              </div>

              {/* Content */}
              <div className="p-6 pt-5">
                <p className="text-sm text-navy/60 leading-relaxed">
                  {product.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {product.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-xs text-navy/50"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-accent flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {product.badge === "Live" && (
                  <a
                    href={product.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-orange-accent transition-colors"
                  >
                    Get Started
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
