import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, Amiri } from "next/font/google";
import Starfield from "@/components/Starfield";
import AmbientAudio from "@/components/AmbientAudio";
import "./globals.css";

/** Warm serif — headings and display copy. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

/** UI and body copy. */
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

/** Arabic — Qur'anic text and the wordmark. */
const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NUR — light upon light",
  description:
    "Nasheeds, Qur'an, Seerah, dhikr and reflection — one quiet place to return to each day.",
  applicationName: "NUR",
  appleWebApp: {
    capable: true,
    title: "NUR",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0A12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="bg-ink text-parchment relative min-h-full">
        <Starfield />
        {children}
        <AmbientAudio />
      </body>
    </html>
  );
}
