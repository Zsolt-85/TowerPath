import type { Metadata } from "next";
import { Geist, Orbitron, Inter } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TowerPath — The Tower Idle Tower Defense Tracker",
  description: "Track your progress and get optimal upgrade recommendations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en" className={`${geist.variable} ${orbitron.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col bg-[var(--color-bg-deep)] text-[var(--color-text)]">
        {children}
      </body>
    </html>
  );
}
