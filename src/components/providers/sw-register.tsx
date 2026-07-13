"use client"

import { useEffect } from "react"

/**
 * Registers the service worker for push notifications and offline support.
 * Only runs in production and in browsers that support service workers.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service worker registered:", reg.scope)
        })
        .catch((err) => {
          console.error("Service worker registration failed:", err)
        })
    }
  }, [])

  return null
}
