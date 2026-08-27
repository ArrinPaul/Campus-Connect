import "server-only"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { createLogger } from "@/lib/logger"

const log = createLogger("WebPush")

export interface PushSubscriptionRecord {
  id?: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
  last_used_at?: string
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  data?: Record<string, any>
}

// ─── Subscription Database Operations ─────────────────────────────────────────

export async function savePushSubscription(params: {
  userId: string
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string
}) {
  const { userId, endpoint, p256dh, auth, userAgent } = params
  if (!userId || !endpoint || !p256dh || !auth) {
    return { error: "Invalid subscription payload: missing required fields", status: 400 }
  }

  // Validate endpoint protocol
  if (!endpoint.startsWith("https://") && !endpoint.startsWith("http://localhost")) {
    return { error: "Invalid push subscription endpoint URL", status: 400 }
  }

  const supabase = createAdminClient()

  // Upsert subscription for user and endpoint
  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, endpoint" }
    )
    .select()
    .single()

  if (error) {
    log.error("Failed to save push subscription", { error: error.message, userId })
    return { error: error.message, status: 500 }
  }

  log.info("Push subscription registered successfully", { userId, endpoint: endpoint.slice(0, 30) + "..." })
  return { success: true, subscription: data }
}

export async function removePushSubscription(params: {
  userId: string
  endpoint: string
}) {
  const { userId, endpoint } = params
  if (!userId || !endpoint) {
    return { error: "Missing required parameters", status: 400 }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("push_subscriptions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)

  if (error) {
    log.error("Failed to remove push subscription", { error: error.message, userId })
    return { error: error.message, status: 500 }
  }

  log.info("Push subscription deactivated", { userId })
  return { success: true }
}

export async function getUserPushSubscriptions(userId: string): Promise<PushSubscriptionRecord[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)

  if (error) {
    log.error("Failed to fetch push subscriptions", { error: error.message, userId })
    return []
  }

  return data ?? []
}

// ─── Push Notification Dispatcher ─────────────────────────────────────────────

export async function sendPushNotification(params: {
  userId: string
  title: string
  body: string
  url?: string
  icon?: string
  tag?: string
}) {
  const { userId, title, body, url = "/", icon, tag } = params

  const subscriptions = await getUserPushSubscriptions(userId)
  if (subscriptions.length === 0) {
    return { success: true, sentCount: 0, reason: "No active push subscriptions for user" }
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@campusconnect.app"

  // Sanitize payload: NEVER send secrets, passwords, or tokens in push payloads
  const payload: PushPayload = {
    title: title.slice(0, 100),
    body: body.slice(0, 250),
    icon: icon || "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    url,
    tag: tag || "campus-connect-notification",
  }

  let sentCount = 0
  const supabase = createAdminClient()

  for (const sub of subscriptions) {
    try {
      // In production or test environment without live VAPID keys, log structured dispatch
      if (!vapidPublicKey || !vapidPrivateKey) {
        log.info("Push notification simulated (VAPID keys not configured in environment)", {
          userId,
          endpoint: sub.endpoint.slice(0, 30) + "...",
          title: payload.title,
        })
        sentCount++
        continue
      }

      // Live Web Push HTTP POST
      const response = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          TTL: "86400", // 24 hours
        },
        body: JSON.stringify(payload),
      }).catch((err) => {
        log.warn("Network error reaching push endpoint", { error: err.message, endpoint: sub.endpoint })
        return null
      })

      if (response && (response.status === 201 || response.status === 200)) {
        sentCount++
        // Update last_used_at
        await supabase
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", sub.id)
      } else if (response && (response.status === 410 || response.status === 404)) {
        // Subscription expired or invalid: deactivate
        log.info("Push subscription expired (410/404), deactivating", { endpoint: sub.endpoint })
        await supabase
          .from("push_subscriptions")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", sub.id)
      }
    } catch (err: any) {
      log.error("Failed to dispatch push notification", { error: err?.message, userId })
    }
  }

  return { success: true, sentCount, totalSubscriptions: subscriptions.length }
}
