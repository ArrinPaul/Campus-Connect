import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Add a bookmark
export const addBookmark = mutation({
  args: {
    postId: v.id("posts"),
    collectionName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }
    // Validate collection name length
    if (args.collectionName && args.collectionName.length > 100) {
      throw new Error("Collection name too long (max 100 characters)")
    }
    // Verify post exists
    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new Error("Post not found")
    }

    // Check if already bookmarked
    const existingBookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .unique()

    if (existingBookmark) {
      // Update collection if different
      if (args.collectionName && existingBookmark.collectionName !== args.collectionName) {
        await ctx.db.patch(existingBookmark._id, {
          collectionName: args.collectionName,
        })
        return { success: true, action: "updated" }
      }
      return { success: true, action: "already-exists" }
    }

    // Create bookmark
    await ctx.db.insert("bookmarks", {
      userId: user._id,
      postId: args.postId,
      collectionName: args.collectionName || "Saved",
      createdAt: Date.now(),
    })

    return { success: true, action: "created" }
  },
})

// Remove a bookmark
export const removeBookmark = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .unique()

    if (bookmark) {
      await ctx.db.delete(bookmark._id)
      return { success: true }
    }

    return { success: false, message: "Bookmark not found" }
  },
})

// Get user's bookmarks (paginated)
export const getBookmarks = query({
  args: {
    collectionName: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return { bookmarks: [], cursor: null }
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      return { bookmarks: [], cursor: null }
    }

    const limit = Math.min(args.limit || 20, 100)

    // Query bookmarks
    let bookmarksQuery = ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")

    // Filter by collection if specified
    const bookmarks = await bookmarksQuery.collect()
    const filteredBookmarks = args.collectionName
      ? bookmarks.filter((b) => b.collectionName === args.collectionName)
      : bookmarks

    // Apply pagination
    const startIndex = args.cursor ? parseInt(args.cursor) : 0
    const paginatedBookmarks = filteredBookmarks.slice(startIndex, startIndex + limit)

    // Fetch post details for each bookmark
    const bookmarksWithPosts = await Promise.all(
      paginatedBookmarks.map(async (bookmark) => {
        const post = await ctx.db.get(bookmark.postId)
        if (!post) return null

        const author = await ctx.db.get(post.authorId)
        if (!author) return null

        return {
          _id: bookmark._id,
          postId: bookmark.postId,
          collectionName: bookmark.collectionName,
          createdAt: bookmark.createdAt,
          post: {
            _id: post._id,
            authorId: post.authorId,
            content: post.content,
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            shareCount: post.shareCount,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            reactionCounts: post.reactionCounts,
          },
          author: {
            _id: author._id,
            name: author.name,
            profilePicture: author.profilePicture,
            role: author.role,
          },
        }
      })
    )

    // Filter out null values (deleted posts)
    const validBookmarks = bookmarksWithPosts.filter((b) => b !== null)

    // Determine next cursor
    const hasMore = startIndex + limit < filteredBookmarks.length
    const nextCursor = hasMore ? String(startIndex + limit) : null

    return {
      bookmarks: validBookmarks,
      cursor: nextCursor,
    }
  },
})

// Get user's collection names
export const getCollections = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      return []
    }

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    // Extract unique collection names with counts
    const collectionMap = new Map<string, number>()
    bookmarks.forEach((bookmark) => {
      const collection = bookmark.collectionName || "Saved"
      collectionMap.set(collection, (collectionMap.get(collection) || 0) + 1)
    })

    return Array.from(collectionMap.entries()).map(([name, count]) => ({
      name,
      count,
    }))
  },
})

// Check if a post is bookmarked by current user
export const isBookmarked = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return false
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      return false
    }

    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .unique()

    return bookmark !== null
  },
})

// Get bookmark details (including collection name)
export const getBookmarkDetails = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      return null
    }

    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .unique()

    if (!bookmark) {
      return null
    }

    return {
      _id: bookmark._id,
      collectionName: bookmark.collectionName || "Saved",
      createdAt: bookmark.createdAt,
    }
  },
})
