import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Sense",
  description: "Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!",
  manifest: "/manifest.json",
  twitter: {
    card: "summary_large_image",
  }
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* <Head>
        <title>Project Sense</title>
        <meta name="description" content="Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!" />
        <meta property="og:url" content="https://project-sense.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Project Sense" />
        <meta property="og:description" content="Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!" />
        <meta property="og:image" content="https://ogcdn.net/e4b8c678-7bd5-445d-ba03-bfaad510c686/v4/project-sense.vercel.app/Project%20Sense/https%3A%2F%2Fproject-sense-6ysr7llve-henry-trans-projects.vercel.app%2Fopengraph-image.png%3F83e7d7e34c916d3f/og.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="project-sense.vercel.app" />
        <meta property="twitter:url" content="https://project-sense.vercel.app/" />
        <meta name="twitter:title" content="Project Sense" />
        <meta name="twitter:description" content="Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!" />
        <meta name="twitter:image" content="https://ogcdn.net/e4b8c678-7bd5-445d-ba03-bfaad510c686/v4/project-sense.vercel.app/Project%20Sense/https%3A%2F%2Fproject-sense-6ysr7llve-henry-trans-projects.vercel.app%2Fopengraph-image.png%3F83e7d7e34c916d3f/og.png" />
      </Head> */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}
