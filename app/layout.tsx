import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AnalyticsProvider from "./components/AnalyticsProvider";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Project Sense",
    template: "%s | Project S.",
  },
  description:
    "Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!",
  manifest: "/manifest.json",
  twitter: {
    card: "summary_large_image",
  },
  metadataBase: new URL("https://project-sense.vercel.app/"),
  keywords: ["TMSCA", "UIL", "Number Sense", "Project Sense", "Math", "Test", "Question", "Speed"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <AnalyticsProvider />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
