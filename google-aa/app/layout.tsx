
import type { Metadata } from "next";
import { Hanken_Grotesk, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

/* Fonts loaded once, exposed as CSS variables consumed by @theme. */
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexus Wallet",
  description: "Your smart-contract wallet, powered by Account Abstraction.",
};


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
    >
      <body className={`${hanken.className} ${instrument.className} ${plexMono.className}`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

