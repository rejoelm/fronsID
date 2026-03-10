"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Shield,
  Coins,
  Sparkles,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        badgesRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: "power3.out" }
      );
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9, delay: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.8, ease: "power3.out" }
      );
      gsap.fromTo(
        statsRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 1.1, ease: "power3.out" }
      );
      gsap.fromTo(
        mascotRef.current,
        { opacity: 0, scale: 0.8, rotate: -5 },
        {
          opacity: 1,
          scale: 1,
          rotate: 0,
          duration: 1,
          delay: 0.4,
          ease: "back.out(1.7)",
        }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-off-white via-lavender-light/30 to-off-white dark:from-navy-900 dark:via-navy-800/30 dark:to-navy-900"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-lavender/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-accent/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-navy-50/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 pt-24 pb-16">
        {/* Badge */}
        <div
          ref={badgesRef}
          className="flex items-center gap-2 mb-8"
        >
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-navy/5 dark:bg-white/10 border border-navy/10 dark:border-white/10 text-navy dark:text-white text-xs font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-orange-accent" />
            Blockchain-Powered Academic Publishing
          </span>
        </div>

        {/* Hero content with mascot */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 max-w-6xl mx-auto">
          {/* Text content */}
          <div className="flex-1 text-center lg:text-left">
            <h1 ref={titleRef}>
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-navy dark:text-white tracking-tight leading-[1.1]">
                Publish. Cite. Earn.
              </span>
              <span className="block mt-3 text-xl sm:text-2xl md:text-3xl font-medium text-navy/60 dark:text-white/60 tracking-tight">
                The Future of Open Science
              </span>
            </h1>

            <p
              ref={subtitleRef}
              className="mt-6 text-base sm:text-lg md:text-xl text-navy/50 dark:text-white/50 max-w-2xl leading-relaxed"
            >
              Publish faster with transparent peer reviews, permanent on-chain storage,
              and earn every time AI cites your work. Starting from just{" "}
              <span className="font-semibold text-orange-accent">$50</span>.
            </p>

            {/* CTAs */}
            <div
              ref={ctaRef}
              className="mt-10 flex flex-col sm:flex-row items-center lg:items-start gap-4"
            >
              <Link
                href="/submit-manuscript"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-navy text-white font-semibold text-sm shadow-lg shadow-navy/20 hover:shadow-xl hover:shadow-navy/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Publishing
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/overview"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white dark:bg-navy-700 border border-navy/10 dark:border-white/10 text-navy dark:text-white font-semibold text-sm hover:bg-lavender-light dark:hover:bg-navy-600 hover:border-navy/20 transition-all duration-300"
              >
                Explore Research
              </Link>
            </div>
          </div>

          {/* Mascot */}
          <div
            ref={mascotRef}
            className="flex-shrink-0 w-56 h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80 relative"
          >
            <Image
              src="/mascot/mascot-excited.png"
              alt="Frons mascot — a friendly bear in a navy suit"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Stats */}
        <div
          ref={statsRef}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-3xl mx-auto"
        >
          {[
            { icon: BookOpen, label: "Publication Fee", value: "$50", sub: "vs $5,000 traditional" },
            { icon: Shield, label: "Review Time", value: "< 30 days", sub: "vs 18 months" },
            { icon: Coins, label: "Citation Earning", value: "$0.01", sub: "per AI citation" },
            { icon: Sparkles, label: "On-Chain", value: "DOCI NFT", sub: "permanent proof" },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div
              key={label}
              className="text-center px-4 py-5 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-navy/5 dark:border-white/10 hover:border-navy/10 dark:hover:border-white/20 transition-colors"
            >
              <Icon className="w-5 h-5 text-orange-accent mx-auto mb-2" />
              <div className="text-lg sm:text-xl font-bold text-navy dark:text-white">{value}</div>
              <div className="text-xs text-navy/40 dark:text-white/40 mt-0.5">{label}</div>
              <div className="text-[10px] text-orange-accent/80 mt-1 font-medium">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

