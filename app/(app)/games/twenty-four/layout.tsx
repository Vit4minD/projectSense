import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Twenty-Four",
  description:
    "Make 24 from four numbers using +, −, ×, ÷. Sixty seconds. Bonus time per solve.",
};

export default function TwentyFourLayout({ children }: { children: ReactNode }) {
  return children;
}
