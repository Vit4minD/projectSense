"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="main">
      <section className="hero">
        <div>
          <h1 className="hero-title">
            Something <em>went wrong</em>
          </h1>
          <p className="hero-sub">
            The app hit a snag. Give it another try, or head back home.
          </p>
          <div className="hero-cta">
            <button className="btn primary" type="button" onClick={() => reset()}>
              Try again
            </button>
            <Link className="btn" href="/">
              Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
