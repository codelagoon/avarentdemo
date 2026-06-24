import * as Sentry from "@sentry/nextjs"
import posthog from "posthog-js"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  enableLogs: true,

  integrations: [Sentry.replayIntegration()],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  debug: false,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
})
