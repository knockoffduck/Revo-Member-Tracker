"use client";

// Replaces the entire document, so styles are inline: the global stylesheet may
// not have loaded when the root layout throws.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600, margin: "0 0 12px" }}>
            Revo Tracker couldn&apos;t load
          </h1>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "#a1a1aa", margin: "0 0 20px" }}>
            The app failed before the page could render. Reloading usually
            fixes it.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid #3f3f46",
              background: "#fafafa",
              color: "#0a0a0a",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ marginTop: "16px", fontSize: "0.7rem", color: "#52525b" }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
