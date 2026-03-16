import type { Metadata } from "next";
import { DM_Sans, Spectral } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Providers from "@/provider/PrivyProvider";
import { LoadingProvider } from "@/context/LoadingContext";
import { Toaster } from "@/components/ui/toaster";
import { AdminSidebar } from "@/components/admin-sidebar";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"] });
// const spectral = Spectral({ subsets: ["latin"], weight: ["200", "300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "FRONS Admin Console | Fronsciers Ecosystem Management",
  description:
    "Administrative console for the Fronsciers ecosystem. Manage users, articles, citations, revenue, subscriptions, and protocol parameters.",
  icons: {
    icon: "/Logo.png",
  },
  other: {
    "theme-color": "#2C337A",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={dmSans.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Providers>
            <LoadingProvider>
              <div className="flex min-h-screen bg-[#F8F8FD]">
                <AdminSidebar />
                <main className="flex-1 ml-[260px] transition-all duration-300">
                  {children}
                </main>
              </div>
              <Toaster />
            </LoadingProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

