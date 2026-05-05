import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "24 Game",
  description:
    "Play the classic 24 number game — make 24 from four numbers using basic operations.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
