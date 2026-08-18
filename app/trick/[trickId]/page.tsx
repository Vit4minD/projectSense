import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Lightbulb } from "lucide-react";
import { TrickStats } from "@/components/sense/TrickStats";
import { TRICKS, getTrickById } from "@/lib/data/tricks";
import { CATEGORIES } from "@/lib/data/categories";
import { getTip } from "@/lib/data/tips";
import { SITE_URL, SITE_NAME } from "@/lib/config/site";

type Params = Promise<{ trickId: string }>;

// Pre-render all 52 trick pages at build time — fully static, crawlable HTML.
export function generateStaticParams() {
  return TRICKS.map((t) => ({ trickId: t.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { trickId } = await params;
  const trick = getTrickById(trickId);
  if (!trick) return { title: "Trick not found" };
  const tip = getTip(trick.id);
  const description = tip?.tip
    ? `${tip.tip} Example: ${trick.example}.`
    : `Practice "${trick.name}". Example: ${trick.example}.`;
  const url = `${SITE_URL}/trick/${trick.id}`;
  return {
    title: trick.name,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${trick.name} · ${SITE_NAME}`, description, url, type: "article" },
    twitter: { card: "summary_large_image", title: `${trick.name} · ${SITE_NAME}`, description },
  };
}

export default async function TrickPage({ params }: { params: Params }) {
  const { trickId } = await params;
  const trick = getTrickById(trickId);
  if (!trick) notFound();

  const tip = getTip(trick.id);
  const categoryLabel =
    CATEGORIES.find((c) => c.key === trick.cat)?.label ?? trick.cat;
  const related = TRICKS.filter((t) => t.cat === trick.cat && t.id !== trick.id)
    .sort((a, b) => Number(a.id) - Number(b.id))
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: trick.name,
    description: tip?.tip ?? `Practice ${trick.name}.`,
    url: `${SITE_URL}/trick/${trick.id}`,
    educationalUse: "practice",
    learningResourceType: "Math practice drill",
    educationalLevel: "secondary school",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <div className="main" style={{ maxWidth: 920, margin: "0 auto", padding: "0 20px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Public header — visible to logged-out visitors and crawlers. */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 0",
        }}
      >
        <Link href="/" className="brand-name" style={{ textDecoration: "none" }}>
          <span className="brand-project">Project</span> Sense
        </Link>
        <nav style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>
          <Link href="/login" className="btn">
            Sign in
          </Link>
          <Link href={`/drill/${trick.id}`} className="btn primary">
            Practice this trick <ArrowRight size={12} />
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <div className="caps" style={{ color: "var(--muted)", marginBottom: 8 }}>
            trick / {trick.id} · {categoryLabel}
          </div>
          <h1 className="hero-title">
            {trick.name.split(" ").slice(0, -1).join(" ")}{" "}
            <em>{trick.name.split(" ").slice(-1).join(" ")}</em>
          </h1>
          <div className="hero-sub" style={{ fontFamily: "var(--mono)", fontSize: 14 }}>
            {trick.example}
          </div>
          <div className="hero-cta">
            <Link className="btn accent" href={`/drill/${trick.id}`}>
              <ArrowRight size={12} /> Drill this trick
            </Link>
            <span style={{ color: "var(--muted)", fontSize: 12, alignSelf: "center" }}>
              {"•".repeat(trick.difficulty)}
              <span style={{ color: "var(--muted-2)" }}>{"•".repeat(3 - trick.difficulty)}</span>{" "}
              difficulty
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <span className="big-num">/{trick.id}</span>
        </div>
      </section>

      {tip && (
        <>
          <div className="section-head">
            <h2>
              <Lightbulb size={14} style={{ display: "inline", marginRight: 6 }} />
              How to
            </h2>
          </div>
          <div
            style={{ background: "var(--bg-soft)", borderRadius: 16, padding: 20, fontSize: 14, lineHeight: 1.6 }}
          >
            <p style={{ margin: 0 }}>{tip.tip}</p>
            {tip.mnemonic && (
              <p className="caps" style={{ marginTop: 12, color: "var(--muted)", fontSize: 11 }}>
                mnemonic · {tip.mnemonic}
              </p>
            )}
          </div>
        </>
      )}

      {/* Authed extras (your best/history/leaderboard) or a sign-in CTA. */}
      <TrickStats trickId={trick.id} />

      {related.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 40 }}>
            <h2>
              Related tricks <span className="count">· {related.length}</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {related.map((t) => (
              <Link
                key={t.id}
                href={`/trick/${t.id}`}
                className="trick-card"
                style={{ textDecoration: "none", display: "block", padding: 18 }}
              >
                <div className="caps" style={{ color: "var(--muted)", fontSize: 10, marginBottom: 6 }}>
                  trick / {t.id}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
                <div className="mono" style={{ color: "var(--muted)", fontSize: 13 }}>
                  {t.example}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <div style={{ margin: "40px 0", display: "flex", justifyContent: "flex-end" }}>
        <Link className="btn primary" href={`/drill/${trick.id}`}>
          Drill this trick <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
