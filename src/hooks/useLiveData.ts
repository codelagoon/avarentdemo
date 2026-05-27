import { useState, useEffect, useCallback } from "react"
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
 */
export function useLiveData<T>(getter: () => T, channels: string[]): T {
  const [value, setValue] = useState<T>(getter)

  const refresh = useCallback(() => {
    setValue(getter())
  }, [getter])

  useEffect(() => {
    // Initial load
    refresh()

    // Subscribe to all specified channels
    const unsubs = channels.map((ch) => subscribe(ch, refresh))

    // Also listen for localStorage changes from other tabs
    const handleStorage = () => {
      // Any localStorage change refreshes everything since multiple services share storage
      refresh()
    }
    window.addEventListener("storage", handleStorage)

    return () => {
      unsubs.forEach((u) => u())
      window.removeEventListener("storage", handleStorage)
    }
  }, [refresh, channels])

  return value
}
