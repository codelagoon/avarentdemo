"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ margin: 0, background: "#0f172a", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", maxWidth: "400px", textAlign: "center" }}>
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#fff", color: "#0f172a", border: "none", cursor: "pointer", fontWeight: 500 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
