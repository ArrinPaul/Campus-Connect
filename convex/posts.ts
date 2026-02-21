import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"
import { sanitizeText, sanitizeMarkdown, isValidSafeUrl } from "./sanitize"
import { linkHashtagsToPost } from "./hashtags"
import { extractMentions } from "./mentionUtils"
import { POST_MAX_LENGTH } from "./validation_constants"

/**
 * Get feed posts with pagination
 * Returns posts in reverse chronological order (newest first)
 * Filters by followed users if user is following anyone
 * Returns all posts if user is not following anyone
 * Includes author data in responses
 * Validates: Requirements 6.1, 6.2, 6.3, 12.4
 */
export const getFeedPosts = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    const limit = Math.min(args.limit ?? 20, 100) // Default to 20, max 100

    // Get current user's following list
    const followingList = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect()

    // Extract the IDs of users being followed
    const followingIds = followingList.map((follow) => follow.followingId)

    // Get all posts ordered by createdAt descending (newest first)
    let postsQuery = ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")

    // Apply cursor-based pagination if cursor is provided
    if (args.cursor) {
      try {
        const cursorPost = await ctx.db.get(args.cursor as Id<"posts">)
        if (cursorPost) {
          postsQuery = postsQuery.filter((q) =>
            q.lt(q.field("createdAt"), cursorPost.createdAt)
          )
        }
      } catch {
        // Invalid cursor — return results from the beginning
      }
    }

    // Filter by followed users if following anyone
    if (followingIds.length > 0) {
      postsQuery = postsQuery.filter((q) =>
        q.or(
          ...followingIds.map((id) => q.eq(q.field("authorId"), id))
        )
      )
    }

    // Fetch posts with limit + 1 to determine if there are more
    const posts = await postsQuery.take(limit + 1)

    // Determine if there are more posts
    const hasMore = posts.length > limit
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts

    // Fetch author data for each post
    const postsWithAuthors = await Promise.all(
      postsToReturn.map(async (post) => {
        const author = await ctx.db.get(post.authorId)
        return {
          ...post,
          author: author || null,
        }
      })
    )

    // Return posts with pagination info
    return {
      posts: postsWithAuthors,
      nextCursor: hasMore ? postsToReturn[postsToReturn.length - 1]._id : null,
      hasMore,
    }
  },
})

/**
 * Get a single post by ID
 * Includes author data in response
 * Validates: Requirements 6.6, 12.4
 */
export const getPostById = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Fetch the post
    const post = await ctx.db.get(args.postId)

    if (!post) {
      return null
    }

    // Fetch author data
    const author = await ctx.db.get(post.authorId)

    return {
      ...post,
      author: author || null,
    }
  },
})

/**
 * Create a new post
 * Validates content (non-empty, max 5000 chars)
 * Initializes likeCount and commentCount to 0
 * Validates: Requirements 4.1, 4.2, 4.3, 4.5, 12.4, 12.5
 */
export const createPost = mutation({
  args: {
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    mediaType: v.optional(
      v.union(
        v.literal("image"),
        v.literal("video"),
        v.literal("file"),
        v.literal("link")
      )
    ),
    mediaFileNames: v.optional(v.array(v.string())),
    linkPreview: v.optional(
      v.object({
        url: v.string(),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        image: v.optional(v.string()),
        favicon: v.optional(v.string()),
      })
    ),
    // Phase 3.3 — attach a pre-created poll
    pollId: v.optional(v.id("polls")),
    // Phase 5.1 — post to a community
    communityId: v.optional(v.id("communities")),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    // Validate content - non-empty
    if (!args.content || args.content.trim().length === 0) {
      throw new Error("Post content cannot be empty")
    }

    // Validate content - max length
    if (args.content.length > POST_MAX_LENGTH) {
      throw new Error(`Post content must not exceed ${POST_MAX_LENGTH} characters`)
    }

    // Sanitize content — preserves markdown syntax while blocking XSS
    const sanitizedContent = sanitizeMarkdown(args.content)

    // Validate media URLs if provided
    if (args.mediaUrls) {
      for (const url of args.mediaUrls) {
        if (!isValidSafeUrl(url)) {
          throw new Error("Invalid media URL")
        }
      }
    }

    // Validate link preview URLs if provided
    if (args.linkPreview) {
      if (!isValidSafeUrl(args.linkPreview.url)) {
        throw new Error("Invalid link preview URL")
      }
      if (args.linkPreview.image && !isValidSafeUrl(args.linkPreview.image)) {
        throw new Error("Invalid link preview image URL")
      }
      if (args.linkPreview.favicon && !isValidSafeUrl(args.linkPreview.favicon)) {
        throw new Error("Invalid link preview favicon URL")
      }
    }

    // Create post with initialized counts
    const now = Date.now()
    const postId = await ctx.db.insert("posts", {
      authorId: user._id,
      content: sanitizedContent,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      createdAt: now,
      updatedAt: now,
      ...(args.mediaUrls ? { mediaUrls: args.mediaUrls } : {}),
      ...(args.mediaType ? { mediaType: args.mediaType } : {}),
      ...(args.mediaFileNames ? { mediaFileNames: args.mediaFileNames } : {}),
      ...(args.linkPreview ? { linkPreview: args.linkPreview } : {}),
      ...(args.pollId ? { pollId: args.pollId } : {}),
      ...(args.communityId ? { communityId: args.communityId } : {}),
    })

    // Link hashtags to post
    await linkHashtagsToPost(ctx, postId, sanitizedContent)

    // Extract mentions and notify mentioned users
    const mentions = extractMentions(sanitizedContent)
    for (const username of mentions) {
      // Find the mentioned user
      const mentionedUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .first()

      // If username index miss, skip silently — no full table scan fallback
      const resolvedUser = mentionedUser || null

      // Schedule notification if user found and not self-mention
      if (resolvedUser && resolvedUser._id !== user._id) {
        await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
          recipientId: resolvedUser._id,
          actorId: user._id,
          type: "mention" as const,
          referenceId: postId,
          message: `mentioned you in a post`,
        })
      }
    }

    // Return the created post
    const post = await ctx.db.get(postId)
    return post
  },
})

/**
 * Delete a post
 * Validates user is the post author (authorization)
 * Validates: Requirements 4.6, 4.7, 12.4, 12.5
 */
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    // Get the post
    const post = await ctx.db.get(args.postId)

    if (!post) {
      throw new Error("Post not found")
    }

    // Verify user is the post author (authorization)
    if (post.authorId !== user._id) {
      throw new Error("Forbidden: You can only delete your own posts")
    }

    // Cascade delete: remove all likes associated with this post
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()
    for (const like of likes) {
      await ctx.db.delete(like._id)
    }

    // Cascade delete: remove all comments associated with this post
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()
    for (const comment of comments) {
      await ctx.db.delete(comment._id)
    }

    // Delete the post
    await ctx.db.delete(args.postId)

    return { success: true }
  },
})

/**
 * Check if current user has liked a post
 * Validates: Requirements 5.4, 12.4
 */
export const hasUserLikedPost = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return false
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      return false
    }

    // Check if like exists
    const like = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .unique()

    return like !== null
  },
})

/**
 * Like a post
 * Validates user hasn't already liked the post
 * Increments post likeCount
 * Validates: Requirements 5.1, 5.2, 5.4, 12.4
 */
export const likePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    // Check if post exists
    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new Error("Post not found")
    }

    // Check if user has already liked the post
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .unique()

    if (existingLike) {
      throw new Error("You have already liked this post")
    }

    // Create like record
    await ctx.db.insert("likes", {
      userId: user._id,
      postId: args.postId,
      createdAt: Date.now(),
    })

    // Increment post likeCount
    await ctx.db.patch(args.postId, {
      likeCount: post.likeCount + 1,
    })

    return { success: true }
  },
})

/**
 * Unlike a post
 * Validates user has previously liked the post
 * Decrements post likeCount
 * Validates: Requirements 5.3, 12.4
 */
export const unlikePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    // Check if post exists
    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new Error("Post not found")
    }

    // Check if user has liked the post
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .unique()

    if (!existingLike) {
      throw new Error("You have not liked this post")
    }

    // Delete like record
    await ctx.db.delete(existingLike._id)

    // Decrement post likeCount
    await ctx.db.patch(args.postId, {
      likeCount: Math.max(0, post.likeCount - 1), // Ensure count doesn't go negative
    })

    return { success: true }
  },
})

/**
 * Get unified feed with both posts and reposts
 * Returns posts and reposts in chronological order
 * Reposts include both the reposter info and original post/author
 * Validates: Requirements 1.6 (Share/Repost Feed Display)
 */
export const getUnifiedFeed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    const limit = Math.min(args.limit ?? 20, 100)

    // Get current user's following list
    const followingList = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect()

    const followingIds = followingList.map((follow) => follow.followingId)

    // Get posts from followed users
    let postsQuery = ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")

    // Filter by followed users if following anyone
    if (followingIds.length > 0) {
      postsQuery = postsQuery.filter((q) =>
        q.or(
          ...followingIds.map((id) => q.eq(q.field("authorId"), id))
        )
      )
    }

    const posts = await postsQuery.take(limit * 2) // Fetch more to merge with reposts

    // Get reposts from followed users
    let repostsQuery = ctx.db
      .query("reposts")
      .withIndex("by_createdAt")
      .order("desc")

    if (followingIds.length > 0) {
      repostsQuery = repostsQuery.filter((q) =>
        q.or(
          ...followingIds.map((id) => q.eq(q.field("userId"), id))
        )
      )
    }

    const reposts = await repostsQuery.take(limit * 2)

    // Transform posts into feed items
    const postItems = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId)
        return {
          type: "post" as const,
          _id: post._id,
          createdAt: post.createdAt,
          post: {
            ...post,
            author: author || null,
          },
        }
      })
    )

    // Transform reposts into feed items
    const repostItems = await Promise.all(
      reposts.map(async (repost) => {
        const reposter = await ctx.db.get(repost.userId)
        const originalPost = await ctx.db.get(repost.originalPostId)
        
        if (!originalPost) return null

        const originalAuthor = await ctx.db.get(originalPost.authorId)

        return {
          type: "repost" as const,
          _id: repost._id,
          createdAt: repost.createdAt,
          reposter: reposter || null,
          quoteContent: repost.quoteContent,
          post: {
            ...originalPost,
            author: originalAuthor || null,
          },
        }
      })
    )

    // Filter out null items and combine all items
    const allItems = [...postItems, ...repostItems.filter((item) => item !== null)]
      .sort((a, b) => b.createdAt - a.createdAt) // Sort by newest first
      .slice(0, limit + 1) // Take limit + 1 for pagination

    // Determine if there are more items
    const hasMore = allItems.length > limit
    const itemsToReturn = hasMore ? allItems.slice(0, limit) : allItems

    return {
      items: itemsToReturn,
      nextCursor: hasMore ? String(itemsToReturn[itemsToReturn.length - 1].createdAt) : null,
      hasMore,
    }
  },
})
