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
          background: "#0b0704",
          color: "#f3e8dc",
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
            background: "linear-gradient(160deg, #1a120b 0%, #0f0a06 100%)",
            border: "1px solid #3a2a1c",
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
              border: "1px solid rgba(249,115,22,0.28)",
              background: "rgba(249,115,22,0.1)",
              color: "#fdba74",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            !
          </div>
          <h1 style={{ margin: "18px 0 0", fontSize: 22, letterSpacing: "-0.02em" }}>
            FakeShield AI could not load
          </h1>
          <p style={{ margin: "10px 0 0", color: "#b39c88", fontSize: 13, lineHeight: 1.7 }}>
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
              border: "1px solid rgba(249,115,22,0.35)",
              background: "linear-gradient(90deg, #fb923c, #f97316)",
              color: "#180a02",
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
