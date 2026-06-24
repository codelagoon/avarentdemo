"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="max-w-md text-center text-sm text-slate-400">
          An unexpected error occurred. This has been logged automatically.
        </p>
        {error.message && (
          <pre className="mt-2 max-w-lg rounded bg-slate-800 px-3 py-2 text-xs text-slate-300 overflow-auto">
            {error.message}
          </pre>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
      >
        Try again
      </button>
    </div>
  )
}
