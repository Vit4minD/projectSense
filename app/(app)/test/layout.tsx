import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI Test | Project Sense",
  description: "Generate a 40-question UIL Number Sense practice test.",
};

export default function TestLayout({ children }: { children: ReactNode }) {
  return children;
}
