import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Sense",
  description: "Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!",
  manifest: "/manifest.json",
  openGraph: {
    type: 'website',
    url: 'https://project-sense.vercel.app/',
    title: 'Project Sense',
    description: 'Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!',
    images: [
      {
        url: 'https://project-sense.vercel.app/opengraph-image.png',
        alt: 'image',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: 'H.T.',  // Optional: Replace with your Twitter handle
    title: 'Project Sense',
    description: 'Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!',
    images: [
      {
        url: 'https://project-sense.vercel.app/twitter-image.png',
        alt: 'image',
      },
    ],
  },
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
