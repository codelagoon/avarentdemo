/** Client-side hint only — prefer `/api/auth/status` for routing decisions. */
export function isWorkOSClientEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID &&
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI
  )
}
