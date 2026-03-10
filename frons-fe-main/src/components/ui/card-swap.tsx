"use client";
import React, { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl w-80 h-72 md:w-[500px] md:h-[400px] lg:w-[600px] lg:h-[450px] relative overflow-hidden z-10 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-white/5 pointer-events-none"></div>

      <div className="absolute inset-0 rounded-3xl border border-white/30 pointer-events-none"></div>

      <div className="absolute inset-0 rounded-3xl shadow-inner pointer-events-none"></div>

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

interface CardSwapProps {
  children: React.ReactElement<CardProps>[];
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
}

export const CardSwap: React.FC<CardSwapProps> = ({
  children,
  cardDistance = 50,
  verticalDistance = 70,
  delay = 10000,
  pauseOnHover = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const timelineRef = useRef<gsap.core.Timeline>();

  useEffect(() => {
    const nextCard = () => {
      if (!isPaused) {
        setCurrentIndex((prev) => (prev + 1) % children.length);
      }
    };

    timeoutRef.current = setTimeout(nextCard, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, isPaused, delay, children.length]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.children;
    const totalCards = cards.length;

    // Kill any existing timeline to prevent conflicts
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    // Create a new timeline for smoother, coordinated animations
    timelineRef.current = gsap.timeline({
      defaults: {
        duration: 0.6,
        ease: "power2.out",
      },
    });

    // Animate all cards simultaneously using transforms for better performance
    Array.from(cards).forEach((card, index) => {
      const adjustedIndex = (index - currentIndex + totalCards) % totalCards;
      const zIndex = totalCards - adjustedIndex;
      const scale = Math.max(0.75, 1 - adjustedIndex * 0.12);
      const opacity = Math.max(0.3, 1 - adjustedIndex * 0.35);
      const x = adjustedIndex * cardDistance;
      const y = adjustedIndex * verticalDistance;

      // Use will-change and transform3d for hardware acceleration
      gsap.set(card as HTMLElement, {
        willChange: "transform, opacity",
      });

      timelineRef.current!.to(
        card as HTMLElement,
        {
          x,
          y,
          scale,
          opacity,
          zIndex,
          force3D: true, // Force hardware acceleration
          rotation: 0.01, // Minimal rotation to trigger 3D acceleration
        },
        0
      ); // Start all animations at the same time
    });

    // Clean up will-change after animation completes
    timelineRef.current.call(() => {
      Array.from(cards).forEach((card) => {
        gsap.set(card as HTMLElement, {
          willChange: "auto",
        });
      });
    });
  }, [currentIndex, cardDistance, verticalDistance, children.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full z-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children.map((child, index) => (
        <div
          key={index}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            zIndex: children.length - index,
            backfaceVisibility: "hidden", // Prevent flickering
            perspective: "1000px", // Enable 3D rendering context
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};
