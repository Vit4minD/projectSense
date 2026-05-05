import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See top times for every UIL Number Sense trick. Compete with practitioners worldwide.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
