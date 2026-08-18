import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "./providers";
import { AnalyticsProvider } from "@/components/sense/AnalyticsProvider";

// Single type family across the whole app — warm and rounded (slightly playful)
// but clean and highly readable (professional). One typeface = far less visual
// noise than the previous three (display + serif + mono).
const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const SITE_URL = "https://project-sense.vercel.app";
const SITE_NAME = "Project Sense";
const SITE_DESCRIPTION =
  "A practice gym for UIL Number Sense — drill the canon, race your friends, sit AI-generated papers.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: "%s | Project Sense",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "UIL",
    "TMSCA",
    "Number Sense",
    "Project Sense",
    "math drills",
    "mental math",
    "speed math",
    "practice tests",
  ],
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
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#FDBA74",
  width: "device-width",
  initialScale: 1,
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
    <html
      lang="en"
      data-theme="sage"
      data-mono-numerals="false"
      data-density="comfortable"
      className={nunito.variable}
      suppressHydrationWarning
    >
      <body>
        {jsonLd.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        <Providers>
          <AnalyticsProvider />
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
