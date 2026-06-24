import { subscribe } from "@/lib/sync"

/** Run async client init without surfacing expected pre-tenant failures. */
export function runClientInit(init: () => Promise<void>): void {
  if (typeof window === "undefined") return
  void init().catch(() => {
    // No tenant yet — init retries on tenant/company sync events.
  })
}

/** Run init on load and again when tenant context becomes available. */
export function bindTenantInit(init: () => Promise<void>): void {
  runClientInit(init)
  if (typeof window === "undefined") return
  subscribe("company", () => runClientInit(init))
  subscribe("tenant", () => runClientInit(init))
}
