// Campus Connect Service Worker
// Handles push notifications, caching strategies, and offline support

/// <reference lib="webworker" />
// @ts-nocheck

const CACHE_VERSION = 2
const STATIC_CACHE = `campus-connect-static-v${CACHE_VERSION}`
const DYNAMIC_CACHE = `campus-connect-dynamic-v${CACHE_VERSION}`
const IMAGE_CACHE = `campus-connect-images-v${CACHE_VERSION}`
const ALL_CACHES = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE]
const OFFLINE_URL = "/offline"

// App shell: critical resources precached on install
const APP_SHELL = [
  OFFLINE_URL,
  "/",
  "/feed",
]

// Cache limits
const DYNAMIC_CACHE_LIMIT = 50
const IMAGE_CACHE_LIMIT = 100

// Trim cache to a max number of entries
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > maxItems) {
    await cache.delete(keys[0])
    return trimCache(cacheName, maxItems)
  }
}

// ── Install ──────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {
        // Pages may not exist in dev — safe to ignore
      })
    )
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      )
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
        const matching = clients.find((c) => c.url === absoluteUrl)
        if (matching) return matching.focus()
        return self.clients.openWindow(absoluteUrl)
      })
  )
})

// ── Fetch ─────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin API requests (Convex, Clerk, etc.)
  if (request.method !== "GET") return
  if (url.origin !== self.location.origin && !isImageCDN(url)) return

  // Navigation requests: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  // Static assets (_next/static): cache-first (immutable, content-hashed)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Images: cache-first with image cache
  if (request.destination === "image" || isImageCDN(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }

  // Fonts: cache-first
  if (request.destination === "font") {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Other same-origin assets: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }
})

// ── Caching strategies ────────────────────────

/** Network-first for navigations, falls back to cache or offline page */
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
      trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT)
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    const offline = await caches.match(OFFLINE_URL)
    return offline ?? Response.error()
  }
}

/** Cache-first: serve from cache, fetch and cache on miss */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
      if (cacheName === IMAGE_CACHE) {
        trimCache(IMAGE_CACHE, IMAGE_CACHE_LIMIT)
      }
    }
    return response
  } catch {
    return Response.error()
  }
}

/** Stale-while-revalidate: serve from cache immediately, update in background */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(DYNAMIC_CACHE)
        cache.then((c) => c.put(request, response.clone()))
        trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT)
      }
      return response
    })
    .catch(() => cached ?? Response.error())

  return cached ?? fetchPromise
}

/** Check if a URL is from an image CDN we should cache */
function isImageCDN(url) {
  return (
    url.hostname.endsWith(".convex.cloud") ||
    url.hostname.endsWith(".clerk.dev") ||
    url.hostname === "images.unsplash.com"
  )
}
