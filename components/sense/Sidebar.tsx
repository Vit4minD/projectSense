"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Gamepad2,
  Home,
  Swords,
  Trophy,
  User,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFeedback } from "@/hooks/useFeedback";
import { signOut } from "@/lib/firebase/auth";

const COLLAPSED_KEY = "sense:collapsed";

export const PRACTICE = [
  { key: "/", label: "Home", icon: Home, k: "H" },
  { key: "/leaderboard", label: "Leaderboard", icon: Trophy, k: "L" },
  { key: "/multiplayer", label: "Multiplayer", icon: Swords, k: "M" },
  { key: "/test", label: "AI Test", icon: FileText, k: "T" },
  { key: "/games", label: "Mini-games", icon: Gamepad2, k: "G" },
];

const ACCOUNT = [
  { key: "/profile", label: "Profile", icon: User, k: "P" },
];

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: (next: boolean) => void;
};

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { setOpen: setFeedbackOpen } = useFeedback();

  const initials =
    user?.displayName
      ?.split(/\s+/)
      .filter(Boolean)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") || "S";

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-name">
          <span className="brand-project">Project</span> Sense
        </span>
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{ marginLeft: "auto" }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <nav className="nav">
        <div className="nav-section">Practice</div>
        {PRACTICE.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.key || (it.key !== "/" && pathname.startsWith(it.key));
          return (
            <button
              key={it.key}
              className={`nav-item ${active ? "active" : ""}`}
              onClick={() => router.push(it.key)}
            >
              <Icon size={15} />
              <span>{it.label}</span>
              <span className="kbd">{it.k}</span>
            </button>
          );
        })}

        <div className="nav-section">Account</div>
        {ACCOUNT.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.key;
          return (
            <button
              key={it.key}
              className={`nav-item ${active ? "active" : ""}`}
              onClick={() => router.push(it.key)}
            >
              <Icon size={15} />
              <span>{it.label}</span>
              <span className="kbd">{it.k}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="user-chip"
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
          title="Sign out"
          style={{ border: "none", textAlign: "left", cursor: "pointer", width: "100%" }}
        >
          <div className="avatar">{initials}</div>
          <div className="user-meta">
            <strong>{user?.email?.split("@")[0] || user?.displayName || "Sense Player"}</strong>
            <span>sign out</span>
          </div>
        </button>
        <button
          type="button"
          className="nav-item"
          onClick={() => setFeedbackOpen(true)}
          style={{ width: "100%" }}
        >
          <MessageSquare size={15} />
          <span>Send feedback</span>
        </button>
        <div style={{ fontSize: 10, color: "var(--muted)" }}>v2.0 · UIL ’26 season</div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { setOpen: setFeedbackOpen } = useFeedback();
  const initial = user?.displayName?.trim().charAt(0).toUpperCase() || "S";

  return (
    <>
      <button
        type="button"
        className="mobile-account"
        onClick={() => router.push("/profile")}
        aria-label="Open profile"
        aria-current={pathname === "/profile" ? "page" : undefined}
      >
        {initial}
      </button>
      <button
        type="button"
        className="mobile-account"
        onClick={() => setFeedbackOpen(true)}
        aria-label="Send feedback"
        style={{ right: 62, background: "var(--bg-raised)", color: "var(--ink)" }}
      >
        <MessageSquare size={18} />
      </button>
      <nav className="mobile-nav" aria-label="Primary navigation">
        {PRACTICE.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.key ||
            (item.key !== "/" && pathname.startsWith(item.key));
          return (
            <button
              key={item.key}
              type="button"
              className={active ? "active" : ""}
              onClick={() => router.push(item.key)}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{item.label === "Mini-games" ? "Games" : item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

/** Read the persisted collapse state. Used by AppShell to lift state. */
export function useCollapsedState(): [boolean, (next: boolean) => void] {
  // Default to collapsed (nav closed). Only expand when the user has explicitly
  // opened it before (persisted as "false").
  const [collapsed, setCollapsedState] = useState(true);
  useEffect(() => {
    try {
      setCollapsedState(localStorage.getItem(COLLAPSED_KEY) !== "false");
    } catch {
      // ignore
    }
  }, []);
  const setCollapsed = (next: boolean) => {
    setCollapsedState(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, String(next));
    } catch {
      // ignore
    }
  };
  return [collapsed, setCollapsed];
}
