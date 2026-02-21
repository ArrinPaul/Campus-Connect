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

    // ── Additional cascade deletes (reactions, reposts, bookmarks, etc.) ──

    // Delete reactions by this user
    const userReactions = await ctx.db
      .query("reactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const reaction of userReactions) {
      await ctx.db.delete(reaction._id)
    }

    // Delete reposts by this user
    const userReposts = await ctx.db
      .query("reposts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const repost of userReposts) {
      // Decrement shareCount on original post
      const originalPost = await ctx.db.get(repost.originalPostId)
      if (originalPost) {
        await ctx.db.patch(repost.originalPostId, {
          shareCount: Math.max(0, originalPost.shareCount - 1),
        })
      }
      await ctx.db.delete(repost._id)
    }

    // Delete bookmarks by this user
    const userBookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const bookmark of userBookmarks) {
      await ctx.db.delete(bookmark._id)
    }

    // Delete notifications for this user (both received and sent)
    const receivedNotifs = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
      .collect()
    for (const notif of receivedNotifs) {
      await ctx.db.delete(notif._id)
    }
    // Notifications where user is the actor
    const sentNotifs = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("actorId"), user._id))
      .collect()
    for (const notif of sentNotifs) {
      await ctx.db.delete(notif._id)
    }

    // Delete stories and storyViews by this user
    const userStories = await ctx.db
      .query("stories")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()
    for (const story of userStories) {
      const views = await ctx.db
        .query("storyViews")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .collect()
      for (const view of views) {
        await ctx.db.delete(view._id)
      }
      await ctx.db.delete(story._id)
    }
    // Delete storyViews where user is the viewer
    const viewedStories = await ctx.db
      .query("storyViews")
      .withIndex("by_viewer", (q) => q.eq("viewerId", user._id))
      .collect()
    for (const view of viewedStories) {
      await ctx.db.delete(view._id)
    }

    // Delete conversation participants and clean up conversations
    const participantRecords = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const p of participantRecords) {
      await ctx.db.delete(p._id)
    }

    // Delete messages sent by this user (soft delete — mark as deleted)
    const userMessages = await ctx.db
      .query("messages")
      .withIndex("by_sender", (q) => q.eq("senderId", user._id))
      .collect()
    for (const msg of userMessages) {
      await ctx.db.patch(msg._id, { isDeleted: true, content: "[Deleted User]" })
    }

    // Delete typing indicators
    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect()
    for (const indicator of typingIndicators) {
      await ctx.db.delete(indicator._id)
    }

    // Delete calls where user is caller
    const userCalls = await ctx.db
      .query("calls")
      .withIndex("by_caller", (q) => q.eq("callerId", user._id))
      .collect()
    for (const call of userCalls) {
      await ctx.db.delete(call._id)
    }

    // Delete poll votes by this user
    const userPollVotes = await ctx.db
      .query("pollVotes")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect()
    for (const vote of userPollVotes) {
      // Decrement the poll option vote count
      const poll = await ctx.db.get(vote.pollId)
      if (poll) {
        const updatedOptions = poll.options.map((opt: any) =>
          opt.id === vote.optionId
            ? { ...opt, voteCount: Math.max(0, opt.voteCount - 1) }
            : opt
        )
        await ctx.db.patch(vote.pollId, {
          options: updatedOptions,
          totalVotes: Math.max(0, poll.totalVotes - 1),
        })
      }
      await ctx.db.delete(vote._id)
    }

    // Delete achievements
    const userAchievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const achievement of userAchievements) {
      await ctx.db.delete(achievement._id)
    }

    // Delete suggestions (both given and received)
    const userSuggestions = await ctx.db
      .query("suggestions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const suggestion of userSuggestions) {
      await ctx.db.delete(suggestion._id)
    }

    // Delete skill endorsements (given and received)
    const endorsementsReceived = await ctx.db
      .query("skillEndorsements")
      .withIndex("by_user_skill", (q) => q.eq("userId", user._id))
      .collect()
    for (const endorsement of endorsementsReceived) {
      await ctx.db.delete(endorsement._id)
    }
    const endorsementsGiven = await ctx.db
      .query("skillEndorsements")
      .withIndex("by_endorser", (q) => q.eq("endorserId", user._id))
      .collect()
    for (const endorsement of endorsementsGiven) {
      await ctx.db.delete(endorsement._id)
    }

    // Delete community memberships
    const communityMemberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const membership of communityMemberships) {
      // Decrement community member count
      const community = await ctx.db.get(membership.communityId)
      if (community) {
        await ctx.db.patch(membership.communityId, {
          memberCount: Math.max(0, community.memberCount - 1),
        })
      }
      await ctx.db.delete(membership._id)
    }

    // Delete event RSVPs
    const userRsvps = await ctx.db
      .query("eventRSVPs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const rsvp of userRsvps) {
      if (rsvp.status === "going") {
        const event = await ctx.db.get(rsvp.eventId)
        if (event) {
          await ctx.db.patch(rsvp.eventId, {
            attendeeCount: Math.max(0, event.attendeeCount - 1),
          })
        }
      }
      await ctx.db.delete(rsvp._id)
    }

    // Delete papers and paper authors
    const userPapers = await ctx.db
      .query("papers")
      .withIndex("by_uploaded_by", (q) => q.eq("uploadedBy", user._id))
      .collect()
    for (const paper of userPapers) {
      const paperAuthors = await ctx.db
        .query("paperAuthors")
        .withIndex("by_paper", (q) => q.eq("paperId", paper._id))
        .collect()
      for (const pa of paperAuthors) {
        await ctx.db.delete(pa._id)
      }
      await ctx.db.delete(paper._id)
    }
    // Remove user from papers they co-authored (but didn't upload)
    const coAuthorLinks = await ctx.db
      .query("paperAuthors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const pa of coAuthorLinks) {
      await ctx.db.delete(pa._id)
    }

    // Delete projects and timeline (portfolio)
    const userProjects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const project of userProjects) {
      await ctx.db.delete(project._id)
    }
    const userTimeline = await ctx.db
      .query("timeline")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const entry of userTimeline) {
      await ctx.db.delete(entry._id)
    }

    // Delete jobs posted by this user and their applications
    const userJobs = await ctx.db
      .query("jobs")
      .withIndex("by_posted_by", (q) => q.eq("postedBy", user._id))
      .collect()
    for (const job of userJobs) {
      const applications = await ctx.db
        .query("jobApplications")
        .withIndex("by_job", (q) => q.eq("jobId", job._id))
        .collect()
      for (const app of applications) {
        await ctx.db.delete(app._id)
      }
      await ctx.db.delete(job._id)
    }
    // Delete job applications by this user
    const userApplications = await ctx.db
      .query("jobApplications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const app of userApplications) {
      await ctx.db.delete(app._id)
    }

    // Delete resources uploaded by this user
    const userResources = await ctx.db
      .query("resources")
      .withIndex("by_uploaded_by", (q) => q.eq("uploadedBy", user._id))
      .collect()
    for (const resource of userResources) {
      await ctx.db.delete(resource._id)
    }

    // Delete questions asked by this user (and their answers/votes)
    const userQuestions = await ctx.db
      .query("questions")
      .withIndex("by_asked_by", (q) => q.eq("askedBy", user._id))
      .collect()
    for (const question of userQuestions) {
      const answers = await ctx.db
        .query("answers")
        .withIndex("by_question", (q) => q.eq("questionId", question._id))
        .collect()
      for (const answer of answers) {
        const aVotes = await ctx.db
          .query("questionVotes")
          .withIndex("by_target", (q) => q.eq("targetId", answer._id))
          .collect()
        for (const v of aVotes) await ctx.db.delete(v._id)
        await ctx.db.delete(answer._id)
      }
      const qVotes = await ctx.db
        .query("questionVotes")
        .withIndex("by_target", (q) => q.eq("targetId", question._id))
        .collect()
      for (const v of qVotes) await ctx.db.delete(v._id)
      await ctx.db.delete(question._id)
    }
    // Delete answers by this user on OTHER questions
    const userAnswers = await ctx.db
      .query("answers")
      .withIndex("by_answered_by", (q) => q.eq("answeredBy", user._id))
      .collect()
    for (const answer of userAnswers) {
      const question = await ctx.db.get(answer.questionId)
      if (question) {
        await ctx.db.patch(answer.questionId, {
          answerCount: Math.max(0, question.answerCount - 1),
        })
        if (question.acceptedAnswerId === answer._id) {
          await ctx.db.patch(answer.questionId, { acceptedAnswerId: undefined })
        }
      }
      const aVotes = await ctx.db
        .query("questionVotes")
        .withIndex("by_target", (q) => q.eq("targetId", answer._id))
        .collect()
      for (const v of aVotes) await ctx.db.delete(v._id)
      await ctx.db.delete(answer._id)
    }

    // Delete question votes by this user
    const userQVotes = await ctx.db
      .query("questionVotes")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect()
    for (const vote of userQVotes) {
      // Reverse the vote on the target (question or answer)
      const target = await ctx.db.get(vote.targetId as any) as any
      if (target && typeof target.upvotes === "number") {
        if (vote.voteType === "up") {
          await ctx.db.patch(vote.targetId as any, {
            upvotes: Math.max(0, target.upvotes - 1),
          })
        } else {
          await ctx.db.patch(vote.targetId as any, {
            downvotes: Math.max(0, target.downvotes - 1),
          })
        }
      }
      await ctx.db.delete(vote._id)
    }

    // Delete subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique()
    if (subscription) {
      await ctx.db.delete(subscription._id)
    }

    // Delete ads by this user
    const userAds = await ctx.db
      .query("ads")
      .withIndex("by_advertiser", (q) => q.eq("advertiserId", user._id))
      .collect()
    for (const ad of userAds) {
      const impressions = await ctx.db
        .query("adImpressions")
        .withIndex("by_ad", (q) => q.eq("adId", ad._id))
        .collect()
      for (const imp of impressions) await ctx.db.delete(imp._id)
      const clicks = await ctx.db
        .query("adClicks")
        .withIndex("by_ad", (q) => q.eq("adId", ad._id))
        .collect()
      for (const click of clicks) await ctx.db.delete(click._id)
      await ctx.db.delete(ad._id)
    }

    // Delete listings by this user
    const userListings = await ctx.db
      .query("listings")
      .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
      .collect()
    for (const listing of userListings) {
      await ctx.db.delete(listing._id)
    }

    // Delete push subscriptions
    const pushSubs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const sub of pushSubs) {
      await ctx.db.delete(sub._id)
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
export const exportUserData = query({
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

    // ═══════ 1. Delete all posts and their associated data ═══════
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()

    for (const post of posts) {
      // Delete post hashtag links
      const postHashtags = await ctx.db
        .query("postHashtags")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()
      for (const ph of postHashtags) {
        await ctx.db.delete(ph._id)
      }
      // Delete reactions on this post
      const postReactions = await ctx.db
        .query("reactions")
        .withIndex("by_target", (q) => q.eq("targetId", post._id).eq("targetType", "post"))
        .collect()
      for (const r of postReactions) {
        await ctx.db.delete(r._id)
      }
      // Delete comments on this post
      const postComments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()
      for (const c of postComments) {
        // Delete reactions on each comment
        const commentReactions = await ctx.db
          .query("reactions")
          .withIndex("by_target", (q) => q.eq("targetId", c._id).eq("targetType", "comment"))
          .collect()
        for (const cr of commentReactions) {
          await ctx.db.delete(cr._id)
        }
        await ctx.db.delete(c._id)
      }
      // Delete bookmarks on this post
      const postBookmarks = await ctx.db
        .query("bookmarks")
        .withIndex("by_user_and_post", (q) => q.eq("userId", user._id).eq("postId", post._id))
        .collect()
      for (const b of postBookmarks) {
        await ctx.db.delete(b._id)
      }
      // Delete likes on this post
      const postLikes = await ctx.db
        .query("likes")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()
      for (const l of postLikes) {
        await ctx.db.delete(l._id)
      }
      // Delete reposts of this post
      const postReposts = await ctx.db
        .query("reposts")
        .withIndex("by_original_post", (q) => q.eq("originalPostId", post._id))
        .collect()
      for (const rp of postReposts) {
        await ctx.db.delete(rp._id)
      }
      await ctx.db.delete(post._id)
    }

    // ═══════ 2. Delete user's comments on other posts ═══════
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()

    for (const comment of comments) {
      // Decrement post commentCount
      const post = await ctx.db.get(comment.postId)
      if (post) {
        await ctx.db.patch(comment.postId, {
          commentCount: Math.max(0, post.commentCount - 1),
        })
      }
      // Delete reactions on this comment
      const commentReactions = await ctx.db
        .query("reactions")
        .withIndex("by_target", (q) => q.eq("targetId", comment._id).eq("targetType", "comment"))
        .collect()
      for (const cr of commentReactions) {
        await ctx.db.delete(cr._id)
      }
      await ctx.db.delete(comment._id)
    }

    // ═══════ 3. Delete user's reactions and adjust counts ═══════
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    for (const reaction of reactions) {
      if (reaction.targetType === "post") {
        const post = await ctx.db.get(reaction.targetId as any) as any
        if (post && typeof post.likeCount === "number") {
          await ctx.db.patch(reaction.targetId as any, {
            likeCount: Math.max(0, post.likeCount - 1),
          })
        }
      }
      await ctx.db.delete(reaction._id)
    }

    // ═══════ 4. Delete user's likes (legacy) and adjust counts ═══════
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    for (const like of likes) {
      const post = await ctx.db.get(like.postId)
      if (post) {
        await ctx.db.patch(like.postId, {
          likeCount: Math.max(0, (post.likeCount ?? 0) - 1),
        })
      }
      await ctx.db.delete(like._id)
    }

    // ═══════ 5. Delete bookmarks ═══════
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id)
    }

    // ═══════ 6. Delete follows and adjust counter fields ═══════
    const followsOut = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect()
    for (const follow of followsOut) {
      // Decrement followee's followerCount
      const followee = await ctx.db.get(follow.followingId)
      if (followee) {
        await ctx.db.patch(follow.followingId, {
          followerCount: Math.max(0, (followee.followerCount ?? 0) - 1),
        })
      }
      await ctx.db.delete(follow._id)
    }

    const followsIn = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect()
    for (const follow of followsIn) {
      // Decrement follower's followingCount
      const follower = await ctx.db.get(follow.followerId)
      if (follower) {
        await ctx.db.patch(follow.followerId, {
          followingCount: Math.max(0, (follower.followingCount ?? 0) - 1),
        })
      }
      await ctx.db.delete(follow._id)
    }

    // ═══════ 7. Delete notifications (received and sent as actor) ═══════
    const notificationsReceived = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
      .collect()
    for (const notification of notificationsReceived) {
      await ctx.db.delete(notification._id)
    }

    // ═══════ 8. Delete reposts ═══════
    const reposts = await ctx.db
      .query("reposts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const repost of reposts) {
      // Decrement original post shareCount
      const originalPost = await ctx.db.get(repost.originalPostId)
      if (originalPost) {
        await ctx.db.patch(repost.originalPostId, {
          shareCount: Math.max(0, (originalPost.shareCount ?? 0) - 1),
        })
      }
      await ctx.db.delete(repost._id)
    }

    // ═══════ 9. Delete messages and conversation participations ═══════
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

      // If no participants left, clean up conversation and remaining messages
      const remaining = await ctx.db
        .query("conversationParticipants")
        .withIndex("by_conversation", (q) => q.eq("conversationId", participation.conversationId))
        .collect()

      if (remaining.length === 0) {
        // Delete remaining messages
        const remainingMsgs = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", participation.conversationId))
          .collect()
        for (const m of remainingMsgs) {
          await ctx.db.delete(m._id)
        }
        // Delete typing indicators
        const typingIndicators = await ctx.db
          .query("typingIndicators")
          .withIndex("by_conversation", (q) => q.eq("conversationId", participation.conversationId))
          .collect()
        for (const ti of typingIndicators) {
          await ctx.db.delete(ti._id)
        }
        // Delete calls
        const calls = await ctx.db
          .query("calls")
          .withIndex("by_conversation", (q) => q.eq("conversationId", participation.conversationId))
          .collect()
        for (const call of calls) {
          await ctx.db.delete(call._id)
        }
        await ctx.db.delete(participation.conversationId)
      }
    }

    // ═══════ 10. Delete community memberships and adjust counts ═══════
    const communityMemberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    for (const membership of communityMemberships) {
      const community = await ctx.db.get(membership.communityId)
      if (community) {
        await ctx.db.patch(membership.communityId, {
          memberCount: Math.max(0, community.memberCount - 1),
        })
      }
      await ctx.db.delete(membership._id)
    }

    // ═══════ 11. Delete event RSVPs and adjust attendeeCounts ═══════
    const eventRSVPs = await ctx.db
      .query("eventRSVPs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const rsvp of eventRSVPs) {
      if (rsvp.status === "going") {
        const event = await ctx.db.get(rsvp.eventId)
        if (event) {
          await ctx.db.patch(rsvp.eventId, {
            attendeeCount: Math.max(0, event.attendeeCount - 1),
          })
        }
      }
      await ctx.db.delete(rsvp._id)
    }

    // ═══════ 12. Delete stories and story views ═══════
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()
    for (const story of stories) {
      const views = await ctx.db
        .query("storyViews")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .collect()
      for (const v of views) {
        await ctx.db.delete(v._id)
      }
      await ctx.db.delete(story._id)
    }

    // Delete views on other people's stories
    const storyViews = await ctx.db
      .query("storyViews")
      .withIndex("by_viewer", (q) => q.eq("viewerId", user._id))
      .collect()
    for (const sv of storyViews) {
      await ctx.db.delete(sv._id)
    }

    // ═══════ 13. Delete polls, poll votes, and adjust vote counts ═══════
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect()
    for (const poll of polls) {
      const votes = await ctx.db
        .query("pollVotes")
        .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
        .collect()
      for (const v of votes) {
        await ctx.db.delete(v._id)
      }
      await ctx.db.delete(poll._id)
    }

    // Delete user's votes on other polls
    const pollVotes = await ctx.db
      .query("pollVotes")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect()
    for (const vote of pollVotes) {
      const poll = await ctx.db.get(vote.pollId)
      if (poll) {
        const updatedOptions = poll.options.map((opt: any) =>
          opt.id === vote.optionId
            ? { ...opt, votes: Math.max(0, (opt.votes ?? 0) - 1) }
            : opt
        )
        await ctx.db.patch(vote.pollId, {
          options: updatedOptions,
          totalVotes: Math.max(0, (poll.totalVotes ?? 0) - 1),
        })
      }
      await ctx.db.delete(vote._id)
    }

    // ═══════ 14. Delete subscriptions ═══════
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const sub of subscriptions) {
      await ctx.db.delete(sub._id)
    }

    // ═══════ 15. Delete ads, impressions, clicks ═══════
    const ads = await ctx.db
      .query("ads")
      .withIndex("by_advertiser", (q) => q.eq("advertiserId", user._id))
      .collect()
    for (const ad of ads) {
      const impressions = await ctx.db
        .query("adImpressions")
        .withIndex("by_ad", (q) => q.eq("adId", ad._id))
        .collect()
      for (const imp of impressions) {
        await ctx.db.delete(imp._id)
      }
      const clicks = await ctx.db
        .query("adClicks")
        .withIndex("by_ad", (q) => q.eq("adId", ad._id))
        .collect()
      for (const click of clicks) {
        await ctx.db.delete(click._id)
      }
      await ctx.db.delete(ad._id)
    }

    // ═══════ 16. Delete jobs and applications ═══════
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_posted_by", (q) => q.eq("postedBy", user._id))
      .collect()
    for (const job of jobs) {
      const applications = await ctx.db
        .query("jobApplications")
        .withIndex("by_job", (q) => q.eq("jobId", job._id))
        .collect()
      for (const app of applications) {
        await ctx.db.delete(app._id)
      }
      await ctx.db.delete(job._id)
    }

    // Delete user's job applications
    const jobApplications = await ctx.db
      .query("jobApplications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const app of jobApplications) {
      await ctx.db.delete(app._id)
    }

    // ═══════ 17. Delete resources ═══════
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_uploaded_by", (q) => q.eq("uploadedBy", user._id))
      .collect()
    for (const resource of resources) {
      await ctx.db.delete(resource._id)
    }

    // ═══════ 18. Delete questions, answers, and votes ═══════
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_asked_by", (q) => q.eq("askedBy", user._id))
      .collect()
    for (const question of questions) {
      const answers = await ctx.db
        .query("answers")
        .withIndex("by_question", (q) => q.eq("questionId", question._id))
        .collect()
      for (const ans of answers) {
        await ctx.db.delete(ans._id)
      }
      await ctx.db.delete(question._id)
    }

    // Delete user's answers
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_answered_by", (q) => q.eq("answeredBy", user._id))
      .collect()
    for (const ans of answers) {
      await ctx.db.delete(ans._id)
    }

    // ═══════ 19. Delete papers and paper authors ═══════
    const papers = await ctx.db
      .query("papers")
      .withIndex("by_uploaded_by", (q) => q.eq("uploadedBy", user._id))
      .collect()
    for (const paper of papers) {
      const paperAuthors = await ctx.db
        .query("paperAuthors")
        .withIndex("by_paper", (q) => q.eq("paperId", paper._id))
        .collect()
      for (const pa of paperAuthors) {
        await ctx.db.delete(pa._id)
      }
      await ctx.db.delete(paper._id)
    }

    // Delete user as paper author
    const paperAuthorRecords = await ctx.db
      .query("paperAuthors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const pa of paperAuthorRecords) {
      await ctx.db.delete(pa._id)
    }

    // ═══════ 20. Delete projects and timeline ═══════
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const project of projects) {
      await ctx.db.delete(project._id)
    }

    const timeline = await ctx.db
      .query("timeline")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const entry of timeline) {
      await ctx.db.delete(entry._id)
    }

    // ═══════ 21. Delete skill endorsements ═══════
    const endorsementsReceived = await ctx.db
      .query("skillEndorsements")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect()
    for (const e of endorsementsReceived) {
      await ctx.db.delete(e._id)
    }

    const endorsementsGiven = await ctx.db
      .query("skillEndorsements")
      .withIndex("by_endorser", (q) => q.eq("endorserId", user._id))
      .collect()
    for (const e of endorsementsGiven) {
      await ctx.db.delete(e._id)
    }

    // ═══════ 22. Delete suggestions ═══════
    const suggestions = await ctx.db
      .query("suggestions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const s of suggestions) {
      await ctx.db.delete(s._id)
    }

    // ═══════ 23. Delete achievements ═══════
    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const a of achievements) {
      await ctx.db.delete(a._id)
    }

    // ═══════ 24. Delete events organized by user ═══════
    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
      .collect()
    for (const event of events) {
      const rsvps = await ctx.db
        .query("eventRSVPs")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect()
      for (const rsvp of rsvps) {
        await ctx.db.delete(rsvp._id)
      }
      await ctx.db.delete(event._id)
    }

    // ═══════ 25. Delete push subscriptions ═══════
    const pushSubs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const ps of pushSubs) {
      await ctx.db.delete(ps._id)
    }

    // ═══════ 26. Delete marketplace listings ═══════
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
      .collect()
    for (const listing of listings) {
      await ctx.db.delete(listing._id)
    }

    // ═══════ Finally, Delete User Record ═══════
    await ctx.db.delete(user._id)

    return {
      success: true,
      message: "Account and all associated data deleted successfully",
      note: "Please also delete your account from the authentication provider (Clerk) if needed",
    }
  },
})

/**
 * Mark the authenticated user's onboarding as complete.
 * Saves name, username, bio, university, role, skills, and interests.
 */
export const completeOnboarding = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    bio: v.optional(v.string()),
    university: v.optional(v.string()),
    role: v.union(
      v.literal("Student"),
      v.literal("Research Scholar"),
      v.literal("Faculty")
    ),
    skills: v.array(v.string()),
    researchInterests: v.optional(v.array(v.string())),
    profilePicture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()
    if (!user) throw new Error("User not found")

    // Check username uniqueness
    const sanitizedUsername = sanitizeText(args.username)
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", sanitizedUsername))
      .first()
    if (existingUser && existingUser._id !== user._id) {
      throw new Error("Username is already taken")
    }

    // Sanitize skills
    const sanitizedSkills = args.skills.map((skill) => sanitizeText(skill))

    await ctx.db.patch(user._id, {
      name: sanitizeText(args.name),
      username: sanitizedUsername,
      bio: args.bio ? sanitizeText(args.bio) : undefined,
      university: args.university ? sanitizeText(args.university) : undefined,
      role: args.role,
      skills: sanitizedSkills,
      researchInterests: args.researchInterests,
      profilePicture: args.profilePicture ?? user.profilePicture,
      onboardingComplete: true,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Check if the current user has completed onboarding.
 * Returns null when unauthenticated.
 */
export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()

    return {
      complete: user?.onboardingComplete ?? false,
      userId: user?._id ?? null,
    }
  },
})
