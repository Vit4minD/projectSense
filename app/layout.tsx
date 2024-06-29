import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Head from "next/head";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Sense",
  description: "Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-512x512.png"
    
  },
  themeColor: "#fdba74"
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
        <meta name="description" content="Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!" />
        <meta property="og:image" content="/icon-512x512.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="og:image" content="https://www.apple.com/v/iphone/home/t/images/home/og.png?201610171354" />
      </Head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
