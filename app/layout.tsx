import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   // title: "Project Sense",
//   // description: "Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!",
//   // manifest: "/manifest.json",
// };

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
        <meta property="og:title" content="Project Sense" />
        <meta property="og:description" content="Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!" />
        <meta property="og:image" content="https://project-sense.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://project-sense.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Project Sense" />
        <meta name="twitter:description" content="Practice TMSCA/UIL Number Sense Questions using Project Sense and compete against others through a variety of different tricks (including tutorials)!" />
        <meta name="twitter:image" content="https://project-sense.vercel.app/twitter-image.png" />
      </Head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
