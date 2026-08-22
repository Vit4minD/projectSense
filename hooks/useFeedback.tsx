"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type FeedbackCtx = { open: boolean; setOpen: (v: boolean) => void };
const Ctx = createContext<FeedbackCtx>({ open: false, setOpen: () => {} });

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useFeedback = () => useContext(Ctx);
