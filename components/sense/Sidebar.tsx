"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Gamepad2,
  Home,
  Settings,
  Swords,
  Trophy,
  User,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/firebase/auth";

const COLLAPSED_KEY = "sense:collapsed";

const PRACTICE = [
  { key: "/", label: "Home", icon: Home, k: "H" },
  { key: "/leaderboard", label: "Leaderboard", icon: Trophy, k: "L" },
  { key: "/multiplayer", label: "Multiplayer", icon: Swords, k: "M" },
  { key: "/test", label: "AI Test", icon: FileText, k: "T" },
  { key: "/games", label: "Mini-games", icon: Gamepad2, k: "G" },
];

const ACCOUNT = [
  { key: "/profile", label: "Profile", icon: User, k: "P" },
  { key: "/settings", label: "Settings", icon: Settings, k: "," },
];

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: (next: boolean) => void;
};

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

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
            <strong>{user?.displayName || "Sense Player"}</strong>
            <span>sign out</span>
          </div>
        </button>
        <div style={{ fontSize: 10, color: "var(--muted)" }}>v2.0 · UIL ’26 season</div>
      </div>
    </aside>
  );
}

/** Read the persisted collapse state. Used by AppShell to lift state. */
export function useCollapsedState(): [boolean, (next: boolean) => void] {
  const [collapsed, setCollapsedState] = useState(false);
  useEffect(() => {
    try {
      setCollapsedState(localStorage.getItem(COLLAPSED_KEY) === "true");
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
