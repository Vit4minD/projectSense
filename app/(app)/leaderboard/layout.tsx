import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Top times for every UIL Number Sense trick. Compete with practitioners worldwide.",
};

export default function LeaderboardLayout({ children }: { children: ReactNode }) {
  return children;
}
