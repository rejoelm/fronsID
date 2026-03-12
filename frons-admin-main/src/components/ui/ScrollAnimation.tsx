"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollAnimationConfig from "./ScrollAnimationConfig";

interface Config {
  theme: "light" | "dark" | "system";
  animate: boolean;
  snap: boolean;
  start: number;
  end: number;
  scroll: boolean;
  debug: boolean;
}

const ScrollAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLLIElement[]>([]);
  const [config, setConfig] = useState<Config>({
    theme: "dark",
    animate: true,
    snap: true,
    start: Math.floor(Math.random() * 100),
    end: Math.floor(Math.random() * 100) + 900,
    scroll: true,
    debug: false,
  });

  const scrollerScrubRef = useRef<ScrollTrigger | null>(null);
  const dimmerScrubRef = useRef<ScrollTrigger | null>(null);
  const chromaEntryRef = useRef<gsap.core.Tween | null>(null);
  const chromaExitRef = useRef<gsap.core.Tween | null>(null);

  const words = [
    "design.",
    "prototype.",
    "solve.",
    "build.",
    "develop.",
    "debug.",
    "learn.",
    "cook.",
    "ship.",
    "prompt.",
    "collaborate.",
    "create.",
    "inspire.",
    "follow.",
    "innovate.",
    "test.",
    "optimize.",
    "teach.",
    "visualize.",
    "transform.",
    "scale.",
    "do it.",
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      if (config.theme === "dark") {
        root.classList.add("dark");
      } else if (config.theme === "light") {
        root.classList.remove("dark");
      } else {
        // System theme
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        if (mediaQuery.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    }
  }, [config.theme]);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    const items = itemsRef.current.filter(Boolean);
    if (items.length === 0) return;

    // Clean up previous animations
    scrollerScrubRef.current?.kill();
    dimmerScrubRef.current?.kill();
    chromaEntryRef.current?.kill();
    chromaExitRef.current?.kill();

    // Update CSS variables
    document.documentElement.style.setProperty(
      "--start",
      config.start.toString()
    );
    document.documentElement.style.setProperty("--end", config.end.toString());
    document.documentElement.style.setProperty(
      "--hue",
      config.start.toString()
    );

    if (!config.animate) {
      gsap.set(items, { opacity: 1 });
      gsap.set(document.documentElement, { "--chroma": 0 });
      return;
    }

    // Set initial state
    gsap.set(items, { opacity: (i) => (i !== 0 ? 0.2 : 1) });

    // Create dimmer animation
    const dimmer = gsap
      .timeline()
      .to(items.slice(1), {
        opacity: 1,
        stagger: 0.5,
      })
      .to(
        items.slice(0, items.length - 1),
        {
          opacity: 0.2,
          stagger: 0.5,
        },
        0
      );

    dimmerScrubRef.current = ScrollTrigger.create({
      trigger: items[0],
      endTrigger: items[items.length - 1],
      start: "center center",
      end: "center center",
      animation: dimmer,
      scrub: 0.2,
    });

    // Create hue scroller animation
    const scroller = gsap.timeline().fromTo(
      document.documentElement,
      {
        "--hue": config.start,
      },
      {
        "--hue": config.end,
        ease: "none",
      }
    );

    scrollerScrubRef.current = ScrollTrigger.create({
      trigger: items[0],
      endTrigger: items[items.length - 1],
      start: "center center",
      end: "center center",
      animation: scroller,
      scrub: 0.2,
    });

    // Chroma entry animation
    chromaEntryRef.current = gsap.fromTo(
      document.documentElement,
      {
        "--chroma": 0,
      },
      {
        "--chroma": 0.3,
        ease: "none",
        scrollTrigger: {
          scrub: 0.2,
          trigger: items[0],
          start: "center center+=40",
          end: "center center",
        },
      }
    );

    // Chroma exit animation
    chromaExitRef.current = gsap.fromTo(
      document.documentElement,
      {
        "--chroma": 0.3,
      },
      {
        "--chroma": 0,
        ease: "none",
        scrollTrigger: {
          scrub: 0.2,
          trigger: items[items.length - 2],
          start: "center center",
          end: "center center-=40",
        },
      }
    );

    return () => {
      scrollerScrubRef.current?.kill();
      dimmerScrubRef.current?.kill();
      chromaEntryRef.current?.kill();
      chromaExitRef.current?.kill();
    };
  }, [config, words.length]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-white dark:bg-black font-sans"
      style={{
        fontFamily:
          "'Geist', 'SF Pro Text', 'SF Pro Icons', 'AOS Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif, system-ui",
      }}
    >
      <ScrollAnimationConfig config={config} onConfigChange={setConfig} />

      {/* Background Grid */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: `
            linear-gradient(90deg, color-mix(in hsl, currentColor, transparent 70%) 1px, transparent 1px 45px) 50% 50% / 45px 45px,
            linear-gradient(color-mix(in hsl, currentColor, transparent 70%) 1px, transparent 1px 45px) 50% 50% / 45px 45px
          `,
          mask: "linear-gradient(-20deg, transparent 50%, white)",
        }}
      />

      {/* Bear Link */}
      <a
        href="https://twitter.com/intent/follow?screen_name=jh3yy"
        target="_blank"
        rel="noreferrer noopener"
        className="fixed top-4 left-4 w-12 h-12 grid place-items-center opacity-80 hover:opacity-100 text-current"
      >
        <svg
          className="w-9"
          viewBox="0 0 969 955"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="161.191"
            cy="320.191"
            r="133.191"
            stroke="currentColor"
            strokeWidth="20"
          />
          <circle
            cx="806.809"
            cy="320.191"
            r="133.191"
            stroke="currentColor"
            strokeWidth="20"
          />
          <circle cx="695.019" cy="587.733" r="31.4016" fill="currentColor" />
          <circle cx="272.981" cy="587.733" r="31.4016" fill="currentColor" />
          <path
            d="M564.388 712.083C564.388 743.994 526.035 779.911 483.372 779.911C440.709 779.911 402.356 743.994 402.356 712.083C402.356 680.173 440.709 664.353 483.372 664.353C526.035 664.353 564.388 680.173 564.388 712.083Z"
            fill="currentColor"
          />
          <rect
            x="310.42"
            y="448.31"
            width="343.468"
            height="51.4986"
            fill="#FF1E1E"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M745.643 288.24C815.368 344.185 854.539 432.623 854.539 511.741H614.938V454.652C614.938 433.113 597.477 415.652 575.938 415.652H388.37C366.831 415.652 349.37 433.113 349.37 454.652V511.741L110.949 511.741C110.949 432.623 150.12 344.185 219.845 288.24C289.57 232.295 384.138 200.865 482.744 200.865C581.35 200.865 675.918 232.295 745.643 288.24Z"
            fill="currentColor"
          />
        </svg>
      </a>

      {/* Header */}
      <header className="min-h-screen flex items-center w-full px-20">
        <h1 className="text-8xl font-bold leading-[0.8] m-0 bg-gradient-to-b from-current via-current to-gray-400 bg-clip-text text-transparent">
          you can
          <br />
          scroll.
        </h1>
      </header>

      {/* Main Content */}
      <main className="w-full">
        <section className="flex leading-[1.25] w-full pl-20">
          <h2 className="sticky top-1/2 -translate-y-1/2 text-6xl font-semibold m-0 inline-block h-fit bg-gradient-to-b from-current via-current to-gray-400 bg-clip-text text-transparent">
            <span aria-hidden="true">you can&nbsp;</span>
            <span className="sr-only">you can ship things.</span>
          </h2>
          <ul
            aria-hidden="true"
            className="font-semibold p-0 m-0 list-none"
            style={
              {
                "--count": words.length,
                scrollSnapType: config.snap ? "y proximity" : "none",
              } as React.CSSProperties
            }
          >
            {words.map((word, index) => (
              <li
                key={index}
                ref={(el) => {
                  if (el) itemsRef.current[index] = el;
                }}
                className="text-6xl font-semibold bg-gradient-to-b from-current via-current to-gray-400 bg-clip-text text-transparent"
                style={
                  {
                    "--i": index,
                    color: `oklch(65% 0.3 calc(${config.start} + (${
                      (config.end - config.start) / (words.length - 1)
                    } * ${index})))`,
                    scrollSnapAlign: config.snap ? "center" : "none",
                  } as React.CSSProperties
                }
              >
                {word}
              </li>
            ))}
          </ul>
        </section>

        <section className="min-h-screen flex items-center w-full justify-center">
          <h2 className="text-8xl font-bold bg-gradient-to-b from-current via-current to-gray-400 bg-clip-text text-transparent">
            fin.
          </h2>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 opacity-50 text-center">
        ʕ⊙ᴥ⊙ʔ jh3yy &copy; 2024
      </footer>

      <style jsx global>{`
        @property --hue {
          initial-value: 0;
          syntax: "<number>";
          inherits: false;
        }
        @property --chroma {
          initial-value: 0;
          syntax: "<number>";
          inherits: true;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>
    </div>
  );
};

export default ScrollAnimation;
