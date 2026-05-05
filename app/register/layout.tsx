import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your free Project Sense account to track scores and compete on the leaderboard.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
