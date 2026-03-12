"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Separator } from "../ui/separator";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Check } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const pricingPlans = [
  {
    name: "Student Plan",
    price: "IDR 50k",
    period: "/ manuscript",
    description: "Perfect for students and early researchers",
    popular: false,
    features: [
      "Fast peer review process",
      "Secure IPFS storage",
      "Basic metadata support",
      "Student verification required",
    ],
  },
  {
    name: "Researcher Plan",
    price: "IDR 150k",
    period: "/ manuscript",
    description: "Ideal for independent researchers",
    popular: true,
    features: [
      "Priority peer review",
      "Advanced metadata & versioning",
      "Full IPFS + Walrus storage",
      "Enhanced discoverability",
      "Reviewer rewards eligibility",
    ],
  },
  {
    name: "Institutional Plan",
    price: "Custom",
    period: "pricing",
    description: "Tailored for labs & universities",
    popular: false,
    features: [
      "Volume discounts available",
      "Institutional branding",
      "Bulk submission management",
      "Advanced analytics dashboard",
      "Dedicated support team",
    ],
  },
];

export function Pricing() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Simple fade-up animation for title
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top bottom-=100px",
            end: "bottom center",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Simple fade-up animation for subtitle
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: subtitleRef.current,
            start: "top bottom-=80px",
            end: "bottom center",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Simple fade-up animation for pricing cards
      gsap.fromTo(
        cardsRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.4,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: cardsRef.current[0],
            start: "top bottom-=50px",
            end: "bottom center",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  return (
    <section ref={sectionRef} className="bg-white py-20">
      <div className="py-24 px-4 max-w-7xl mx-auto">
        <Separator className="mb-16" />

        {/* Header */}
        <div className="text-center mb-16">
          <h2
            ref={titleRef}
            className="text-4xl sm:text-5xl md:text-6xl font-spectral font-bold text-primary mb-6 tracking-tight"
          >
            Simple Pricing
          </h2>
          <p
            ref={subtitleRef}
            className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Choose the plan that fits your research needs. No hidden fees, no
            complicated tiers.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div key={index} ref={addToRefs}>
              <Card
                className={`relative group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                  plan.popular
                    ? "border-2 border-primary shadow-lg bg-gradient-to-br from-primary/5 to-blue-50/30"
                    : "border border-gray-200 hover:border-primary/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {plan.description}
                    </p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-primary">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-start space-x-3"
                      >
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 text-sm leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    {plan.name === "Institutional Plan"
                      ? "Contact Sales"
                      : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
