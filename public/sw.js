// Campus Connect Service Worker
// Handles push notifications and background sync

/// <reference lib="webworker" />
// @ts-nocheck

const CACHE_NAME = "campus-connect-v1"
const OFFLINE_URL = "/offline"

// ── Install ──────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([OFFLINE_URL]).catch(() => {
        // Offline page may not exist yet — that's OK
      })
    )
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Push ─────────────────────────────────────
self.addEventListener("push", (event) => {
  let payload = {}

  try {
    payload = event.data?.json() ?? {}
  } catch {
    payload = { title: "Campus Connect", body: event.data?.text() ?? "New notification" }
  }

  const title = payload.title ?? "Campus Connect"
  const options = {
    body: payload.body ?? "You have a new notification",
    icon: payload.icon ?? "/icons/icon-192x192.png",
    badge: payload.badge ?? "/icons/badge-72x72.png",
    data: { url: payload.url ?? "/" },
    tag: "campus-connect-notification",
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ── Notification click ────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? "/"
  const absoluteUrl = new URL(url, self.location.origin).href

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus an existing window if one is open with this URL
        const matching = clients.find((c) => c.url === absoluteUrl)
        if (matching) return matching.focus()
        // Otherwise open a new window
        return self.clients.openWindow(absoluteUrl)
      })
  )
})

// ── Fetch (offline fallback) ──────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r ?? Response.error())
      )
    )
  }
})
