import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Providers from "@/provider/PrivyProvider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "FRONS Vault - Encrypted Research",
  description: "Secure client-side encryption and AI analysis for scientific research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} antialiased text-gray-900 bg-gray-50`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
