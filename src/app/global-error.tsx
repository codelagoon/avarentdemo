"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, background: "#0F0F10", color: "#FAFAFA", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ fontSize: "0.875rem", color: "#A1A1AA", maxWidth: "400px", textAlign: "center" }}>
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#C4601E", color: "#FAFAFA", border: "none", cursor: "pointer", fontWeight: 500 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
