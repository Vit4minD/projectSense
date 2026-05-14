import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your stats, weekly progress, achievements, and best tricks.",
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
