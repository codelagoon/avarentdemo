"use client"

import * as Sentry from "@sentry/nextjs"

export default function SentryExamplePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#FAFAFA] p-8 font-sans">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Sentry Test Page</h1>
        <p className="text-sm text-slate-600">
          Send a test error to verify your Sentry connection.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            Sentry.captureException(new Error("Sentry Frontend Error"))
          }}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Send test error
        </button>
        <button
          type="button"
          onClick={() => {
            throw new Error("Sentry Uncaught Error")
          }}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Throw uncaught error
        </button>
      </div>
    </div>
  )
}
