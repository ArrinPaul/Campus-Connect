/**
 * Voice & Video Calls System
 * Feature: Phase 2.4 - Voice & Video Calls
 *
 * Handles call initiation, acceptance, rejection, ending, and call history.
 * Note: Actual WebRTC/media handling is done client-side; this provides
 * signaling and call state management via Convex.
 */

import { v } from "convex/values"
import { mutation, query, internalMutation } from "./_generated/server"
import { Id } from "./_generated/dataModel"

/**
 * Helper: get current authenticated user from identity
 */
async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null
  return ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique()
}

/**
 * Initiate a call in a conversation.
 * Creates a call record with "ringing" status and adds all participants.
 */
export const initiateCall = mutation({
  args: {
    conversationId: v.id("conversations"),
    type: v.union(v.literal("audio"), v.literal("video")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    // Get conversation to find participants
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) throw new Error("Conversation not found")

    // Get conversation participants
    const participantRecords = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q: any) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect()

    const participantIds = participantRecords.map((p: any) => p.userId)

    // Verify caller is in conversation
    if (!participantIds.some((id: Id<"users">) => id === currentUser._id)) {
      throw new Error("You are not a participant in this conversation")
    }

    // Check if there's already an active/ringing call in this conversation
    const existingCalls = await ctx.db
      .query("calls")
      .withIndex("by_conversation", (q: any) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect()

    const activeCall = existingCalls.find(
      (c: any) => c.status === "ringing" || c.status === "active"
    )

    if (activeCall) {
      throw new Error("There is already an active call in this conversation")
    }

    const now = Date.now()

    // Build participants array
    const participants = participantIds.map((userId: Id<"users">) => ({
      userId,
      joinedAt: userId === currentUser._id ? now : undefined,
      leftAt: undefined,
      status: userId === currentUser._id
        ? ("connected" as const)
        : ("ringing" as const),
    }))

    const callId = await ctx.db.insert("calls", {
      conversationId: args.conversationId,
      callerId: currentUser._id,
      type: args.type,
      status: "ringing",
      participants,
      startedAt: undefined,
      endedAt: undefined,
      duration: undefined,
      createdAt: now,
    })

    return { callId, success: true }
  },
})

/**
 * Accept an incoming call.
 * Updates the participant's status to "connected" and sets the call to "active"
 * once any non-caller participant joins.
 */
export const acceptCall = mutation({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const call = await ctx.db.get(args.callId)
    if (!call) throw new Error("Call not found")

    if (call.status !== "ringing" && call.status !== "active") {
      throw new Error("Call is no longer available")
    }

    // Find current user in participants
    const participantIndex = call.participants.findIndex(
      (p: any) => p.userId === currentUser._id
    )

    if (participantIndex === -1) {
      throw new Error("You are not a participant in this call")
    }

    const now = Date.now()
    const updatedParticipants = [...call.participants]
    updatedParticipants[participantIndex] = {
      ...updatedParticipants[participantIndex],
      joinedAt: now,
      status: "connected" as const,
    }

    // If this is the first non-caller to join, set call to active
    const updates: any = {
      participants: updatedParticipants,
    }

    if (call.status === "ringing") {
      updates.status = "active"
      updates.startedAt = now
    }

    await ctx.db.patch(args.callId, updates)

    return { success: true }
  },
})

/**
 * Reject an incoming call.
 * Sets the participant's status to "declined".
 * If all non-caller participants declined, end the call as "rejected".
 */
export const rejectCall = mutation({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const call = await ctx.db.get(args.callId)
    if (!call) throw new Error("Call not found")

    if (call.status !== "ringing" && call.status !== "active") {
      throw new Error("Call is no longer available")
    }

    // Find current user in participants
    const participantIndex = call.participants.findIndex(
      (p: any) => p.userId === currentUser._id
    )

    if (participantIndex === -1) {
      throw new Error("You are not a participant in this call")
    }

    const now = Date.now()
    const updatedParticipants = [...call.participants]
    updatedParticipants[participantIndex] = {
      ...updatedParticipants[participantIndex],
      leftAt: now,
      status: "declined" as const,
    }

    // Check if all non-caller participants have declined
    const allDeclined = updatedParticipants
      .filter((p: any) => p.userId !== call.callerId)
      .every((p: any) => p.status === "declined")

    const updates: any = {
      participants: updatedParticipants,
    }

    if (allDeclined) {
      updates.status = "rejected"
      updates.endedAt = now
    }

    await ctx.db.patch(args.callId, updates)

    return { success: true }
  },
})

/**
 * End an active or ringing call.
 * Only the caller or an active participant can end the call.
 * If a participant leaves an active call with remaining participants
 * they just leave; the call continues.
 */
export const endCall = mutation({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const call = await ctx.db.get(args.callId)
    if (!call) throw new Error("Call not found")

    if (call.status !== "ringing" && call.status !== "active") {
      throw new Error("Call has already ended")
    }

    const now = Date.now()
    const updatedParticipants = [...call.participants]

    // Find current user
    const participantIndex = updatedParticipants.findIndex(
      (p: any) => p.userId === currentUser._id
    )

    if (participantIndex === -1) {
      throw new Error("You are not a participant in this call")
    }

    // Mark current user as left
    updatedParticipants[participantIndex] = {
      ...updatedParticipants[participantIndex],
      leftAt: now,
      status: "left" as const,
    }

    // Count remaining connected participants (not left/declined)
    const remainingConnected = updatedParticipants.filter(
      (p: any) => p.status === "connected"
    )

    let callStatus: string = call.status
    let endedAt: number | undefined = undefined
    let duration: number | undefined = undefined

    // If current user is caller and call is ringing, mark as missed
    if (currentUser._id === call.callerId && call.status === "ringing") {
      callStatus = "missed"
      endedAt = now
      // Mark all ringing participants as missed
      updatedParticipants.forEach((p: any, i: number) => {
        if (p.status === "ringing") {
          updatedParticipants[i] = {
            ...p,
            status: "missed" as const,
            leftAt: now,
          }
        }
      })
    }
    // If no remaining connected participants, end the call
    else if (remainingConnected.length === 0) {
      callStatus = "ended"
      endedAt = now
      if (call.startedAt) {
        duration = Math.round((now - call.startedAt) / 1000)
      }
      // Mark any still-ringing participants as missed
      updatedParticipants.forEach((p: any, i: number) => {
        if (p.status === "ringing") {
          updatedParticipants[i] = {
            ...p,
            status: "missed" as const,
            leftAt: now,
          }
        }
      })
    }
    // If only 1 connected participant remains in a 1-on-1, end the call
    else if (remainingConnected.length === 1 && updatedParticipants.length === 2) {
      callStatus = "ended"
      endedAt = now
      if (call.startedAt) {
        duration = Math.round((now - call.startedAt) / 1000)
      }
    }

    await ctx.db.patch(args.callId, {
      participants: updatedParticipants,
      status: callStatus as any,
      endedAt,
      duration,
    })

    return { success: true, callStatus }
  },
})

/**
 * Get call history for a conversation.
 * Returns calls sorted by most recent first.
 */
export const getCallHistory = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return []

    const limit = Math.min(args.limit || 20, 100)

    // Verify user is a participant in this conversation
    const membership = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q: any) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()
    if (!membership) return []

    const calls = await ctx.db
      .query("calls")
      .withIndex("by_conversation", (q: any) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(limit)

    // Enrich with caller info
    const enrichedCalls = await Promise.all(
      calls.map(async (call: any) => {
        const caller: any = await ctx.db.get(call.callerId)
        return {
          ...call,
          callerName: caller?.name || "Unknown",
          callerProfilePicture: caller?.profilePicture,
          isMine: call.callerId === currentUser._id,
        }
      })
    )

    return enrichedCalls
  },
})

/**
 * Get the active or ringing call for a conversation.
 * Used to show incoming call notifications or rejoin an active call.
 */
export const getActiveCall = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return null

    // Verify user is a participant in this conversation
    const membership = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q: any) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()
    if (!membership) return null

    const calls = await ctx.db
      .query("calls")
      .withIndex("by_conversation", (q: any) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(5)

    const activeCall = calls.find(
      (c: any) => c.status === "ringing" || c.status === "active"
    )

    if (!activeCall) return null

    const caller: any = await ctx.db.get(activeCall.callerId)

    // Get participant info
    const participantsWithInfo = await Promise.all(
      activeCall.participants.map(async (p: any) => {
        const user: any = await ctx.db.get(p.userId)
        return {
          ...p,
          name: user?.name || "Unknown",
          profilePicture: user?.profilePicture,
        }
      })
    )

    return {
      ...activeCall,
      callerName: caller?.name || "Unknown",
      callerProfilePicture: caller?.profilePicture,
      participants: participantsWithInfo,
      isIncoming: activeCall.callerId !== currentUser._id,
      myStatus: activeCall.participants.find(
        (p: any) => p.userId === currentUser._id
      )?.status,
    }
  },
})

/**
 * Get any incoming ringing calls for the current user across all conversations.
 * Used for the global incoming call notification.
 */
export const getIncomingCalls = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return []

    // Scope to user's conversations instead of scanning ALL ringing calls
    const participations = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q: any) => q.eq("userId", currentUser._id))
      .collect()

    const incomingCalls: any[] = []
    for (const p of participations) {
      // Get recent calls for each conversation (only ringing ones)
      const calls = await ctx.db
        .query("calls")
        .withIndex("by_conversation", (q: any) =>
          q.eq("conversationId", p.conversationId)
        )
        .order("desc")
        .take(5)

      for (const call of calls) {
        if (call.status !== "ringing") continue
        if (call.callerId === currentUser._id) continue
        const myParticipant = call.participants.find(
          (pt: any) => pt.userId === currentUser._id && pt.status === "ringing"
        )
        if (myParticipant) {
          incomingCalls.push(call)
        }
      }
    }

    // Enrich with caller info
    const enrichedCalls = await Promise.all(
      incomingCalls.map(async (call: any) => {
        const caller: any = await ctx.db.get(call.callerId)
        const conversation: any = await ctx.db.get(call.conversationId)
        return {
          ...call,
          callerName: caller?.name || "Unknown",
          callerProfilePicture: caller?.profilePicture,
          conversationName: conversation?.name || caller?.name || "Unknown",
        }
      })
    )

    return enrichedCalls
  },
})

/**
 * Internal: expire stale ringing calls that have been ringing for too long.
 * Called by cron every 5 minutes. Marks calls as "missed" if ringing > 60 seconds.
 */
export const expireStaleRingingCalls = internalMutation({
  args: {},
  handler: async (ctx) => {
    const RING_TIMEOUT_MS = 60_000 // 60 seconds
    const cutoff = Date.now() - RING_TIMEOUT_MS

    const ringingCalls = await ctx.db
      .query("calls")
      .withIndex("by_status", (q: any) => q.eq("status", "ringing"))
      .collect()

    const staleCalls = ringingCalls.filter((c: any) => c.createdAt < cutoff)

    for (const call of staleCalls) {
      const now = Date.now()
      const updatedParticipants = call.participants.map((p: any) => {
        if (p.status === "ringing") {
          return { ...p, status: "missed" as const, leftAt: now }
        }
        return p
      })
      await ctx.db.patch(call._id, {
        status: "missed",
        endedAt: now,
        participants: updatedParticipants,
      })
    }
  },
})
