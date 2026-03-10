"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSafePrivy } from "@/hooks/useSafePrivy";
import { useSidebar } from "@/components/ui/sidebar";

import { WalletConnection } from "@/components/wallet-connection";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizeable-navbar";
import {
  LayoutDashboardIcon,
  FileTextIcon,
  ClipboardCheckIcon,
  UserIcon,
  BookOpenIcon,
} from "lucide-react";

function ConditionalSidebarTrigger() {
  try {
    useSidebar();
  } catch (error) {
    return null;
  }
}

const FronciersLogo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal"
    >
      <Image
        src="/headerlogo.svg"
        alt="Fronsciers Logo"
        width={30}
        height={30}
        className="object-contain"
      />
    </Link>
  );
};

export function Header() {
  const { authenticated, privyConfigured } = useSafePrivy();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items for authenticated users
  const navItems = authenticated
    ? [
        {
          name: "Overview",
          link: "/overview",
        },
        {
          name: "Submit",
          link: "/submit-manuscript",
        },
        {
          name: "Published",
          link: "/published-manuscripts",
        },
        {
          name: "Search",
          link: "/search",
        },
        {
          name: "Leaderboard",
          link: "/leaderboard",
        },
      ]
    : [
        {
          name: "Search",
          link: "/search",
        },
        {
          name: "Leaderboard",
          link: "/leaderboard",
        },
      ];

  return (
    <div className="relative w-full">
      <Navbar className="fixed inset-x-0 top-0 z-40 w-full">
        {/* Desktop Navigation */}
        <NavBody>
          <div className="flex items-center space-x-2">
            {authenticated && <ConditionalSidebarTrigger />}
            <FronciersLogo />
          </div>

          <NavItems items={navItems} />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center">
              {privyConfigured ? (
                <WalletConnection />
              ) : (
                <Link
                  href="/overview"
                  className="px-5 py-2 rounded-full bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <div className="flex items-center justify-center space-x-2 w-full">
              {authenticated && <ConditionalSidebarTrigger />}
              <FronciersLogo />
            </div>
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
                <div key={`mobile-link-${idx}`} className="w-full flex justify-center">
                  <Link
                    href={item.link}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="relative text-neutral-600 dark:text-neutral-300 flex items-center gap-3 p-2"
                  >
                    {item.name === "Overview" && (
                      <LayoutDashboardIcon className="h-4 w-4" />
                    )}
                    {item.name === "Submit" && (
                      <FileTextIcon className="h-4 w-4" />
                    )}
                    {item.name === "Review" && (
                      <ClipboardCheckIcon className="h-4 w-4" />
                    )}
                    {item.name === "Profile" && <UserIcon className="h-4 w-4" />}
                    {item.name === "Published" && (
                      <BookOpenIcon className="h-4 w-4" />
                    )}
                    <span className="block">{item.name}</span>
                  </Link>
                </div>
              ))}

            <div className="flex w-full flex-col items-center gap-4 mt-4">
              <div className="w-full text-center">
                {privyConfigured ? (
                  <>
                    <p className="font-medium mb-2 text-gray-900 dark:text-gray-100">
                      Connect Wallet
                    </p>
                    <WalletConnection />
                  </>
                ) : (
                  <Link
                    href="/overview"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-block px-6 py-2.5 rounded-full bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors"
                  >
                    Get Started
                  </Link>
                )}
              </div>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
