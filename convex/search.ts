import { v } from "convex/values"
import { query } from "./_generated/server"
import { Id, Doc } from "./_generated/dataModel"

// ────────────────────────────────────────────
// Search Upgrades (Phase 4.4)
// Full-text search across users, posts, and hashtags
// with fuzzy matching and typo tolerance.
// ────────────────────────────────────────────

// ── Fuzzy-matching helpers (exported for testing) ──

/**
 * Compute Levenshtein edit distance between two strings.
 * Used for typo tolerance.
 */
export function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  )
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  return dp[m][n]
}

/**
 * Check if a query string fuzzy-matches a target string.
 * Returns true if the target contains the query as a substring (case-insensitive)
 * OR if any word in the target is within `maxDistance` edits of the query.
 */
export function fuzzyMatch(
  query: string,
  target: string,
  maxDistance: number = 2
): boolean {
  const q = query.toLowerCase().trim()
  const t = target.toLowerCase()

  // Exact substring match
  if (t.includes(q)) return true

  // Word-level fuzzy match
  const queryWords = q.split(/\s+/).filter(Boolean)
  const targetWords = t.split(/\s+/).filter(Boolean)

  return queryWords.every((qw) =>
    targetWords.some((tw) => {
      // Allow edit distance proportional to word length
      const allowedDist = Math.min(maxDistance, Math.floor(qw.length / 3))
      return editDistance(qw, tw) <= allowedDist || tw.includes(qw) || qw.includes(tw)
    })
  )
}

/**
 * Score a search result based on relevance to the query.
 * Higher is better. Considers exact match, prefix match, substring, and edit distance.
 * Returns value in [0, 1].
 */
export function searchRelevanceScore(query: string, text: string): number {
  const q = query.toLowerCase().trim()
  const t = text.toLowerCase().trim()

  // Exact match
  if (t === q) return 1.0

  // Starts with query
  if (t.startsWith(q)) return 0.9

  // Contains query as substring
  if (t.includes(q)) return 0.7

  // Word-level match
  const queryWords = q.split(/\s+/).filter(Boolean)
  const targetWords = t.split(/\s+/).filter(Boolean)
  let matchedWords = 0

  for (const qw of queryWords) {
    for (const tw of targetWords) {
      if (tw === qw) {
        matchedWords += 1
        break
      } else if (tw.startsWith(qw) || qw.startsWith(tw)) {
        matchedWords += 0.7
        break
      } else if (editDistance(qw, tw) <= Math.floor(qw.length / 3)) {
        matchedWords += 0.4
        break
      }
    }
  }

  return queryWords.length > 0
    ? Math.min(0.6, (matchedWords / queryWords.length) * 0.6)
    : 0
}

// ────────────────────────────────────────────
// Helper: check if a post is visible to the current user
// Posts in secret communities are only visible to members.
// ────────────────────────────────────────────
async function isPostVisibleToUser(
  ctx: any,
  post: { communityId?: string | null },
  userId: string
): Promise<boolean> {
  if (!post.communityId) return true // Public feed post
  const community = await ctx.db.get(post.communityId)
  if (!community) return true // Community deleted — allow read
  if (community.type !== "secret") return true // Public or private — visible
  // Secret: only members (non-pending) can see
  const membership = await ctx.db
    .query("communityMembers")
    .withIndex("by_community_user", (q: any) =>
      q.eq("communityId", post.communityId).eq("userId", userId)
    )
    .unique()
  return !!membership && membership.role !== "pending"
}

// Safe user projection — omits all PII and internal fields
function safeUserProjection(user: any) {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    profilePicture: user.profilePicture,
    bio: user.bio,
    role: user.role,
    university: user.university,
    skills: user.skills,
    followerCount: user.followerCount,
    followingCount: user.followingCount,
    isVerified: user.isVerified,
    reputation: user.reputation,
    level: user.level,
    createdAt: user.createdAt,
  }
}

// ────────────────────────────────────────────
// Universal Search — searches across all types
// Returns top results from Users, Posts, and Hashtags
// ────────────────────────────────────────────
export const universalSearch = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()), // per category
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const q = args.query.trim().slice(0, 200) // Cap query length to prevent abuse
    if (!q) return { users: [], posts: [], hashtags: [] }

    const limitPerCategory = Math.min(args.limit ?? 3, 20)

    // --- Users ---
    const allUsers = await ctx.db.query("users").take(200)
    const scoredUsers = allUsers
      .map((user) => {
        const nameScore = searchRelevanceScore(q, user.name)
        const usernameScore = user.username
          ? searchRelevanceScore(q, user.username)
          : 0
        const bioScore = user.bio ? searchRelevanceScore(q, user.bio) * 0.5 : 0
        const skillScore = user.skills.some(
          (s) => s.toLowerCase().includes(q.toLowerCase())
        )
          ? 0.6
          : 0
        const universityScore = user.university
          ? searchRelevanceScore(q, user.university) * 0.4
          : 0

        const bestScore = Math.max(
          nameScore,
          usernameScore,
          bioScore,
          skillScore,
          universityScore
        )
        return { user, score: bestScore }
      })
      .filter((r) => r.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limitPerCategory)

    // --- Posts ---
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    const currentUserId = currentUser ? (currentUser._id as string) : ""

    const recentPosts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .take(200)

    const scoredPosts = await Promise.all(
      recentPosts.map(async (post) => {
        const contentScore = searchRelevanceScore(q, post.content)
        if (contentScore <= 0.1) return null

        // SEC-3: Filter out posts from secret communities the user isn't in
        const visible = await isPostVisibleToUser(ctx, post, currentUserId)
        if (!visible) return null

        const author = await ctx.db.get(post.authorId)
        return {
          post: { ...post, author: author || null },
          score: contentScore,
        }
      })
    )

    const validPosts = scoredPosts
      .filter((p) => p !== null)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, limitPerCategory)

    // --- Hashtags ---
    const allHashtags = await ctx.db
      .query("hashtags")
      .withIndex("by_post_count")
      .order("desc")
      .take(200)

    const scoredHashtags = allHashtags
      .map((hashtag) => {
        const tagScore = searchRelevanceScore(q.replace(/^#/, ""), hashtag.tag)
        return { hashtag, score: tagScore }
      })
      .filter((r) => r.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limitPerCategory)

    return {
      users: scoredUsers.map((r) => ({
        _id: r.user._id,
        name: r.user.name,
        username: r.user.username,
        profilePicture: r.user.profilePicture,
        role: r.user.role,
        university: r.user.university,
        skills: r.user.skills,
      })),
      posts: validPosts.map((r) => ({
        _id: r!.post._id,
        content:
          r!.post.content.length > 120
            ? r!.post.content.slice(0, 120).trimEnd() + "…"
            : r!.post.content,
        author: r!.post.author
          ? {
              _id: r!.post.author._id,
              name: r!.post.author.name,
              profilePicture: r!.post.author.profilePicture,
            }
          : null,
        createdAt: r!.post.createdAt,
        commentCount: r!.post.commentCount,
        likeCount: r!.post.likeCount,
      })),
      hashtags: scoredHashtags.map((r) => ({
        _id: r.hashtag._id,
        tag: r.hashtag.tag,
        postCount: r.hashtag.postCount,
      })),
    }
  },
})

// ────────────────────────────────────────────
// Search Posts — full-text search with filters
// ────────────────────────────────────────────
export const searchPosts = query({
  args: {
    query: v.string(),
    dateFrom: v.optional(v.number()), // timestamp
    dateTo: v.optional(v.number()),
    mediaType: v.optional(
      v.union(
        v.literal("image"),
        v.literal("video"),
        v.literal("file"),
        v.literal("link"),
        v.literal("any")
      )
    ),
    minEngagement: v.optional(v.number()), // min total reactions+comments
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const q = args.query.trim().slice(0, 200)
    if (!q) return { items: [], nextCursor: null, hasMore: false }

    const limit = Math.min(args.limit ?? 20, 50)

    // Fetch candidate posts
    let postsQuery = ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")

    // Date filters
    if (args.dateFrom) {
      postsQuery = postsQuery.filter((q) =>
        q.gte(q.field("createdAt"), args.dateFrom!)
      )
    }
    if (args.dateTo) {
      postsQuery = postsQuery.filter((q) =>
        q.lte(q.field("createdAt"), args.dateTo!)
      )
    }

    const candidates = await postsQuery.take(200)

    // Filter by text match + media + engagement
    const scored = await Promise.all(
      candidates.map(async (post) => {
        const contentScore = searchRelevanceScore(q, post.content)
        if (contentScore <= 0.05) return null

        // Media filter
        if (args.mediaType && args.mediaType !== "any") {
          if (post.mediaType !== args.mediaType) return null
        }

        // Engagement filter
        if (args.minEngagement) {
          const totalEng =
            (post.reactionCounts
              ? post.reactionCounts.like +
                post.reactionCounts.love +
                post.reactionCounts.laugh +
                post.reactionCounts.wow +
                post.reactionCounts.sad +
                post.reactionCounts.scholarly
              : post.likeCount) + post.commentCount
          if (totalEng < args.minEngagement) return null
        }

        // SEC-3: Filter out posts from secret communities the user isn't in
        const currentUser = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
          .unique()
        const currentUserId = currentUser ? (currentUser._id as string) : ""
        const visible = await isPostVisibleToUser(ctx, post, currentUserId)
        if (!visible) return null

        const author = await ctx.db.get(post.authorId)
        return {
          _id: post._id,
          score: contentScore,
          post: { ...post, author: author || null },
        }
      })
    )

    const valid = scored.filter((p) => p !== null) as NonNullable<
      (typeof scored)[number]
    >[]
    valid.sort((a, b) => b.score - a.score)

    // Paginate
    const startIndex = args.cursor ? Math.max(0, parseInt(args.cursor, 10) || 0) : 0
    const page = valid.slice(startIndex, startIndex + limit + 1)
    const hasMore = page.length > limit
    const items = hasMore ? page.slice(0, limit) : page

    return {
      items: items.map(({ score, ...rest }) => rest),
      nextCursor: hasMore ? String(startIndex + limit) : null,
      hasMore,
    }
  },
})

// ────────────────────────────────────────────
// Search Users — enhanced with typo correction
// ────────────────────────────────────────────
export const searchUsersEnhanced = query({
  args: {
    query: v.string(),
    role: v.optional(
      v.union(
        v.literal("Student"),
        v.literal("Research Scholar"),
        v.literal("Faculty")
      )
    ),
    university: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const q = args.query.trim().slice(0, 200)
    const limit = Math.min(args.limit ?? 20, 50)

    let users = await ctx.db.query("users").take(500)

    // Text search (fuzzy)
    if (q) {
      users = users.filter((user) => {
        return (
          fuzzyMatch(q, user.name) ||
          (user.username && fuzzyMatch(q, user.username)) ||
          (user.bio && fuzzyMatch(q, user.bio)) ||
          user.skills.some((s) => fuzzyMatch(q, s))
        )
      })
    }

    // Role filter
    if (args.role) {
      users = users.filter((u) => u.role === args.role)
    }

    // University filter
    if (args.university) {
      const uniLower = args.university.toLowerCase()
      users = users.filter(
        (u) => u.university && u.university.toLowerCase().includes(uniLower)
      )
    }

    // Skill filter
    if (args.skills && args.skills.length > 0) {
      const skillsLower = args.skills.map((s) => s.toLowerCase())
      users = users.filter((u) =>
        skillsLower.some((sk) =>
          u.skills.some((us) => us.toLowerCase() === sk)
        )
      )
    }

    // Score and sort
    const scored = q
      ? users
          .map((user) => ({
            user,
            score: Math.max(
              searchRelevanceScore(q, user.name),
              user.username ? searchRelevanceScore(q, user.username) : 0
            ),
          }))
          .sort((a, b) => b.score - a.score)
      : users.map((user) => ({ user, score: 1 }))

    // Paginate
    const startIndex = args.cursor ? Math.max(0, parseInt(args.cursor, 10) || 0) : 0
    const page = scored.slice(startIndex, startIndex + limit + 1)
    const hasMore = page.length > limit
    const items = hasMore ? page.slice(0, limit) : page

    return {
      items: items.map((r) => safeUserProjection(r.user)),
      nextCursor: hasMore ? String(startIndex + limit) : null,
      hasMore,
      totalCount: scored.length,
    }
  },
})

// ────────────────────────────────────────────
// Search Hashtags
// ────────────────────────────────────────────
export const searchHashtags = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const q = args.query.trim().toLowerCase().replace(/^#/, "")
    if (!q) return { items: [] }

    const limit = Math.min(args.limit ?? 20, 100)

    const allHashtags = await ctx.db
      .query("hashtags")
      .withIndex("by_post_count")
      .order("desc")
      .take(500)

    const scored = allHashtags
      .map((hashtag) => ({
        hashtag,
        score: searchRelevanceScore(q, hashtag.tag),
      }))
      .filter((r) => r.score > 0.05)
      .sort((a, b) => {
        // Primary: relevance, Secondary: popularity
        if (Math.abs(a.score - b.score) < 0.1) {
          return b.hashtag.postCount - a.hashtag.postCount
        }
        return b.score - a.score
      })
      .slice(0, limit)

    return {
      items: scored.map((r) => r.hashtag),
    }
  },
})
