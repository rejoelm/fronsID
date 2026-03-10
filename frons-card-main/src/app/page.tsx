"use client";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/components/navbar";
import Hero from "@/components/landing/hero";
import About from "@/components/landing/about";
import HowItWorks from "@/components/landing/howitworks";

import SEO from "@/components/landing/seo";
import Footer from "@/components/landing/footer";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);

export default function Home() {
  useEffect(() => {
    const smoother = ScrollSmoother.create({
      smooth: 2,
      effects: false,
      smoothTouch: 0.1,
    });

    return () => {
      smoother?.kill();
    };
  }, []);

  return (
    <div id="smooth-wrapper">
      <div id="smooth-content" className="min-h-screen">
        <Navbar />
        <Hero />
        <About />
        <HowItWorks />
        {/* <SEO /> */}
        <Footer />
        <div className="h-32 md:h-0"></div>
      </div>
    </div>
  );
}
