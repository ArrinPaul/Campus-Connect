"use client"

import { useEffect, useRef, useCallback } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

const HEARTBEAT_INTERVAL = 60000 // 60 seconds

/**
 * useHeartbeat
 * Sends a heartbeat to the server every 60s when the tab is active.
 * Updates the user's lastSeenAt and auto-sets status to "online" if applicable.
 */
export function useHeartbeat(enabled: boolean = true) {
  const heartbeat = useMutation(api.presence.heartbeat)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isVisibleRef = useRef(true)

  const sendHeartbeat = useCallback(async () => {
    if (!isVisibleRef.current) return
    try {
      await heartbeat()
    } catch {
      // Silently fail — heartbeat is best-effort
    }
  }, [heartbeat])

  useEffect(() => {
    if (!enabled) return

    // Send initial heartbeat
    sendHeartbeat()

    // Set up interval
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)

    // Visibility change handler — pause when tab is hidden
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
      if (!document.hidden) {
        // Tab became visible — send immediate heartbeat
        sendHeartbeat()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled, sendHeartbeat])
}
