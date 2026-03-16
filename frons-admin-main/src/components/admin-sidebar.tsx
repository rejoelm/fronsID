"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Quote,
  DollarSign,
  CreditCard,
  Settings,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Articles", href: "/articles", icon: FileText },
  { label: "Citations", href: "/citations", icon: Quote },
  { label: "Revenue", href: "/revenue", icon: DollarSign },
  { label: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { label: "Protocol", href: "/protocol", icon: Settings },
  { label: "Audit Log", href: "/audit", icon: ClipboardList },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-[#2C337A] text-white flex flex-col z-50 transition-all duration-300 shadow-xl",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <Image
            src="/Logo.png"
            alt="FRONS"
            width={24}
            height={24}
            className="object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-wide truncate">
              FRONS Admin
            </h2>
            <p className="text-[10px] text-white/50 truncate">Console v2.0</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FB7720]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/10 hover:text-white transition-all w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-[#FB7720] flex items-center justify-center text-xs font-bold">
              SA
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">Super Admin</p>
              <p className="text-[10px] text-white/40 truncate font-mono">
                Fron...dmin
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
