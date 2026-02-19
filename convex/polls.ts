import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate a short random ID for poll options */
function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * createPoll — called from the client BEFORE the post is created.
 * Returns the new pollId so it can be embedded in the post.
 *
 * Args:
 *  - options: 2-6 non-empty strings
 *  - durationHours: optional number (undefined = no expiry)
 *  - isAnonymous: boolean
 *  - question: optional supplementary question text
 */
export const createPoll = mutation({
  args: {
    options: v.array(v.string()),
    durationHours: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    question: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    // Validate option count
    if (args.options.length < 2 || args.options.length > 6) {
      throw new Error("A poll must have between 2 and 6 options")
    }

    // Validate each option is non-empty and ≤100 chars
    for (const opt of args.options) {
      const trimmed = opt.trim()
      if (!trimmed) throw new Error("Poll options cannot be empty")
      if (trimmed.length > 100) throw new Error("Poll option must not exceed 100 characters")
    }

    const now = Date.now()
    const endsAt = args.durationHours != null
      ? now + args.durationHours * 3_600_000
      : undefined

    const pollId = await ctx.db.insert("polls", {
      authorId: user._id,
      question: args.question?.trim() || undefined,
      options: args.options.map((text) => ({
        id: generateId(),
        text: text.trim(),
        voteCount: 0,
      })),
      totalVotes: 0,
      endsAt,
      isAnonymous: args.isAnonymous ?? false,
      createdAt: now,
    })

    return pollId
  },
})

/**
 * linkPollToPost — called after the post is created so we can store the
 * two-way reference (poll.postId).  This runs as a separate mutation
 * because post creation returns the postId.
 */
export const linkPollToPost = mutation({
  args: {
    pollId: v.id("polls"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const poll = await ctx.db.get(args.pollId)
    if (!poll) throw new Error("Poll not found")

    // Only the author may link
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user || user._id !== poll.authorId) throw new Error("Forbidden")

    // Guard: only link once
    if (poll.postId) throw new Error("Poll already linked to a post")

    await ctx.db.patch(args.pollId, { postId: args.postId })
  },
})

/**
 * vote — cast or change a vote on a poll option.
 * Implements upsert semantics: if the user already voted for the same
 * option nothing happens; if they voted for a different option the old
 * vote is retracted and the new one recorded.
 */
export const vote = mutation({
  args: {
    pollId: v.id("polls"),
    optionId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const poll = await ctx.db.get(args.pollId)
    if (!poll) throw new Error("Poll not found")

    // Check expiry
    if (poll.endsAt != null && Date.now() > poll.endsAt) {
      throw new Error("This poll has ended")
    }

    // Validate the optionId exists in the poll
    const targetOption = poll.options.find((o) => o.id === args.optionId)
    if (!targetOption) throw new Error("Invalid option")

    // Find existing vote by this user
    const existing = await ctx.db
      .query("pollVotes")
      .withIndex("by_user_poll", (q) =>
        q.eq("userId", user._id).eq("pollId", args.pollId)
      )
      .unique()

    if (existing) {
      // No change — same option
      if (existing.optionId === args.optionId) return

      // Retract old vote
      await ctx.db.delete(existing._id)

      // Decrement old option count
      const updatedOptions = poll.options.map((o) =>
        o.id === existing.optionId
          ? { ...o, voteCount: Math.max(0, o.voteCount - 1) }
          : o
      )

      // Increment new option count
      const finalOptions = updatedOptions.map((o) =>
        o.id === args.optionId ? { ...o, voteCount: o.voteCount + 1 } : o
      )

      await ctx.db.patch(args.pollId, { options: finalOptions })
    } else {
      // New vote — increment totalVotes
      const updatedOptions = poll.options.map((o) =>
        o.id === args.optionId ? { ...o, voteCount: o.voteCount + 1 } : o
      )
      await ctx.db.patch(args.pollId, {
        options: updatedOptions,
        totalVotes: poll.totalVotes + 1,
      })
    }

    // Record the vote (or replace — handled by delete+insert above)
    await ctx.db.insert("pollVotes", {
      pollId: args.pollId,
      userId: user._id,
      optionId: args.optionId,
      createdAt: Date.now(),
    })
  },
})

/**
 * deletePoll — only the poll author may delete their poll.
 * Also deletes all associated votes.
 */
export const deletePoll = mutation({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const poll = await ctx.db.get(args.pollId)
    if (!poll) throw new Error("Poll not found")
    if (poll.authorId !== user._id) throw new Error("Forbidden")

    // Delete all votes
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect()
    for (const v of votes) {
      await ctx.db.delete(v._id)
    }

    await ctx.db.delete(args.pollId)
  },
})

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * getPollResults — public (no auth required).
 * Returns poll data including current vote counts.
 */
export const getPollResults = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId)
    if (!poll) return null

    const isExpired = poll.endsAt != null && Date.now() > poll.endsAt

    return {
      ...poll,
      isExpired,
    }
  },
})

/**
 * getUserVote — returns the optionId the current user voted for (or null).
 */
export const getUserVote = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) return null

    const vote = await ctx.db
      .query("pollVotes")
      .withIndex("by_user_poll", (q) =>
        q.eq("userId", user._id).eq("pollId", args.pollId)
      )
      .unique()

    return vote?.optionId ?? null
  },
})
