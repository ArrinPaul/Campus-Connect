import { v } from "convex/values"
import { internalMutation, query, mutation } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { sanitizeText, isValidSafeUrl } from "./sanitize"
import { createLogger } from "./logger"
import { BIO_MAX_LENGTH, UNIVERSITY_MAX_LENGTH } from "./validation_constants"

const log = createLogger("users")

/**
 * Internal mutation to create a user from Clerk webhook
 * Called when user.created event is received
 * Validates: Requirements 1.5, 2.1
 */
export const createUserFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    profilePicture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first()

    if (existingUser) {
      log.info("User already exists, skipping creation", { clerkId: args.clerkId })
      return existingUser._id
    }

    // Create new user with default values
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      profilePicture: args.profilePicture,
      bio: "",
      university: "",
      role: "Student", // Default role
      experienceLevel: "Beginner", // Default experience level
      skills: [],
      socialLinks: {
        github: undefined,
        linkedin: undefined,
        twitter: undefined,
        website: undefined,
      },
      followerCount: 0,
      followingCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    log.info("User created", { userId, clerkId: args.clerkId })
    return userId
  },
})

/**
 * Internal mutation to update a user from Clerk webhook
 * Called when user.updated event is received
 * Validates: Requirements 1.5
 */
export const updateUserFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    profilePicture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first()

    if (!user) {
      log.error("User not found for update", { clerkId: args.clerkId })
      throw new Error("User not found")
    }

    // Update user with new data from Clerk
    await ctx.db.patch(user._id, {
      email: args.email,
      name: args.name,
      profilePicture: args.profilePicture,
      updatedAt: Date.now(),
    })

    log.info("User updated", { userId: user._id, clerkId: args.clerkId })
    return user._id
  },
})

/**
 * Internal mutation to delete a user and all their associated data from Clerk webhook
 * Called when user.deleted event is received
 * Cascade deletes: posts (and their likes/comments), likes, comments, follows
 */
export const deleteUserFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first()

    if (!user) {
      log.warn("User not found for deletion", { clerkId: args.clerkId })
      return
    }

    // Delete all posts by this user (and their associated likes/comments)
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()
    for (const post of posts) {
      // Delete likes on this post
      const postLikes = await ctx.db
        .query("likes")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()
      for (const like of postLikes) {
        await ctx.db.delete(like._id)
      }
      // Delete comments on this post
      const postComments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()
      for (const c of postComments) {
        await ctx.db.delete(c._id)
      }
      await ctx.db.delete(post._id)
    }

    // Delete likes by this user on other posts
    const userLikes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const like of userLikes) {
      // Decrement the liked post's likeCount
      const likedPost = await ctx.db.get(like.postId)
      if (likedPost) {
        await ctx.db.patch(like.postId, {
          likeCount: Math.max(0, likedPost.likeCount - 1),
        })
      }
      await ctx.db.delete(like._id)
    }

    // Delete comments by this user on other posts
    const userComments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()
    for (const comment of userComments) {
      const commentedPost = await ctx.db.get(comment.postId)
      if (commentedPost) {
        await ctx.db.patch(comment.postId, {
          commentCount: Math.max(0, commentedPost.commentCount - 1),
        })
      }
      await ctx.db.delete(comment._id)
    }

    // Delete follows where this user is the follower
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect()
    for (const follow of following) {
      const followedUser = await ctx.db.get(follow.followingId)
      if (followedUser) {
        await ctx.db.patch(follow.followingId, {
          followerCount: Math.max(0, followedUser.followerCount - 1),
        })
      }
      await ctx.db.delete(follow._id)
    }

    // Delete follows where this user is being followed
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect()
    for (const follow of followers) {
      const followerUser = await ctx.db.get(follow.followerId)
      if (followerUser) {
        await ctx.db.patch(follow.followerId, {
          followingCount: Math.max(0, followerUser.followingCount - 1),
        })
      }
      await ctx.db.delete(follow._id)
    }

    // Finally delete the user record
    await ctx.db.delete(user._id)

    log.info("User deleted with all associated data", { userId: user._id, clerkId: args.clerkId })
  },
})

/**
 * Get the current authenticated user
 * Validates: Requirements 2.9, 12.4
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Get the authenticated user identity
    const identity = await ctx.auth.getUserIdentity()
    
    if (!identity) {
      return null
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()

    return user
  },
})

/**
 * Get a user by their ID
 * Validates: Requirements 2.9, 12.4
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Fetch user by ID
    const user = await ctx.db.get(args.userId)
    
    return user
  },
})

/**
 * Search users with filters
 * Validates: Requirements 8.2, 8.3, 8.4, 12.4
 */
export const searchUsers = query({
  args: {
    query: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("Student"),
        v.literal("Research Scholar"),
        v.literal("Faculty")
      )
    ),
    skills: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get users (capped to prevent full table scan)
    let users = await ctx.db.query("users").take(500)

    // Filter by name (case-insensitive substring match)
    if (args.query) {
      const queryLower = args.query.toLowerCase()
      users = users.filter((user) =>
        user.name.toLowerCase().includes(queryLower)
      )
    }

    // Filter by role
    if (args.role) {
      users = users.filter((user) => user.role === args.role)
    }

    // Filter by skills (user must have at least one of the specified skills)
    if (args.skills && args.skills.length > 0) {
      users = users.filter((user) =>
        args.skills!.some((skill) => user.skills.includes(skill))
      )
    }

    return users
  },
})

/**
 * Search users by username for mention autocomplete
 * Returns users whose username or name starts with the query
 * Validates: Requirements 1.5 (Mentions & Tagging)
 */
export const searchUsersByUsername = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Empty query returns no results
    if (!args.query || args.query.trim().length === 0) {
      return []
    }

    const queryLower = args.query.toLowerCase()
    const limit = Math.min(args.limit || 5, 50) // Default to 5 suggestions

    // Get users (capped to prevent full table scan)
    let users = await ctx.db.query("users").take(500)

    // Filter users whose username or name starts with the query (case-insensitive)
    users = users.filter((user) => {
      const usernameLower = user.username?.toLowerCase() || ""
      const nameLower = user.name.toLowerCase()
      
      // Check if username starts with query, or if no username, check if name starts with query
      return usernameLower.startsWith(queryLower) || 
             (!user.username && nameLower.startsWith(queryLower))
    })

    // Sort by exact match first, then alphabetically
    users.sort((a, b) => {
      const aUsername = (a.username || a.name).toLowerCase()
      const bUsername = (b.username || b.name).toLowerCase()
      
      // Exact matches first
      if (aUsername === queryLower && bUsername !== queryLower) return -1
      if (bUsername === queryLower && aUsername !== queryLower) return 1
      
      // Then alphabetically
      return aUsername.localeCompare(bUsername)
    })

    // Limit results
    const limitedUsers = users.slice(0, limit)

    // Return minimal user data for autocomplete
    return limitedUsers.map((user) => ({
      _id: user._id,
      name: user.name,
      username: user.username || user.name, // Fallback to name if no username
      profilePicture: user.profilePicture,
    }))
  },
})

/**
 * Get a user by username (for resolving @mentions)
 * Validates: Requirements 1.5 (Mentions & Tagging)
 */
export const getUserByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    if (!args.username) {
      return null
    }

    // Try to find by username first
    const userByUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first()

    if (userByUsername) {
      return userByUsername
    }

    // Fallback: try to find by name (for users without username)
    const users = await ctx.db.query("users").collect()
    const userByName = users.find(
      (user) => user.name.toLowerCase() === args.username.toLowerCase()
    )

    return userByName || null
  },
})

/**
 * Get a user by either their Convex ID or username
 * Used by profile page to handle both ID-based and @mention-based navigation
 */
export const getUserByIdOrUsername = query({
  args: {
    idOrUsername: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    if (!args.idOrUsername) return null

    // Try ID lookup first (Convex IDs are longer, base32-encoded strings)
    // ctx.db.get accepts any string but returns null if not a valid document ref
    try {
      const userById = await ctx.db.get(args.idOrUsername as Id<"users">)
      if (userById) return userById
    } catch {
      // Not a valid Convex ID format — fall through to username lookup
    }

    // Try exact username lookup
    const userByUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.idOrUsername))
      .first()

    if (userByUsername) return userByUsername

    // Fallback: case-insensitive name match (covers users without set username)
    const allUsers = await ctx.db.query("users").collect()
    const lower = args.idOrUsername.toLowerCase()
    return allUsers.find((u) => u.name.toLowerCase() === lower) || null
  },
})

/**
 * Update user profile
 * Validates: Requirements 2.3, 12.5
 */
export const updateProfile = mutation({
  args: {
    bio: v.optional(v.string()),
    university: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("Student"),
        v.literal("Research Scholar"),
        v.literal("Faculty")
      )
    ),
    experienceLevel: v.optional(
      v.union(
        v.literal("Beginner"),
        v.literal("Intermediate"),
        v.literal("Advanced"),
        v.literal("Expert")
      )
    ),
    socialLinks: v.optional(
      v.object({
        github: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        twitter: v.optional(v.string()),
        website: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user identity
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Find the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    // Validate bio length
    if (args.bio !== undefined && args.bio.length > BIO_MAX_LENGTH) {
      throw new Error(`Bio must not exceed ${BIO_MAX_LENGTH} characters`)
    }

    // Validate university length
    if (args.university !== undefined && args.university.length > UNIVERSITY_MAX_LENGTH) {
      throw new Error(`University name must not exceed ${UNIVERSITY_MAX_LENGTH} characters`)
    }

    // Sanitize text fields to prevent XSS attacks
    const sanitizedBio = args.bio !== undefined ? sanitizeText(args.bio) : undefined
    const sanitizedUniversity = args.university !== undefined ? sanitizeText(args.university) : undefined
    // Validate social link URLs
    if (args.socialLinks) {
      const links = args.socialLinks
      for (const [key, url] of Object.entries(links)) {
        if (url && !isValidSafeUrl(url)) {
          throw new Error(`Invalid ${key} URL — only https:// links are allowed`)
        }
      }
    }

    // Social links are validated as URLs above — no need to sanitizeText (which would break URLs)
    const sanitizedSocialLinks = args.socialLinks !== undefined ? {
      github: args.socialLinks.github || undefined,
      linkedin: args.socialLinks.linkedin || undefined,
      twitter: args.socialLinks.twitter || undefined,
      website: args.socialLinks.website || undefined,
    } : undefined

    // Update user profile
    const updates: Partial<{
      bio: string
      university: string
      role: typeof args.role
      experienceLevel: typeof args.experienceLevel
      socialLinks: typeof sanitizedSocialLinks
      updatedAt: number
    }> = {
      updatedAt: Date.now(),
    }

    if (sanitizedBio !== undefined) updates.bio = sanitizedBio
    if (sanitizedUniversity !== undefined) updates.university = sanitizedUniversity
    if (args.role !== undefined) updates.role = args.role
    if (args.experienceLevel !== undefined)
      updates.experienceLevel = args.experienceLevel
    if (sanitizedSocialLinks !== undefined) updates.socialLinks = sanitizedSocialLinks

    await ctx.db.patch(user._id, updates)

    return user._id
  },
})

/**
 * Add a skill to user profile
 * Validates: Requirements 3.1, 3.2, 12.5
 */
export const addSkill = mutation({
  args: {
    skill: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user identity
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Find the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    // Validate skill name
    if (!args.skill || args.skill.trim().length === 0) {
      throw new Error("Skill name cannot be empty")
    }

    if (args.skill.length > 50) {
      throw new Error("Skill name must not exceed 50 characters")
    }

    // Sanitize skill name to prevent XSS attacks
    const sanitizedSkill = sanitizeText(args.skill)

    // Check for duplicate
    if (user.skills.includes(sanitizedSkill)) {
      throw new Error("Skill already exists")
    }

    // Add skill to user's skills array
    const updatedSkills = [...user.skills, sanitizedSkill]

    await ctx.db.patch(user._id, {
      skills: updatedSkills,
      updatedAt: Date.now(),
    })

    return updatedSkills
  },
})

/**
 * Remove a skill from user profile
 * Validates: Requirements 3.2, 12.5
 */
export const removeSkill = mutation({
  args: {
    skill: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user identity
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Find the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    // Remove skill from user's skills array
    const updatedSkills = user.skills.filter((s) => s !== args.skill)

    await ctx.db.patch(user._id, {
      skills: updatedSkills,
      updatedAt: Date.now(),
    })

    return updatedSkills
  },
})
/**
 * Generate an upload URL for profile picture
 * Validates: Requirements 2.4, 12.4
 */
export const updateNotificationPreferences = mutation({
  args: {
    reactions: v.boolean(),
    comments: v.boolean(),
    mentions: v.boolean(),
    follows: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    await ctx.db.patch(user._id, {
      notificationPreferences: {
        reactions: args.reactions,
        comments: args.comments,
        mentions: args.mentions,
        follows: args.follows,
      },
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

export const generateUploadUrl = mutation({
  args: {
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Profile pictures should be images only
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(args.fileType)) {
      throw new Error(
        `Invalid file type: ${args.fileType}. Allowed types: ${allowedTypes.join(", ")}`
      )
    }

    if (args.fileSize > maxSize) {
      const fileSizeMB = (args.fileSize / 1024 / 1024).toFixed(2)
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0)
      throw new Error(
        `File too large: ${fileSizeMB}MB. Maximum allowed: ${maxSizeMB}MB`
      )
    }

    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Update user profile picture
 * Validates: Requirements 2.4, 12.5
 */
export const updateProfilePicture = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user identity
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Find the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    // Get the URL for the uploaded file
    const url = await ctx.storage.getUrl(args.storageId)

    if (!url) {
      throw new Error("Failed to get file URL")
    }

    // Update user profile picture
    await ctx.db.patch(user._id, {
      profilePicture: url,
      updatedAt: Date.now(),
    })

    return url
  },
})

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GDPR COMPLIANCE - Data Export & Account Deletion
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Export all user data for GDPR compliance
 * Returns: User profile, posts, comments, messages, bookmarks, etc.
 */
export const exportUserData = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    // Gather all user data
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()

    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect()

    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect()

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
      .collect()

    // Get conversation participation
    const conversationParticipations = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    // Get messages from user's conversations
    const messages: any[] = []
    for (const participation of conversationParticipations) {
      const convMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", participation.conversationId)
        )
        .filter((q) => q.eq(q.field("senderId"), user._id))
        .collect()
      messages.push(...convMessages)
    }

    return {
      exportedAt: Date.now(),
      user: {
        ...user,
        // Remove sensitive fields
        clerkId: undefined,
      },
      statistics: {
        posts: posts.length,
        comments: comments.length,
        reactions: reactions.length,
        bookmarks: bookmarks.length,
        following: follows.length,
        followers: followers.length,
        messages: messages.length,
        notifications: notifications.length,
      },
      posts: posts.map((p) => ({
        content: p.content,
        createdAt: p.createdAt,
        mediaUrls: p.mediaUrls,
        mediaType: p.mediaType,
      })),
      comments: comments.map((c) => ({
        content: c.content,
        createdAt: c.createdAt,
        postId: c.postId,
      })),
      bookmarks: bookmarks.map((b) => ({
        savedAt: b.createdAt,
        postId: b.postId,
      })),
      following: follows.map((f) => ({
        userId: f.followingId,
        followedAt: f.createdAt,
      })),
    }
  },
})

/**
 * Delete user account and all associated data (GDPR Right to Erasure)
 * WARNING: This is irreversible!
 */
export const deleteAccount = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    // ═══════ Delete User-Created Content ═══════

    // 1. Delete all posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()

    for (const post of posts) {
      await ctx.db.delete(post._id)
    }

    // 2. Delete all comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()

    for (const comment of comments) {
      await ctx.db.delete(comment._id)
    }

    // 3. Delete all reactions (likes, loves, etc.)
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    for (const reaction of reactions) {
      await ctx.db.delete(reaction._id)
    }

    // 4. Delete all bookmarks
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id)
    }

    // 5. Delete all follows (both as follower and following)
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect()

    for (const follow of follows) {
      await ctx.db.delete(follow._id)
    }

    const followedBy = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect()

    for (const follow of followedBy) {
      await ctx.db.delete(follow._id)
    }

    // 6. Delete all notifications (sent to user)
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
      .collect()

    for (const notification of notifications) {
      await ctx.db.delete(notification._id)
    }

    // 7. Delete all reposts
    const reposts = await ctx.db
      .query("reposts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    for (const repost of reposts) {
      await ctx.db.delete(repost._id)
    }

    // 8. Delete messages and conversation participations
    const conversationParticipations = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    for (const participation of conversationParticipations) {
      // Delete messages sent by this user
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", participation.conversationId)
        )
        .filter((q) => q.eq(q.field("senderId"), user._id))
        .collect()

      for (const message of messages) {
        await ctx.db.delete(message._id)
      }

      // Remove from conversation participants
      await ctx.db.delete(participation._id)
    }

    // 9. Delete community memberships
    const communityMemberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    for (const membership of communityMemberships) {
      await ctx.db.delete(membership._id)
    }

    // 10. Delete event RSVPs (table does not exist yet - skip for now)
    // const eventRSVPs = await ctx.db
    //   .query("eventAttendees")
    //   .withIndex("by_user", (q) => q.eq("userId", user._id))
    //   .collect()
    // for (const rsvp of eventRSVPs) {
    //   await ctx.db.delete(rsvp._id)
    // }

    // 11. Delete stories
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()

    for (const story of stories) {
      await ctx.db.delete(story._id)
    }

    // 12. Delete polls created by user
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()

    for (const poll of polls) {
      await ctx.db.delete(poll._id)
    }

    // 13. Delete poll votes
    const pollVotes = await ctx.db
      .query("pollVotes")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect()

    for (const vote of pollVotes) {
      await ctx.db.delete(vote._id)
    }

    // ═══════ Finally, Delete User Record ═══════
    await ctx.db.delete(user._id)

    // Note: Clerk user must be deleted separately via Dashboard or API
    // This would typically be done via a webhook or background job
    // For now, admin must manually delete from Clerk Dashboard

    return {
      success: true,
      message: "Account and all associated data deleted successfully",
      note: "Please also delete your account from the authentication provider (Clerk) if needed",
    }
  },
})
