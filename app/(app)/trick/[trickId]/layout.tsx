import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTrickById } from "@/lib/data/tricks";

type Params = Promise<{ trickId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { trickId } = await params;
  const trick = getTrickById(trickId);
  if (!trick) {
    return { title: "Trick" };
  }
  return {
    title: trick.name,
    description: `Practice "${trick.name}". Example: ${trick.example}.`,
  };
}

export default function TrickLayout({ children }: { children: ReactNode }) {
  return children;
}
