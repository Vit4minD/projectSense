import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mini-games | Project Sense",
  description: "Twenty-Four and Zetamac — quick math mini-games for sharpening speed.",
};

const GAMES = [
  {
    href: "/games/twenty-four",
    title: "Twenty-Four",
    blurb: "Combine 4 numbers with +, −, ×, ÷ to make 24. Solve as many as you can in 60 seconds.",
    badge: "60s",
  },
  {
    href: "/games/zetamac",
    title: "Zetamac",
    blurb: "Arithmetic speed drill. Answer as many problems as you can; full operator & range config.",
    badge: "Speed",
  },
];

export default function GamesIndex() {
  return (
    <div className="main games-index">
      <header className="games-head">
        <h1>Mini-games</h1>
        <p>Pick a game. Your highscore for Zetamac is saved locally.</p>
      </header>
      <div className="games-grid">
        {GAMES.map((g) => (
          <Link key={g.href} href={g.href} className="game-card">
            <div className="game-card-badge">{g.badge}</div>
            <h2 className="game-card-title">{g.title}</h2>
            <p className="game-card-blurb">{g.blurb}</p>
            <span className="game-card-cta">Play →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
