import { v } from "convex/values"
import { query, mutation, action } from "./_generated/server"

// ──────────────────────────────────────────────
// Auth helper
// ──────────────────────────────────────────────
async function getAuthUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthorized")
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique()
  if (!user) throw new Error("User not found")
  return user
}

// ──────────────────────────────────────────────
// Validation helpers (exported for testing)
// ──────────────────────────────────────────────
export function validatePushSubscription(sub: {
  endpoint: string
  p256dh: string
  auth: string
}): void {
  if (!sub.endpoint?.trim()) throw new Error("Push endpoint is required")
  if (!sub.endpoint.startsWith("https://")) throw new Error("Push endpoint must use HTTPS")
  if (!sub.p256dh?.trim()) throw new Error("p256dh key is required")
  if (!sub.auth?.trim()) throw new Error("auth key is required")
  if (sub.p256dh.length < 10) throw new Error("p256dh key appears to be invalid")
  if (sub.auth.length < 10) throw new Error("auth key appears to be invalid")
}

export const EMAIL_FREQUENCIES = ["daily", "weekly", "never"] as const
export type EmailFrequency = (typeof EMAIL_FREQUENCIES)[number]

export function validateEmailFrequency(freq: string): void {
  if (!(EMAIL_FREQUENCIES as readonly string[]).includes(freq)) {
    throw new Error(`Email frequency must be one of: ${EMAIL_FREQUENCIES.join(", ")}`)
  }
}

export function buildPushPayload(
  type: string,
  data: Record<string, any>
): { title: string; body: string; icon?: string; url?: string } {
  switch (type) {
    case "new_message":
      return {
        title: `New message from ${data.senderName ?? "someone"}`,
        body: data.preview ?? "You have a new message",
        url: `/messages`,
      }
    case "new_comment":
      return {
        title: `${data.commenterName ?? "Someone"} commented on your post`,
        body: data.preview ?? "New comment on your post",
        url: `/posts/${data.postId}`,
      }
    case "new_follower":
      return {
        title: `${data.followerName ?? "Someone"} started following you`,
        body: "Check out their profile",
        url: `/profile/${data.followerUsername}`,
      }
    case "event_reminder":
      return {
        title: `Reminder: ${data.eventTitle ?? "Event"} is coming up`,
        body: data.eventTime ?? "Starting soon",
        url: `/events/${data.eventId}`,
      }
    case "mention":
      return {
        title: `${data.mentionerName ?? "Someone"} mentioned you`,
        body: data.preview ?? "You were mentioned in a post",
        url: `/posts/${data.postId}`,
      }
    default:
      return {
        title: "Campus Connect",
        body: data.message ?? "You have a new notification",
        url: `/notifications`,
      }
  }
}

export function shouldSendDigest(
  frequency: EmailFrequency,
  now: Date
): boolean {
  if (frequency === "never") return false
  if (frequency === "daily") return true
  // weekly: send on Monday (day 1)
  if (frequency === "weekly") return now.getDay() === 1
  return false
}

export function formatDigestSubject(
  frequency: EmailFrequency,
  unreadCount: number
): string {
  const label = frequency === "daily" ? "Today's" : "This Week's"
  if (unreadCount === 0) return `${label} Campus Connect Digest`
  return `${label} Campus Connect Digest (${unreadCount} updates)`
}

// ──────────────────────────────────────────────
// Mutations — Push Subscriptions
// ──────────────────────────────────────────────

export const subscribeToPush = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    validatePushSubscription(args)

    // Upsert: update if endpoint exists for this user
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .filter((q: any) => q.eq(q.field("endpoint"), args.endpoint))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, { p256dh: args.p256dh, auth: args.auth })
      return { subscriptionId: existing._id, updated: true }
    }

    const id = await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      createdAt: Date.now(),
    })
    return { subscriptionId: id, updated: false }
  },
})

export const unsubscribeFromPush = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .filter((q: any) => q.eq(q.field("endpoint"), args.endpoint))
      .first()
    if (sub) await ctx.db.delete(sub._id)
    return { success: true }
  },
})

export const updateEmailPreferences = mutation({
  args: {
    emailDigestFrequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("never")
    ),
    emailNotifications: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    validateEmailFrequency(args.emailDigestFrequency)
    await ctx.db.patch(user._id, {
      emailDigestFrequency: args.emailDigestFrequency,
      emailNotifications: args.emailNotifications,
    })
    return { success: true }
  },
})

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

export const getUserSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) return []

    const subs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect()

    return subs.map((s) => ({ id: s._id, endpoint: s.endpoint, createdAt: s.createdAt }))
  },
})

export const getEmailPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) return null
    return {
      emailDigestFrequency: user.emailDigestFrequency ?? "weekly",
      emailNotifications: user.emailNotifications ?? true,
    }
  },
})
