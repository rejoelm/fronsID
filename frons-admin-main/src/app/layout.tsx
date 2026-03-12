"use client";

import { DM_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { LoadingProvider } from "@/context/LoadingContext";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  UploadCloud,
  BarChart3,
  Home,
} from "lucide-react";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"] });

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/articles", label: "Articles", icon: FileText },
  { href: "/config", label: "Config", icon: Settings },
  { href: "/seeds", label: "AI Seeds", icon: UploadCloud },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#2C337A] text-white flex flex-col z-50">
      {/* Branding */}
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">FRONS Admin</h1>
        <p className="text-xs text-[#E5E0FE] mt-1 opacity-80">
          Global Control Panel
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#FB7720] text-white shadow-lg shadow-orange-500/25"
                  : "text-[#E5E0FE] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-[#E5E0FE] opacity-70">
            System Online
          </span>
        </div>
      </div>
    </aside>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>FRONS Admin - Global Control Panel</title>
        <meta
          name="description"
          content="Admin dashboard for the FRONS ecosystem"
        />
        <link rel="icon" href="/Logo.png" />
      </head>
      <body className={dmSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <LoadingProvider>
            <div className="flex min-h-screen bg-[#F8F8FD]">
              <AdminSidebar />
              <main className="flex-1 ml-64">{children}</main>
            </div>
            <Toaster />
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
