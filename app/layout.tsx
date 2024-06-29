import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Head from "next/head";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Sense",
  description: "Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!",
  manifest: "/manifest.json",
  twitter: { card: "summary_large_image", site: "https://project-sense.vercel.app/", creator: "H.T.", "images": "/projectSenseLogo-1200.png" },
  openGraph: {
    type: "website",
    url: "https://project-sense.vercel.app/",
    title: "Project Sense",
    description: "Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!",
    siteName: "Project Sense",
    images: [{
      url: "/projectSenseLogo-1200.png",
    }],
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
