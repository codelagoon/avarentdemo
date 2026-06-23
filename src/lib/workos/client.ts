/** Client-side WorkOS availability check (public client ID only). */
export function isWorkOSClientEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID)
}
