import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Multiplayer",
  description: "Race friends in real-time UIL Number Sense battles.",
};

export default function MultiplayerLayout({ children }: { children: ReactNode }) {
  return children;
}
