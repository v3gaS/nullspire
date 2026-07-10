import type { Metadata } from "next";
import { Orbitron, Exo_2 } from "next/font/google";
import "./globals.css";

const display = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const body = Exo_2({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Nullspire",
  description:
    "Single-player sci-fi FPS — survive an alien research world, unlock weapons, defeat bosses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full overflow-hidden bg-[#0b0614] font-[family-name:var(--font-body)] text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
