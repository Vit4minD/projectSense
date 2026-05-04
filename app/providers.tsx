"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { TweaksProvider } from "@/hooks/useTweaks";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TweaksProvider>{children}</TweaksProvider>
    </AuthProvider>
  );
}
