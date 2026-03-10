"use client";
import React from "react";
import Image from "next/image";
import { SidebarBody, SidebarLink, useSidebar } from "./ui/sidebar";
import {
  LayoutDashboardIcon,
  FileTextIcon,
  ClipboardCheckIcon,
  UserIcon,
  BookOpenIcon,
  FilePen,
  ArrowUpFromLine,
} from "lucide-react";
import { WalletConnection } from "./wallet-connection";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function OverviewSidebar({ connected }: { connected: boolean }) {
  const pathname = usePathname();
  const { open, animate } = useSidebar();

  const links = [
    {
      label: "Overview",
      href: "/overview",
      icon: <LayoutDashboardIcon className="h-5 w-5" />,
    },
    {
      label: "Published Manuscripts",
      href: "/published-manuscripts",
      icon: <BookOpenIcon className="h-5 w-5" />,
    },
    {
      label: "Author Dashboard",
      href: "/author-dashboard",
      icon: <FilePen className="h-5 w-5" />,
    },
    {
      label: "Submit Manuscript",
      href: "/submit-manuscript",
      icon: <ArrowUpFromLine className="h-5 w-5" />,
    },
    {
      label: "Review Manuscript",
      href: "/review-manuscript",
      icon: <ClipboardCheckIcon className="h-5 w-5" />,
    },
    {
      label: "DOCI Tracker",
      href: "/doci-tracker",
      icon: <FileTextIcon className="h-5 w-5" />,
    },
    {
      label: "Your Profile",
      href: "/your-profile",
      icon: <UserIcon className="h-5 w-5" />,
    },
  ];

  return (
    <SidebarBody className="justify-between">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-center mb-4">
          <Link href="/" className="transition-opacity hover:opacity-80 mt-2">
            <Image
              src={"/headerlogo.svg"}
              alt="Fronsciers"
              width={40}
              height={40}
              className="object-contain transition-all duration-300"
            />
          </Link>
        </div>

        <div className="flex flex-col space-y-2">
          {links.map((link, index) => (
            <div key={link.href}>
              <SidebarLink
                link={link}
                className={
                  link.label === "Overview"
                    ? "border-b border-gray-200 pb-4 mb-2"
                    : ""
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 border  border-gray-100 shadow-sm mt-4">
        <div className="text-xs text-gray-500 mb-3 text-center">
          {connected ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <motion.span
                animate={{
                  display: animate
                    ? open
                      ? "inline-block"
                      : "none"
                    : "inline-block",
                  opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className="whitespace-nowrap"
              >
                Connected
              </motion.span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <motion.span
                animate={{
                  display: animate
                    ? open
                      ? "inline-block"
                      : "none"
                    : "inline-block",
                  opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className="whitespace-nowrap"
              >
                Not Connected
              </motion.span>
            </div>
          )}
        </div>
        <div className="flex justify-center">
          {open && <WalletConnection />}
        </div>
      </div>
    </SidebarBody>
  );
}
