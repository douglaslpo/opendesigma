import type { Metadata } from "next";
import { Fraunces, Source_Code_Pro, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const sourceCode = Source_Code_Pro({
  variable: "--font-source-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpenDesigma web seed",
  description:
    "Minimal Next.js + Tailwind seed with DESIGN.md and design tokens.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${sourceSans.variable} ${sourceCode.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-ink bg-canvas">
        {children}
      </body>
    </html>
  );
}
