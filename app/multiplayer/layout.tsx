import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multiplayer",
  description: "Race against friends in real-time mental math battles.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
