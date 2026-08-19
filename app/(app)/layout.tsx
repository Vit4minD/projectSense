"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileNav, Sidebar, useCollapsedState } from "@/components/sense/Sidebar";
import { TweaksPanel } from "@/components/sense/TweaksPanel";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useCollapsedState();

  useKeyboardNav();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // Render an empty shell while auth resolves to avoid flashing the app.
    return <div className="app" aria-busy />;
  }

  return (
    <div className={`app ${collapsed ? "collapsed" : ""}`}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      {children}
      <MobileNav />
      <TweaksPanel />
    </div>
  );
}
