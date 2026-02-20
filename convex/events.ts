import { v } from "convex/values"
import { query, mutation, internalMutation } from "./_generated/server"
import { api, internal } from "./_generated/api"

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
// Mutations
// ──────────────────────────────────────────────

/**
 * Create a new event
 * Phase 5.3 — Events & Scheduling
 */
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    eventType: v.union(v.literal("in_person"), v.literal("virtual"), v.literal("hybrid")),
    startDate: v.number(),
    endDate: v.number(),
    communityId: v.optional(v.id("communities")),
    location: v.optional(v.string()),
    virtualLink: v.optional(v.string()),
    isRecurring: v.optional(v.boolean()),
    maxAttendees: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    if (!args.title || args.title.trim().length === 0) {
      throw new Error("Event title cannot be empty")
    }
    if (args.title.length > 200) {
      throw new Error("Event title must not exceed 200 characters")
    }
    if (args.description.length > 5000) {
      throw new Error("Event description must not exceed 5000 characters")
    }
    if (args.startDate >= args.endDate) {
      throw new Error("End date must be after start date")
    }
    if (args.startDate < Date.now() - 60_000) {
      throw new Error("Start date cannot be in the past")
    }
    if (args.maxAttendees !== undefined && args.maxAttendees < 1) {
      throw new Error("Max attendees must be at least 1")
    }

    const eventId = await ctx.db.insert("events", {
      title: args.title.trim(),
      description: args.description.trim(),
      organizerId: user._id,
      communityId: args.communityId,
      eventType: args.eventType,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      virtualLink: args.virtualLink,
      isRecurring: args.isRecurring ?? false,
      maxAttendees: args.maxAttendees,
      attendeeCount: 0,
      createdAt: Date.now(),
    })

    // Auto-RSVP organizer as "going"
    await ctx.db.insert("eventRSVPs", {
      eventId,
      userId: user._id,
      status: "going",
      createdAt: Date.now(),
    })
    await ctx.db.patch(eventId, { attendeeCount: 1 })

    // Notify community members if posted to a community
    if (args.communityId) {
      const members = await ctx.db
        .query("communityMembers")
        .withIndex("by_community", (q: any) => q.eq("communityId", args.communityId))
        .collect()
      for (const member of members) {
        if (member.userId !== user._id && member.role !== "pending") {
          await ctx.scheduler.runAfter(0, api.notifications.createNotification, {
            recipientId: member.userId,
            actorId: user._id,
            type: "comment" as const,
            referenceId: eventId,
            message: `${user.name} created a new event: "${args.title.trim()}"`,
          })
        }
      }
    }

    return eventId
  },
})

/**
 * Update an event — organizer only
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    eventType: v.optional(v.union(v.literal("in_person"), v.literal("virtual"), v.literal("hybrid"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    virtualLink: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")
    if (event.organizerId !== user._id) throw new Error("Forbidden: only the organizer can edit this event")

    const { eventId, ...updates } = args
    const filteredUpdates: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) filteredUpdates[k] = v
    }

    if (filteredUpdates.startDate && filteredUpdates.endDate) {
      if ((filteredUpdates.startDate as number) >= (filteredUpdates.endDate as number)) {
        throw new Error("End date must be after start date")
      }
    } else if (filteredUpdates.startDate) {
      if ((filteredUpdates.startDate as number) >= event.endDate) {
        throw new Error("End date must be after start date")
      }
    } else if (filteredUpdates.endDate) {
      if (event.startDate >= (filteredUpdates.endDate as number)) {
        throw new Error("End date must be after start date")
      }
    }

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(args.eventId, filteredUpdates)
    }
    return { success: true }
  },
})

/**
 * Delete an event — organizer only
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")
    if (event.organizerId !== user._id) throw new Error("Forbidden: only the organizer can delete this event")

    // Delete all RSVPs
    const rsvps = await ctx.db
      .query("eventRSVPs")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .collect()
    for (const rsvp of rsvps) {
      await ctx.db.delete(rsvp._id)
    }

    await ctx.db.delete(args.eventId)
    return { success: true }
  },
})

/**
 * RSVP to an event (going / maybe / not_going) — upsert behavior
 */
export const rsvpEvent = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(v.literal("going"), v.literal("maybe"), v.literal("not_going")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")

    const existing = await ctx.db
      .query("eventRSVPs")
      .withIndex("by_event_user", (q: any) => q.eq("eventId", args.eventId).eq("userId", user._id))
      .unique()

    const wasGoing = existing?.status === "going"
    const isNowGoing = args.status === "going"

    // Check capacity
    if (isNowGoing && !wasGoing && event.maxAttendees !== undefined) {
      if (event.attendeeCount >= event.maxAttendees) {
        throw new Error("Event is at full capacity")
      }
    }

    if (existing) {
      await ctx.db.patch(existing._id, { status: args.status })
    } else {
      await ctx.db.insert("eventRSVPs", {
        eventId: args.eventId,
        userId: user._id,
        status: args.status,
        createdAt: Date.now(),
      })
    }

    // Adjust attendeeCount
    let delta = 0
    if (isNowGoing && !wasGoing) delta = 1
    if (!isNowGoing && wasGoing) delta = -1
    if (delta !== 0) {
      await ctx.db.patch(args.eventId, {
        attendeeCount: Math.max(0, event.attendeeCount + delta),
      })
    }

    return { success: true }
  },
})

/**
 * Internal mutation: send event reminder notifications
 * Checks for events starting in ~24h or ~1h
 */
export const sendEventReminders = internalMutation({
  args: {},
  handler: async (ctx, _args) => {
    const now = Date.now()
    // Notify for events starting in 24h window (23.5h – 24.5h from now)
    // and events starting in 1h window (0.5h – 1.5h from now)
    const windows = [
      { start: now + 23.5 * 3_600_000, end: now + 24.5 * 3_600_000 },
      { start: now + 0.5 * 3_600_000, end: now + 1.5 * 3_600_000 },
    ]
    for (const window of windows) {
    // Find events starting between window.start and window.end
    const events = await ctx.db
      .query("events")
      .withIndex("by_start_date", (q: any) =>
        q.gte("startDate", window.start).lt("startDate", window.end)
      )
      .collect()

    for (const event of events) {
      const rsvps = await ctx.db
        .query("eventRSVPs")
        .withIndex("by_event", (q: any) => q.eq("eventId", event._id))
        .collect()
      const goingRsvps = rsvps.filter((r: any) => r.status === "going" || r.status === "maybe")
      for (const rsvp of goingRsvps) {
        if (rsvp.userId !== event.organizerId) {
          const hoursUntil = Math.round((event.startDate - Date.now()) / 3_600_000)
          await ctx.scheduler.runAfter(0, api.notifications.createNotification, {
            recipientId: rsvp.userId,
            actorId: event.organizerId,
            type: "comment" as const,
            referenceId: event._id,
            message: `Reminder: "${event.title}" starts in ${hoursUntil}h`,
          })
        }
      }
    }
    } // end for windows
  },
})

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

/**
 * Get a single event by ID (includes organizer data and viewer's RSVP status)
 */
export const getEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const event = await ctx.db.get(args.eventId)
    if (!event) return null

    const organizer = await ctx.db.get(event.organizerId)
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique()

    let viewerRsvp = null
    if (currentUser) {
      const rsvp = await ctx.db
        .query("eventRSVPs")
        .withIndex("by_event_user", (q: any) =>
          q.eq("eventId", args.eventId).eq("userId", currentUser._id)
        )
        .unique()
      viewerRsvp = rsvp?.status ?? null
    }

    const community = event.communityId ? await ctx.db.get(event.communityId) : null

    return { ...event, organizer, community, viewerRsvp }
  },
})

/**
 * Get upcoming events (startDate > now), paginated
 */
export const getUpcomingEvents = query({
  args: {
    limit: v.optional(v.number()),
    communityId: v.optional(v.id("communities")),
    eventType: v.optional(v.union(v.literal("in_person"), v.literal("virtual"), v.literal("hybrid"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const limit = args.limit ?? 20
    const now = Date.now()

    let events = await ctx.db
      .query("events")
      .withIndex("by_start_date", (q: any) => q.gte("startDate", now))
      .collect()

    // Apply optional filters
    if (args.communityId) {
      events = events.filter((e: any) => e.communityId === args.communityId)
    }
    if (args.eventType) {
      events = events.filter((e: any) => e.eventType === args.eventType)
    }

    events.sort((a: any, b: any) => a.startDate - b.startDate)
    const paged = events.slice(0, limit)

    return await Promise.all(
      paged.map(async (event: any) => {
        const organizer = await ctx.db.get(event.organizerId)
        return { ...event, organizer }
      })
    )
  },
})

/**
 * Get past events (startDate < now)
 */
export const getPastEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const limit = args.limit ?? 20
    const now = Date.now()

    const events = await ctx.db
      .query("events")
      .withIndex("by_start_date", (q: any) => q.lt("startDate", now))
      .collect()

    events.sort((a: any, b: any) => b.startDate - a.startDate)
    const paged = events.slice(0, limit)

    return await Promise.all(
      paged.map(async (event: any) => {
        const organizer = await ctx.db.get(event.organizerId)
        return { ...event, organizer }
      })
    )
  },
})

/**
 * Get events the current user has RSVPed to
 */
export const getUserEvents = query({
  args: {
    status: v.optional(v.union(v.literal("going"), v.literal("maybe"), v.literal("not_going"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    let rsvps = await ctx.db
      .query("eventRSVPs")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect()

    if (args.status) {
      rsvps = rsvps.filter((r: any) => r.status === args.status)
    }

    const events = await Promise.all(
      rsvps.map(async (rsvp: any) => {
        const event = await ctx.db.get(rsvp.eventId)
        if (!event) return null
        const organizer = await ctx.db.get(event.organizerId)
        return { ...event, organizer, rsvpStatus: rsvp.status }
      })
    )

    return events
      .filter(Boolean)
      .sort((a: any, b: any) => a.startDate - b.startDate)
  },
})

/**
 * Get events in a community
 */
export const getCommunityEvents = query({
  args: {
    communityId: v.id("communities"),
    upcoming: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const now = Date.now()
    let events = await ctx.db
      .query("events")
      .withIndex("by_community", (q: any) => q.eq("communityId", args.communityId))
      .collect()

    if (args.upcoming) {
      events = events.filter((e: any) => e.startDate >= now)
    }

    events.sort((a: any, b: any) => a.startDate - b.startDate)

    return await Promise.all(
      events.map(async (event: any) => {
        const organizer = await ctx.db.get(event.organizerId)
        return { ...event, organizer }
      })
    )
  },
})

/**
 * Get attendees (users who RSVPed "going")
 */
export const getEventAttendees = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const rsvps = await ctx.db
      .query("eventRSVPs")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .collect()

    const goingRsvps = rsvps.filter((r: any) => r.status === "going")

    return await Promise.all(
      goingRsvps.map(async (rsvp: any) => {
        const user = await ctx.db.get(rsvp.userId)
        return user
      })
    )
  },
})
