"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  Products: [
    { name: "Fronsciers Library", href: "/overview" },
    { name: "AI Chat (Coming Soon)", href: "#" },
    { name: "My Vault (Coming Soon)", href: "#" },
    { name: "NFC Card (Coming Soon)", href: "#" },
  ],
  Researchers: [
    { name: "Submit Manuscript", href: "/submit-manuscript" },
    { name: "Published Research", href: "/published-manuscripts" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Search Articles", href: "/search" },
  ],
  Resources: [
    { name: "Documentation", href: "#" },
    { name: "MCP Integration", href: "#" },
    { name: "API Reference", href: "#" },
    { name: "Privacy Policy", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main footer */}
        <div className="py-12 sm:py-16 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/headerlogo.svg"
                alt="Fronsciers"
                width={28}
                height={28}
                className="invert"
              />
              <span className="text-lg font-bold">Fronsciers</span>
            </Link>
            <p className="mt-3 text-sm text-white/40 leading-relaxed max-w-xs">
              Open, peer-reviewed, on-chain academic publishing. Built for
              researchers who value rigor, transparency, and fair compensation.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://twitter.com/fronsciers"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com/fronsciers"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/40 hover:text-orange-accent transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Fronsciers. Built on Solana.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-white/20">
            <span>Powered by</span>
            <span className="font-semibold text-orange-accent/60">FRONS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
