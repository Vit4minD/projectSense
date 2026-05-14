import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Zetamac",
  description: "Speed math drill — addition, subtraction, multiplication, division.",
};

export default function ZetamacLayout({ children }: { children: ReactNode }) {
  return children;
}
