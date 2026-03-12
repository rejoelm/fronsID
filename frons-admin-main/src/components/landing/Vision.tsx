"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Zap, Globe, Users, TrendingUp } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const visionPoints = [
  {
    icon: Zap,
    title: "Invisible Blockchain",
    description:
      "Users never see gas fees, wallet addresses, or seed phrases. Solana powers everything silently behind the scenes.",
    color: "text-orange-accent",
    bg: "bg-orange-accent/10",
  },
  {
    icon: Globe,
    title: "Truly Open Access",
    description:
      "Every published paper is freely accessible. No paywalls. No subscriptions required to read research.",
    color: "text-navy",
    bg: "bg-lavender",
  },
  {
    icon: Users,
    title: "Fair Compensation",
    description:
      "Researchers earn from every AI citation. The sharing pool rewards impactful work monthly via on-chain leaderboard.",
    color: "text-success",
    bg: "bg-green-50",
  },
  {
    icon: TrendingUp,
    title: "Honest AI",
    description:
      "Our AI never hallucinate sources. If there's insufficient evidence, it says so. Every claim is backed by a real citation.",
    color: "text-pink-accent-dark",
    bg: "bg-pink-accent/10",
  },
];

export function Vision() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".vision-item").forEach((item, i) => {
        gsap.fromTo(
          item,
          { opacity: 0, x: i % 2 === 0 ? -30 : 30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
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
      className="py-20 sm:py-28 bg-gradient-to-b from-off-white to-white dark:from-navy-900 dark:to-navy-800"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-orange-accent tracking-wider uppercase">
            Our Vision
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-navy dark:text-white tracking-tight">
            Built on principles, not hype
          </h2>
          <p className="mt-3 text-base text-navy/50 dark:text-white/50 max-w-xl mx-auto">
            The core design principles that guide every decision we make.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {visionPoints.map((point) => (
            <div
              key={point.title}
              className="vision-item flex items-start gap-4 p-6 rounded-2xl bg-white dark:bg-white/5 border border-navy/5 dark:border-white/10 hover:shadow-md transition-all duration-300"
            >
              <div
                className={`flex-shrink-0 w-11 h-11 rounded-xl ${point.bg} flex items-center justify-center`}
              >
                <point.icon className={`w-5 h-5 ${point.color}`} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-navy dark:text-white">
                  {point.title}
                </h3>
                <p className="mt-1.5 text-sm text-navy/50 dark:text-white/50 leading-relaxed">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
