import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Test Generator",
  description: "Generate full UIL Number Sense practice tests with AI.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
