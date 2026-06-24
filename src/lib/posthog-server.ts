import { PostHog } from "posthog-node"
import { getPostHogHost, getPostHogProjectToken } from "@/lib/posthog/env"

let posthogClient: PostHog | null = null

export function getPostHogClient(): PostHog | null {
  const token = getPostHogProjectToken()
  if (!token) return null

  if (!posthogClient) {
    posthogClient = new PostHog(token, {
      host: getPostHogHost(),
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return posthogClient
}

export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown()
  }
}
