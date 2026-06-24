/**
 * Foundational security event logging.
 * Phase 2 can route these to a durable audit store or SIEM.
 */

export type AuthEventType =
  | "auth.sign_in.success"
  | "auth.sign_in.failure"
  | "auth.sign_up.success"
  | "auth.sign_up.failure"
  | "auth.sign_out"
  | "auth.session.expired"
  | "auth.access.denied"

export interface AuthEvent {
  type: AuthEventType
  timestamp: string
  userId?: string
  email?: string
  path?: string
  reason?: string
}

export function logAuthEvent(event: Omit<AuthEvent, "timestamp">): void {
  const record: AuthEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[auth-event]", JSON.stringify(record))
  } else {
    console.info("[auth-event]", record.type, record.userId ?? "anonymous")
  }
}
