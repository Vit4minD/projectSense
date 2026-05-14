import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in or create your free Project Sense account to track your scores and compete on the leaderboard.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
