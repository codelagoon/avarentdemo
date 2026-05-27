import { useState, useEffect, useCallback, useRef } from "react"
import { subscribe } from "@/lib/sync"

/**
 * React hook for live service data.
 *
 * @param getter  Function that returns the latest data from a service
 * @param channels  One or more sync channels to listen to (re-runs getter on emit)
 * @returns Current data value
 *
 * Example:
 *   const entries = useLiveData(() => ledgerService.getAll(), ["ledger"])
 *
 * IMPORTANT: Pass a stable `getter` reference (defined outside render or wrapped in
 * useCallback) and a stable `channels` array (e.g. a module-level const) to prevent
 * infinite re-render loops.
 */
export function useLiveData<T>(getter: () => T, channels: string[]): T {
  const [value, setValue] = useState<T>(getter)

  // Stable ref to the latest getter so we never need getter in dependency arrays
  const getterRef = useRef(getter)
  useEffect(() => {
    getterRef.current = getter
  })

  // Stable ref to channels string so we only re-subscribe when the channel list
  // actually changes (compares by serialized value, not array identity)
  const channelsKey = channels.join(",")

  const refresh = useCallback(() => {
    setValue(getterRef.current())
  }, []) // intentionally empty — uses ref

  useEffect(() => {
    // Initial load
    refresh()

    // Subscribe to all specified channels
    const chList = channelsKey ? channelsKey.split(",") : []
    const unsubs = chList.map((ch) => subscribe(ch, refresh))

    // Also listen for localStorage changes from other tabs
    const handleStorage = () => {
      refresh()
    }
    window.addEventListener("storage", handleStorage)

    return () => {
      unsubs.forEach((u) => u())
      window.removeEventListener("storage", handleStorage)
    }
  }, [refresh, channelsKey]) // channelsKey is a primitive — stable

  return value
}
