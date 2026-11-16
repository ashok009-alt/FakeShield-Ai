"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: the root layout itself failed, so this renders its own
 * html/body and relies on inline styles only.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#061d1b",
          color: "#f4ecdf",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 460,
            width: "100%",
            textAlign: "center",
            background: "linear-gradient(160deg, #0a2320 0%, #061c1a 100%)",
            border: "1px solid #1f4a43",
            borderRadius: 16,
            padding: "36px 28px",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              margin: "0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: 14,
              border: "1px solid rgba(255, 111, 78,0.28)",
              background: "rgba(255, 111, 78,0.1)",
              color: "#ffb59c",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            !
          </div>
          <h1 style={{ margin: "18px 0 0", fontSize: 22, letterSpacing: "-0.02em" }}>
            FakeShield AI could not load
          </h1>
          <p style={{ margin: "10px 0 0", color: "#b9b3a2", fontSize: 13, lineHeight: 1.7 }}>
            A critical error stopped the app from starting. Reloading usually fixes it — your saved
            analyses are stored in the local database and were not affected.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 22,
              height: 40,
              padding: "0 20px",
              borderRadius: 8,
              border: "1px solid rgba(255, 111, 78,0.35)",
              background: "linear-gradient(90deg, #ff8a66, #ff6f4e)",
              color: "#1a0c08",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reload the app
          </button>
        </div>
      </body>
    </html>
  );
}
