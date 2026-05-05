import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice Tricks",
  description:
    "Train UIL Number Sense tricks with timed practice sessions and track your progress.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
