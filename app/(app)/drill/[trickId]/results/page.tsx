"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, X as XIcon } from "lucide-react";
import { TopBar } from "@/components/sense/TopBar";
import { TrickCard } from "@/components/sense/TrickCard";
import { useAuth } from "@/hooks/useAuth";
import { TRICKS, getTrickById } from "@/lib/data/tricks";
import { getDrillById, type SavedDrill } from "@/lib/firebase/drills";
import { formatShort, formatTime } from "@/lib/drill/utils";

export default function ResultsPage() {
  const params = useParams<{ trickId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const drillId = search.get("d");
  const trick = getTrickById(params.trickId);
  const [drill, setDrill] = useState<SavedDrill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !drillId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getDrillById(user.uid, drillId)
      .then((d) => {
        if (!cancelled) {
          setDrill(d);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, drillId]);

  // "R" retry shortcut advertised on the Retry button. Un-modified keys only,
  // never while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (e.key.toLowerCase() === "r" && trick) {
        e.preventDefault();
        router.push(`/drill/${trick.id}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, trick]);

  if (!trick) {
    return (
      <div className="main">
        <h1>Unknown trick</h1>
        <button className="btn primary" onClick={() => router.push("/")}>Home</button>
      </div>
    );
  }

  const suggestedNext = TRICKS.filter((t) => t.cat === trick.cat && t.id !== trick.id).slice(0, 2);

  return (
    <div className="main">
      <TopBar
        crumbs={["sense", "Practice", trick.name, "Results"]}
        right={
          <>
            <button
              className="btn"
              type="button"
              onClick={() => router.push(`/trick/${trick.id}`)}
            >
              Trick stats
            </button>
            <button className="btn" type="button" onClick={() => router.push("/")}>
              Back to tricks
            </button>
            <button
              className="btn primary"
              type="button"
              onClick={() => router.push(`/drill/${trick.id}`)}
            >
              Retry <span className="kbd">R</span>
            </button>
          </>
        }
      />

      <div className="results">
        <div className="results-head">
          <div>
            <div className="caps" style={{ color: "var(--muted)", marginBottom: 8 }}>
              trick / {trick.id} · {drill?.score === "5/5" ? "complete" : "finished"}
            </div>
            <h1 className="result-title">
              {trick.name.split(" ").slice(0, -1).join(" ")}{" "}
              <em>{trick.name.split(" ").slice(-1).join(" ")}</em>
            </h1>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>
              {drill ? `${drill.score} correct` : "saving…"}
            </div>
          </div>
          <div className="result-metric">
            <div className="value">
              {drill ? formatTime(drill.totalMs).replace(/^00:/, "") : "—"}
            </div>
            <div className="label">total time</div>
          </div>
        </div>

        <div className="section-head">
          <h2>Per question</h2>
        </div>
        <div className="per-q-list">
          {loading && <div style={{ color: "var(--muted)" }}>Loading…</div>}
          {!loading && !drill && (
            <div style={{ color: "var(--muted)" }}>
              Drill not found. Try again from the home screen.
            </div>
          )}
          {drill?.perQuestion.map((r, i) => (
            <div key={i} className={`per-q ${r.correct ? "correct" : "wrong"}`}>
              <span className="idx">{(i + 1).toString().padStart(2, "0")}</span>
              <span className="eq">
                {r.problem} = {String(r.expected)}
              </span>
              <span className="answered">
                {r.answer ? `entered ${r.answer}` : "skipped"}
              </span>
              <span className="time">{formatShort(r.ms)}</span>
              <span className="check">
                {r.correct ? <Check size={16} /> : <XIcon size={16} />}
              </span>
            </div>
          ))}
        </div>

        <div className="section-head" style={{ marginTop: 40 }}>
          <h2>Suggested next</h2>
        </div>
        <div className="results-suggestions">
          {suggestedNext.map((t) => (
            <TrickCard
              key={t.id}
              trick={t}
              onClick={() => router.push(`/drill/${t.id}`)}
            />
          ))}
        </div>

        <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end" }}>
          <button
            className="btn primary"
            type="button"
            onClick={() => router.push(`/drill/${trick.id}`)}
          >
            Drill again <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
