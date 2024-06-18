import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MathJaxContext } from "better-react-mathjax";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Sense",
  description: "henry tran",
  icons: "/projectSenseLogo.png"
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
