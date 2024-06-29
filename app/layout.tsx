import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Head from "next/head";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Sense",
  description: "Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!",
  manifest: "/manifest.json",
  twitter:{ card: "summary_large_image", site: "@site", creator: "@creator", "images": "/projectSenseLogo-1200.png" }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Head>
        <title>Project Sense</title>
        <meta name="title" content="Project Sense" />
        <meta name="description" content="Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://project-sense.vercel.app/" />
        <meta property="twitter:url" content="https://project-sense.vercel.app/" />
        <meta property="og:title" content="Project Sense" />
        <meta property="og:description" content="Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!" />
        <meta property="og:image" content="/projectSenseLogo-1200.png" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Project Sense" />
        <meta property="twitter:description" content="Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!" />
        <meta property="twitter:image" content="/projectSenseLogo-1200.png" />
      </Head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
