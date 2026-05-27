/**
 * Global sync event bus for live cross-view data synchronization.
 * All services emit events after mutations; all views/components subscribe
 * via useLiveData to stay in sync without prop drilling.
 */

type Listener = () => void

const channels: Map<string, Set<Listener>> = new Map()

/**
 * Subscribe to a sync channel. Returns unsubscribe function.
 */
export function subscribe(channel: string, listener: Listener): () => void {
  if (!channels.has(channel)) {
    channels.set(channel, new Set())
  }
  channels.get(channel)!.add(listener)
  return () => {
    channels.get(channel)?.delete(listener)
  }
}

/**
 * Emit a sync event on a channel. All subscribers re-render.
 */
export function emit(channel: string): void {
  const listeners = channels.get(channel)
  if (listeners) {
    listeners.forEach((l) => l())
  }
  // Also emit wildcard for global refresh
  const wild = channels.get("*")
  if (wild) {
    wild.forEach((l) => l())
  }
}

/**
 * Get a list of active channel names (for debugging).
 */
export function activeChannels(): string[] {
  return Array.from(channels.keys())
}

/**
 * Number of listeners on a channel (for debugging).
 */
export function listenerCount(channel: string): number {
  return channels.get(channel)?.size ?? 0
}
