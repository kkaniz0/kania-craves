import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Kania Craves — Wherever you are, eat well",
  description:
    "Personal food discovery: nearby recommendations from your wishlist, favorites, and visit history.",
  applicationName: "Kania Craves",
};

export const viewport: Viewport = {
  themeColor: "#F7C6D9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} antialiased`}
        style={
          {
            "--font-sans": "var(--font-outfit), system-ui, sans-serif",
            "--font-display": "var(--font-outfit), system-ui, sans-serif",
          } as CSSProperties
        }
      >
        <TopBar />
        <main className="mx-auto min-h-[calc(100dvh-3.5rem)] max-w-5xl px-4 pb-24 pt-2 md:pb-10">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
