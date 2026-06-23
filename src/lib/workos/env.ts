/**
 * WorkOS environment configuration.
 * Required for AuthKit session management and enterprise SSO readiness.
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example for configuration.`
    )
  }
  return value
}

export function getWorkOSApiKey(): string {
  return requireEnv("WORKOS_API_KEY", process.env.WORKOS_API_KEY)
}

export function getWorkOSClientId(): string {
  return requireEnv("WORKOS_CLIENT_ID", process.env.WORKOS_CLIENT_ID)
}

export function getWorkOSCookiePassword(): string {
  const password = requireEnv(
    "WORKOS_COOKIE_PASSWORD",
    process.env.WORKOS_COOKIE_PASSWORD
  )
  if (password.length < 32) {
    throw new Error(
      "WORKOS_COOKIE_PASSWORD must be at least 32 characters. Generate with: openssl rand -base64 24"
    )
  }
  return password
}

export function getWorkOSRedirectUri(): string {
  return requireEnv(
    "NEXT_PUBLIC_WORKOS_REDIRECT_URI",
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI
  )
}

/** True when WorkOS credentials are configured (allows graceful dev fallback). */
export function isWorkOSConfigured(): boolean {
  return Boolean(
    process.env.WORKOS_API_KEY &&
      process.env.WORKOS_CLIENT_ID &&
      process.env.WORKOS_COOKIE_PASSWORD &&
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI
  )
}
