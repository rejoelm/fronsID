"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AlertTriangle, Clock, DollarSign, Lock } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function ProblemAgitation() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".problem-card").forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: i * 0.15,
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

  const problems = [
    {
      icon: DollarSign,
      stat: "$5,000+",
      title: "Publication Fees",
      description:
        "Traditional journals charge thousands just to publish. Open access? That costs even more. Researchers pay to share their own work.",
      color: "text-red-500",
      bg: "bg-red-50",
      border: "border-red-100",
    },
    {
      icon: Clock,
      stat: "18 months",
      title: "Average Review Time",
      description:
        "Your breakthrough research sits in queue while reviewers take months to respond. Time-sensitive discoveries become outdated.",
      color: "text-amber-500",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      icon: AlertTriangle,
      stat: "$0",
      title: "Citation Earnings",
      description:
        "AI companies train on your papers, citation counts go up, but you earn nothing. Your intellectual property fuels a billion-dollar industry for free.",
      color: "text-orange-accent",
      bg: "bg-orange-50",
      border: "border-orange-100",
    },
    {
      icon: Lock,
      stat: "Paywalled",
      title: "Access Barriers",
      description:
        "Researchers in developing nations can't access the papers they need. Knowledge should be open, not locked behind $35 per article.",
      color: "text-navy",
      bg: "bg-lavender-light",
      border: "border-lavender",
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-orange-accent tracking-wider uppercase">
            The Problem
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-navy tracking-tight">
            Academic publishing is broken
          </h2>
          <p className="mt-3 text-base text-navy/50 max-w-xl mx-auto">
            Researchers deserve better. The current system is slow, expensive,
            and doesn't reward the people who create the knowledge.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className={`problem-card group p-6 rounded-2xl border ${problem.border} ${problem.bg} hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl ${problem.bg} border ${problem.border} flex items-center justify-center`}
                >
                  <problem.icon className={`w-6 h-6 ${problem.color}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${problem.color}`}>
                    {problem.stat}
                  </div>
                  <h3 className="text-lg font-semibold text-navy mt-1">
                    {problem.title}
                  </h3>
                  <p className="text-sm text-navy/50 mt-2 leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
