"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FDBA74",
          color: "#1C1410",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "460px" }}>
          <h1
            style={{
              fontSize: "40px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              margin: "0 0 12px",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "17px",
              lineHeight: 1.5,
              margin: "0 0 24px",
              color: "#2A1F18",
            }}
          >
            The app hit a snag. Give it another try in a moment.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              appearance: "none",
              border: "none",
              cursor: "pointer",
              background: "#1C1410",
              color: "#FDBA74",
              fontSize: "16px",
              fontWeight: 600,
              padding: "12px 22px",
              borderRadius: "12px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
