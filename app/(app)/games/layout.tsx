import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mini Games",
  description: "Twenty-Four and Zetamac — fast mental math drills.",
};

export default function GamesLayout({ children }: { children: ReactNode }) {
  return children;
}
