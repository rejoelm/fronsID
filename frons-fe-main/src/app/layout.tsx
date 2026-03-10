import type { Metadata } from "next";
import { DM_Sans, Spectral } from "next/font/google";
import Providers from "@/provider/PrivyProvider";
import { LoadingProvider } from "@/context/LoadingContext";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"] });
// const spectral = Spectral({ subsets: ["latin"], weight: ["200", "300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Fronsciers - Decentralized Academic Publishing",
  description:
    "Decentralized academic publishing platform with blockchain technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <Providers>
          <LoadingProvider>
            {children}
            <Toaster />
          </LoadingProvider>
        </Providers>
      </body>
    </html>
  );
}
