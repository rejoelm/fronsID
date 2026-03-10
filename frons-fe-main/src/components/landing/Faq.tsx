"use client";
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How much does it cost to publish?",
    answer:
      "The submission fee is $50 USDC, which covers peer review and on-chain publication. If your manuscript is rejected, $45 is refunded to your wallet. That's 100x cheaper than traditional journals.",
  },
  {
    question: "How does the peer review process work?",
    answer:
      "Your manuscript is reviewed by 3 independent reviewers matched by expertise. Reviews are recorded on-chain for full transparency. If human reviewers aren't available, AI-assisted review acts as a fallback (clearly labeled). Average review time is under 30 days.",
  },
  {
    question: "What is a DOCI NFT?",
    answer:
      'DOCI stands for "Digital Object Citation Identifier." When your paper is published, we mint a unique NFT on Solana containing your authorship proof, manuscript hash, reviewer signatures, and publication date. It\'s a permanent, tamper-proof record that you own.',
  },
  {
    question: "How do I earn from citations?",
    answer:
      "Every time an AI system (like Claude, GPT, or Perplexity) cites your paper through our MCP gateway, it triggers a $0.01 micro-payment. 20% goes directly to you, 20% to the sharing pool, 40% to the platform, and 20% to reserves.",
  },
  {
    question: "Do I need a crypto wallet?",
    answer:
      "Not exactly. We use Privy for authentication — you can sign in with email, Google, or an existing wallet. If you don't have a Solana wallet, one is created for you invisibly. You never need to manage seed phrases or gas fees.",
  },
  {
    question: "Is my data private?",
    answer:
      "Absolutely. Published papers are open access, but your personal vault uses AES-256-GCM client-side encryption. The platform never sees your plaintext data. Even metadata (file names, tags) is encrypted. We can't read your data even if compelled.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept Stripe (Google Pay, Apple Pay, Visa/MC), QRIS and local Indonesian payments via Xendit (GoPay, OVO, DANA, ShopeePay), and direct USDC on Solana for crypto-native users.",
  },
  {
    question: "Can institutions use Fronsciers?",
    answer:
      "Yes! We offer institutional plans with team seats, dedicated support, shared storage, and volume pricing. Contact us for custom enterprise arrangements.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 sm:py-28 bg-off-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-orange-accent tracking-wider uppercase">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-navy tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-navy/5 overflow-hidden transition-shadow hover:shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="text-sm font-semibold text-navy pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-navy/40 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-96" : "max-h-0"
                }`}
              >
                <p className="px-6 pb-5 text-sm text-navy/50 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
