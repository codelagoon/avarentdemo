import { useState, useEffect, useCallback, useRef } from "react"
import { subscribe } from "@/lib/sync"

/**
 * React hook for live service data.
 * Re-runs getter when sync channels emit (localStorage-backed services).
 */
export function useLiveData<T>(getter: () => T, channels: string[]): T {
  const [value, setValue] = useState<T>(getter)

  const getterRef = useRef(getter)
  useEffect(() => {
    getterRef.current = getter
  })

  const channelsKey = channels.join(",")

  const refresh = useCallback(() => {
    setValue(getterRef.current())
  }, [])

  useEffect(() => {
    refresh()
    const chList = channelsKey ? channelsKey.split(",") : []
    const unsubs = chList.map((ch) => subscribe(ch, refresh))
    const handleStorage = () => refresh()
    window.addEventListener("storage", handleStorage)
    return () => {
      unsubs.forEach((u) => u())
      window.removeEventListener("storage", handleStorage)
    }
  }, [refresh, channelsKey])

  return value
}
