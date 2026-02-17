import { v } from "convex/values"
import { internalMutation, query, mutation } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { sanitizeText } from "./sanitize"

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
      console.log(`User with clerkId ${args.clerkId} already exists`)
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

    console.log(`Created user ${userId} for clerkId ${args.clerkId}`)
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
      console.error(`User with clerkId ${args.clerkId} not found`)
      throw new Error("User not found")
    }

    // Update user with new data from Clerk
    await ctx.db.patch(user._id, {
      email: args.email,
      name: args.name,
      profilePicture: args.profilePicture,
      updatedAt: Date.now(),
    })

    console.log(`Updated user ${user._id} for clerkId ${args.clerkId}`)
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
      console.error(`User with clerkId ${args.clerkId} not found for deletion`)
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

    console.log(`Deleted user ${user._id} and all associated data for clerkId ${args.clerkId}`)
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

    // Get all users
    let users = await ctx.db.query("users").collect()

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
    if (args.bio !== undefined && args.bio.length > 500) {
      throw new Error("Bio must not exceed 500 characters")
    }

    // Validate university length
    if (args.university !== undefined && args.university.length > 200) {
      throw new Error("University name must not exceed 200 characters")
    }

    // Sanitize text fields to prevent XSS attacks
    const sanitizedBio = args.bio !== undefined ? sanitizeText(args.bio) : undefined
    const sanitizedUniversity = args.university !== undefined ? sanitizeText(args.university) : undefined
    const sanitizedSocialLinks = args.socialLinks !== undefined ? {
      github: args.socialLinks.github ? sanitizeText(args.socialLinks.github) : undefined,
      linkedin: args.socialLinks.linkedin ? sanitizeText(args.socialLinks.linkedin) : undefined,
      twitter: args.socialLinks.twitter ? sanitizeText(args.socialLinks.twitter) : undefined,
      website: args.socialLinks.website ? sanitizeText(args.socialLinks.website) : undefined,
    } : undefined

    // Update user profile
    const updates: any = {
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
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
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
