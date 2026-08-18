import Link from "next/link";

export default function NotFound() {
  return (
    <div className="main">
      <section className="hero">
        <div>
          <h1 className="hero-title">
            Page <em>not found</em>
          </h1>
          <p className="hero-sub">
            We couldn&apos;t find the page you were looking for. It may have
            moved or never existed.
          </p>
          <div className="hero-cta">
            <Link className="btn primary" href="/">
              Back home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
