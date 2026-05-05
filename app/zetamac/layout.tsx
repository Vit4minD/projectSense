import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zetamac",
  description:
    "Speed math drills, Zetamac-style — addition, subtraction, multiplication, division.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
