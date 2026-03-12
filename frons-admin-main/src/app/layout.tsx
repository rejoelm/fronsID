import type { Metadata } from "next";
import { DM_Sans, Spectral } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Providers from "@/provider/PrivyProvider";
import { LoadingProvider } from "@/context/LoadingContext";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"] });
// const spectral = Spectral({ subsets: ["latin"], weight: ["200", "300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Fronsciers — Publish. Cite. Earn. | Blockchain Academic Publishing",
  description:
    "Publish faster with transparent peer reviews, permanent on-chain storage, and earn every time AI cites your work. Starting from just $50.",
  keywords: [
    "academic publishing",
    "blockchain",
    "peer review",
    "DOCI",
    "NFT",
    "Solana",
    "open access",
    "research",
    "citation earnings",
  ],
  openGraph: {
    title: "Fronsciers — Publish. Cite. Earn.",
    description:
      "Blockchain-powered academic publishing. Transparent peer reviews, permanent on-chain storage, and citation earnings for researchers.",
    type: "website",
    siteName: "Fronsciers",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fronsciers — Publish. Cite. Earn.",
    description:
      "Blockchain-powered academic publishing. Transparent peer reviews, permanent on-chain storage, and citation earnings.",
  },
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
              {children}
              <Toaster />
            </LoadingProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

