import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

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
// Mutations — Questions
// ──────────────────────────────────────────────

/**
 * Ask a question
 */
export const askQuestion = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    course: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    if (!args.title.trim()) throw new Error("Title cannot be empty")
    if (args.title.length > 300) throw new Error("Title must not exceed 300 characters")
    if (!args.content.trim()) throw new Error("Content cannot be empty")
    if (args.content.length > 10000) throw new Error("Content must not exceed 10000 characters")
    if (args.tags.length > 10) throw new Error("Maximum 10 tags allowed")

    const tags = args.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)

    return ctx.db.insert("questions", {
      title: args.title.trim(),
      content: args.content.trim(),
      askedBy: user._id,
      course: args.course?.trim() || undefined,
      tags,
      viewCount: 0,
      upvotes: 0,
      downvotes: 0,
      answerCount: 0,
      acceptedAnswerId: undefined,
      createdAt: Date.now(),
    })
  },
})

/**
 * Delete a question (asker only)
 */
export const deleteQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const question = await ctx.db.get(args.questionId)
    if (!question) throw new Error("Question not found")
    if (question.askedBy !== user._id) throw new Error("Only the asker can delete")

    // Delete all answers
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_question", (q: any) => q.eq("questionId", args.questionId))
      .collect()
    for (const a of answers) {
      // Delete votes on this answer
      const answerVotes = await ctx.db
        .query("questionVotes")
        .withIndex("by_target", (q: any) => q.eq("targetId", a._id))
        .collect()
      for (const v of answerVotes) await ctx.db.delete(v._id)
      await ctx.db.delete(a._id)
    }

    // Delete votes on question
    const qVotes = await ctx.db
      .query("questionVotes")
      .withIndex("by_target", (q: any) => q.eq("targetId", args.questionId))
      .collect()
    for (const v of qVotes) await ctx.db.delete(v._id)

    await ctx.db.delete(args.questionId)
  },
})

// ──────────────────────────────────────────────
// Mutations — Answers
// ──────────────────────────────────────────────

/**
 * Answer a question
 */
export const answerQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const question = await ctx.db.get(args.questionId)
    if (!question) throw new Error("Question not found")

    if (!args.content.trim()) throw new Error("Answer cannot be empty")
    if (args.content.length > 10000) throw new Error("Answer must not exceed 10000 characters")

    const answerId = await ctx.db.insert("answers", {
      questionId: args.questionId,
      content: args.content.trim(),
      answeredBy: user._id,
      upvotes: 0,
      downvotes: 0,
      isAccepted: false,
      createdAt: Date.now(),
    })

    await ctx.db.patch(args.questionId, {
      answerCount: question.answerCount + 1,
    })

    return answerId
  },
})

/**
 * Accept an answer (question asker only)
 */
export const acceptAnswer = mutation({
  args: { answerId: v.id("answers") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const answer = await ctx.db.get(args.answerId)
    if (!answer) throw new Error("Answer not found")

    const question = await ctx.db.get(answer.questionId)
    if (!question) throw new Error("Question not found")
    if (question.askedBy !== user._id) throw new Error("Only the question asker can accept answers")

    // Un-accept previous if any
    if (question.acceptedAnswerId) {
      await ctx.db.patch(question.acceptedAnswerId, { isAccepted: false })
    }

    await ctx.db.patch(args.answerId, { isAccepted: true })
    await ctx.db.patch(answer.questionId, { acceptedAnswerId: args.answerId })
  },
})

// ──────────────────────────────────────────────
// Mutations — Voting
// ──────────────────────────────────────────────

/**
 * Vote on a question or answer
 */
export const vote = mutation({
  args: {
    targetId: v.string(),
    targetType: v.union(v.literal("question"), v.literal("answer")),
    voteType: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Check if user already voted on this target
    const existing = await ctx.db
      .query("questionVotes")
      .withIndex("by_user_target", (q: any) =>
        q.eq("userId", user._id).eq("targetId", args.targetId)
      )
      .unique()

    // Get the target document
    const target = await ctx.db.get(args.targetId as any)
    if (!target) throw new Error("Target not found")

    if (existing) {
      if (existing.voteType === args.voteType) {
        // Toggle off — remove vote
        await ctx.db.delete(existing._id)
        if (args.voteType === "up") {
          await ctx.db.patch(args.targetId as any, { upvotes: Math.max(0, target.upvotes - 1) })
        } else {
          await ctx.db.patch(args.targetId as any, { downvotes: Math.max(0, target.downvotes - 1) })
        }
        return "removed"
      } else {
        // Change vote direction
        await ctx.db.patch(existing._id, { voteType: args.voteType })
        if (args.voteType === "up") {
          await ctx.db.patch(args.targetId as any, {
            upvotes: target.upvotes + 1,
            downvotes: Math.max(0, target.downvotes - 1),
          })
        } else {
          await ctx.db.patch(args.targetId as any, {
            downvotes: target.downvotes + 1,
            upvotes: Math.max(0, target.upvotes - 1),
          })
        }
        return "changed"
      }
    }

    // New vote
    await ctx.db.insert("questionVotes", {
      targetId: args.targetId,
      targetType: args.targetType,
      userId: user._id,
      voteType: args.voteType,
      createdAt: Date.now(),
    })

    if (args.voteType === "up") {
      await ctx.db.patch(args.targetId as any, { upvotes: target.upvotes + 1 })
    } else {
      await ctx.db.patch(args.targetId as any, { downvotes: target.downvotes + 1 })
    }

    return "voted"
  },
})

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

/**
 * Get questions list with sorting
 */
export const getQuestions = query({
  args: {
    sort: v.optional(v.union(v.literal("newest"), v.literal("votes"), v.literal("unanswered"))),
    tag: v.optional(v.string()),
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20
    let questions = await ctx.db.query("questions").order("desc").collect()

    // Tag filter
    if (args.tag) {
      const tag = args.tag.toLowerCase().trim()
      questions = questions.filter((q) => q.tags.includes(tag))
    }

    // Text search
    const searchQ = args.query?.toLowerCase().trim()
    if (searchQ) {
      questions = questions.filter(
        (q) =>
          q.title.toLowerCase().includes(searchQ) ||
          q.content.toLowerCase().includes(searchQ) ||
          q.tags.some((t: string) => t.includes(searchQ))
      )
    }

    // Sort
    const sort = args.sort ?? "newest"
    if (sort === "votes") {
      questions.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
    } else if (sort === "unanswered") {
      questions = questions.filter((q) => q.answerCount === 0)
    }
    // "newest" is already sorted desc by default

    const results = questions.slice(0, limit)

    return Promise.all(
      results.map(async (q) => {
        const asker = await ctx.db.get(q.askedBy)
        return {
          ...q,
          score: q.upvotes - q.downvotes,
          asker: asker
            ? { _id: asker._id, name: asker.name, profilePicture: asker.profilePicture }
            : null,
        }
      })
    )
  },
})

/**
 * Get a single question with all answers
 */
export const getQuestion = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId)
    if (!question) return null

    const asker = await ctx.db.get(question.askedBy)

    const answers = await ctx.db
      .query("answers")
      .withIndex("by_question", (q: any) => q.eq("questionId", args.questionId))
      .collect()

    // Sort: accepted first, then by votes
    answers.sort((a, b) => {
      if (a.isAccepted && !b.isAccepted) return -1
      if (!a.isAccepted && b.isAccepted) return 1
      return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
    })

    const enrichedAnswers = await Promise.all(
      answers.map(async (a) => {
        const answerer = await ctx.db.get(a.answeredBy)
        return {
          ...a,
          score: a.upvotes - a.downvotes,
          answerer: answerer
            ? { _id: answerer._id, name: answerer.name, profilePicture: answerer.profilePicture }
            : null,
        }
      })
    )

    // Get viewer vote info
    let viewerVotes: Record<string, string> = {}
    const identity = await ctx.auth.getUserIdentity()
    if (identity) {
      const viewer = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
        .unique()
      if (viewer) {
        // Get all votes by this user on question + answers
        const allIds = [args.questionId as string, ...answers.map((a) => a._id as string)]
        for (const id of allIds) {
          const vote = await ctx.db
            .query("questionVotes")
            .withIndex("by_user_target", (q: any) =>
              q.eq("userId", viewer._id).eq("targetId", id)
            )
            .unique()
          if (vote) viewerVotes[id] = vote.voteType
        }
      }
    }

    return {
      ...question,
      score: question.upvotes - question.downvotes,
      asker: asker
        ? { _id: asker._id, name: asker.name, profilePicture: asker.profilePicture }
        : null,
      answers: enrichedAnswers,
      viewerVotes,
    }
  },
})

/**
 * Increment view count
 */
export const incrementViewCount = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId)
    if (!question) return
    await ctx.db.patch(args.questionId, { viewCount: question.viewCount + 1 })
  },
})
