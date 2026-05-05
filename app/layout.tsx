import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AnalyticsProvider from "./components/AnalyticsProvider";
const inter = Inter({ subsets: ["latin"] });

const SITE_URL = "https://project-sense.vercel.app";
const SITE_NAME = "Project Sense";
const SITE_DESCRIPTION =
  "Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: "%s | Project S.",
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json",
  metadataBase: new URL(`${SITE_URL}/`),
  keywords: ["TMSCA", "UIL", "Number Sense", "Project Sense", "Math", "Test", "Question", "Speed"],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/projectSenseLogo.png`,
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {jsonLd.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        {children}
        <AnalyticsProvider />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
