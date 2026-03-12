"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Separator } from "../ui/separator";
import { ArrowRight, Zap, Users, Globe } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function CTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Subtitle animation
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: subtitleRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Buttons animation
      gsap.fromTo(
        buttonsRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: buttonsRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Stats animation
      gsap.fromTo(
        statsRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-white overflow-hidden">
      <div className="relative container max-w-7xl mx-auto py-24 px-6">
        <div className="text-center max-w-4xl mx-auto space-y-12">
          {/* Main heading */}
          <div className="space-y-6">
            <h2
              ref={titleRef}
              className="font-spectral font-bold text-primary tracking-tight text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-tight"
            >
              Ready to Publish
              <span className="block text-gradient bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                The Future?
              </span>
            </h2>
            <p
              ref={subtitleRef}
              className="text-xl md:text-2xl text-muted-foreground tracking-tight max-w-3xl mx-auto"
            >
              Join thousands of researchers revolutionizing academic publishing
              with blockchain technology. Fast, fair, and transparent, the way
              science should be shared.
            </p>
          </div>

          <div
            ref={buttonsRef}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/register-cv">
              <Button
                size="lg"
                className="group bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg  transition-all duration-300"
              >
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/published-manuscripts">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg  transition-all duration-300"
              >
                Browse Research
              </Button>
            </Link>
          </div>

          <div className="pt-12">
            <p className="text-sm text-muted-foreground mb-4">
              Trusted by researchers worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-sm font-medium text-gray-500">
                Blockchain Verified
              </div>
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <div className="text-sm font-medium text-gray-500">
                Peer Reviewed
              </div>
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <div className="text-sm font-medium text-gray-500">
                Earn FRONS Tokens
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
