/** PostHog public config — must be set in Vercel for production builds. */
export function getPostHogProjectToken(): string | undefined {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim()
  return token || undefined
}

export function getPostHogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com"
}

export function isPostHogConfigured(): boolean {
  return Boolean(getPostHogProjectToken())
}
