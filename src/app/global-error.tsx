"use client";

/**
 * Last-resort boundary: catches failures in the root layout itself, so it has
 * to render its own <html>/<body> and cannot rely on globals.css having loaded.
 * Styles are inline for that reason.
 */
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
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.25rem",
          textAlign: "center",
          background: "#082A11",
          color: "#FFFFFF",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "#9FC6AC", fontSize: "0.9rem", maxWidth: "24rem", margin: 0 }}>
          The app hit an unexpected error and couldn&apos;t recover on its own.
        </p>
        <button
          onClick={reset}
          style={{
            minHeight: "3rem",
            padding: "0 1.75rem",
            borderRadius: "0.5rem",
            border: 0,
            cursor: "pointer",
            fontWeight: 700,
            color: "#0A0A0A",
            background: "#F0C018",
          }}
        >
          Reload
        </button>
        {error.digest && (
          <p style={{ color: "rgba(159,198,172,0.6)", fontSize: "0.7rem", margin: 0 }}>
            ref {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
