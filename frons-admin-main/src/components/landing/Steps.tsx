"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Users,
  BookOpen,
  Coins,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function Steps() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const arrowsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        subtitleRef.current,
        {
          opacity: 0,
          filter: "blur(8px)",
        },
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.2,
          delay: 0.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: subtitleRef.current,
            start: "top 85%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Progressive cards reveal with staggered opacity and transform
      const cards = cardsRef.current?.querySelectorAll(".workflow-card");
      if (cards) {
        gsap.set(cards, {
          opacity: 0,
          transform: "translateY(40px) scale(0.96)",
          filter: "blur(4px)",
        });

        cards.forEach((card, index) => {
          gsap.to(card, {
            opacity: 1,
            transform: "translateY(0px) scale(1)",
            filter: "blur(0px)",
            duration: 1,
            delay: index * 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: cardsRef.current,
              start: "top 75%",
              end: "bottom 25%",
              toggleActions: "play none none reverse",
            },
          });
        });

        // Subtle continuous transform on scroll progress
        gsap.to(cards, {
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
            onUpdate: (self) => {
              const progress = self.progress;
              cards.forEach((card, index) => {
                const offset = (index - cards.length / 2) * 2;
                gsap.set(card, {
                  transform: `translateY(${
                    progress * offset
                  }px) perspective(1000px) rotateX(${progress * -2}deg)`,
                });
              });
            },
          },
        });
      }

      // Minimalist arrow reveals with progressive opacity
      arrowsRef.current.forEach((arrow, index) => {
        if (arrow) {
          gsap.fromTo(
            arrow,
            {
              opacity: 0,
              scale: 0.8,
            },
            {
              opacity: 0.6,
              scale: 1,
              duration: 0.8,
              delay: 0.6 + index * 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: cardsRef.current,
                start: "top 75%",
                end: "bottom 25%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const addArrowRef = (el: HTMLDivElement | null, index: number) => {
    arrowsRef.current[index] = el;
  };
  const steps = [
    {
      id: 1,
      title: "Upload Manuscript and Author Information",
      icon: <Upload className="w-6 h-6" />,
      bgClass: "bg-primary/10",
      textClass: "text-primary",
      iconBg: "text-primary",
    },
    {
      id: 2,
      title: "Undergo Community Peer Review",
      icon: <Users className="w-6 h-6" />,
      bgClass: "bg-primary/5",
      textClass: "text-primary",
      iconBg: "text-primary",
    },
    {
      id: 3,
      title: "Publish to the Fronsciers Platform",
      icon: <BookOpen className="w-6 h-6" />,
      bgClass: "bg-primary/10",
      textClass: "text-primary",
      iconBg: "text-primary",
    },
    {
      id: 4,
      title: "Earn FRONS Tokens for Participation",
      icon: <Coins className="w-6 h-6" />,
      bgClass: "bg-primary/5",
      textClass: "text-primary",
      iconBg: "text-primary",
    },
  ];

  return (
    <div ref={sectionRef} className="bg-white pt-20 max-w-full">
      <div className="flex-col items-center justify-center max-w-full">
        <div className="w-full px-4 sm:px-8 lg:px-16 mb-16">
          <Separator className="w-full" />
        </div>

        {/* Header Section */}
        <div className="text-center justify-center items-center px-4">
          <h2 className="font-spectral tracking-tight font-semibold text-primary mb-4 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl">
            Publish With Fronsciers
          </h2>
          <p
            ref={subtitleRef}
            className="text-base lg:text-2xl text-muted-foreground max-w-3xl mx-4  lg:mb-0 mt-4 lg:mt-2 leading-tight text-center lg:mx-auto tracking-tight"
          >
            Experience the future of academic publishing with our streamlined
            blockchain-powered platform
          </p>
        </div>

        {/* Workflow Diagram */}
        <div ref={cardsRef} className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Desktop Single Row Layout */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Single Row Grid Container */}
                <div className="grid grid-cols-4 gap-6 max-w-7xl mx-auto">
                  {steps.map((step, index) => (
                    <div key={step.id} className="relative">
                      <Card
                        className={`${step.bgClass} border-primary/10 relative transition-all duration-300 hover:scale-105 hover:shadow-xl min-h-[150px] group h-full workflow-card`}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col space-y-4 h-full">
                            {/* Icon */}
                            <div
                              className={`${step.iconBg} transition-transform group-hover:scale-110`}
                            >
                              {step.icon}
                            </div>
                            {/* Content */}
                            <div className="flex-1">
                              <h3
                                className={`text-xl tracking-tight font-medium mb-3 leading-tight ${step.textClass}`}
                              >
                                {step.title}
                              </h3>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Horizontal Arrow indicators between cards */}
                      {index < steps.length - 1 && (
                        <div
                          ref={(el) => addArrowRef(el, index)}
                          className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10"
                        >
                          <ArrowRight className="w-6 h-6 text-primary/60" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tablet Layout - 2x2 Grid */}
            <div className="hidden md:block lg:hidden">
              <div className="relative">
                <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {steps.map((step, index) => (
                    <div key={step.id} className="relative">
                      <Card
                        className={`${step.bgClass} border-primary/10 relative transition-all duration-300 hover:scale-105 hover:shadow-xl min-h-[150px] group h-full workflow-card`}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col space-y-4 h-full">
                            {/* Icon */}
                            <div
                              className={`${step.iconBg} transition-transform group-hover:scale-110`}
                            >
                              {step.icon}
                            </div>
                            {/* Content */}
                            <div className="flex-1">
                              <h3
                                className={`text-xl tracking-tight font-medium mb-3 leading-tight ${step.textClass}`}
                              >
                                {step.title}
                              </h3>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Arrows for tablet layout */}
                      {index === 0 && (
                        <div
                          ref={(el) => addArrowRef(el, index + 4)}
                          className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10"
                        >
                          <ArrowRight className="w-5 h-5 text-primary/60" />
                        </div>
                      )}
                      {index === 1 && (
                        <div
                          ref={(el) => addArrowRef(el, index + 4)}
                          className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10"
                        >
                          <ArrowDown className="w-5 h-5 text-primary/60" />
                        </div>
                      )}
                      {index === 2 && (
                        <div
                          ref={(el) => addArrowRef(el, index + 4)}
                          className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10"
                        >
                          <ArrowRight className="w-5 h-5 text-primary/60" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Stack Layout */}
            <div className="md:hidden px-4">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  <Card
                    className={`${step.bgClass} border-primary/10 transition-all duration-300 hover:scale-102 hover:shadow-lg group workflow-card`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`${step.iconBg} flex-shrink-0 transition-transform group-hover:scale-110`}
                        >
                          {step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-lg tracking-tight font-medium mb-2 leading-tight ${step.textClass}`}
                          >
                            {step.title}
                          </h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Arrow for mobile */}
                  {index < steps.length - 1 && (
                    <div
                      ref={(el) => addArrowRef(el, index + 8)}
                      className="flex flex-col items-center py-3"
                    >
                      <ArrowDown className="w-5 h-5 text-primary/60" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
