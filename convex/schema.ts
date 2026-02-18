import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()), // Used for @mentions
    profilePicture: v.optional(v.string()),
    bio: v.optional(v.string()),
    university: v.optional(v.string()),
    role: v.union(
      v.literal("Student"),
      v.literal("Research Scholar"),
      v.literal("Faculty")
    ),
    experienceLevel: v.union(
      v.literal("Beginner"),
      v.literal("Intermediate"),
      v.literal("Advanced"),
      v.literal("Expert")
    ),
    skills: v.array(v.string()),
    socialLinks: v.object({
      github: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      twitter: v.optional(v.string()),
      website: v.optional(v.string()),
    }),
    followerCount: v.number(),
    followingCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  posts: defineTable({
    authorId: v.id("users"),
    content: v.string(),
    likeCount: v.number(), // Legacy - will be replaced by reactionCounts
    commentCount: v.number(),
    reactionCounts: v.optional(
      v.object({
        like: v.number(),
        love: v.number(),
        laugh: v.number(),
        wow: v.number(),
        sad: v.number(),
        scholarly: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_createdAt", ["createdAt"]),

  likes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),

  reactions: defineTable({
    userId: v.id("users"),
    targetId: v.string(), // postId or commentId
    targetType: v.union(v.literal("post"), v.literal("comment")),
    type: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("laugh"),
      v.literal("wow"),
      v.literal("sad"),
      v.literal("scholarly")
    ),
    createdAt: v.number(),
  })
    .index("by_target", ["targetId", "targetType"])
    .index("by_user_target", ["userId", "targetId", "targetType"])
    .index("by_user", ["userId"]),

  bookmarks: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    collectionName: v.optional(v.string()), // default: "Saved"
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_post", ["userId", "postId"])
    .index("by_user_and_collection", ["userId", "collectionName"]),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    reactionCounts: v.optional(
      v.object({
        like: v.number(),
        love: v.number(),
        laugh: v.number(),
        wow: v.number(),
        sad: v.number(),
        scholarly: v.number(),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_and_following", ["followerId", "followingId"]),

  hashtags: defineTable({
    tag: v.string(), // lowercase, normalized (e.g., "machinelearning")
    postCount: v.number(), // number of posts using this hashtag
    lastUsedAt: v.number(), // timestamp of last use
    trendingScore: v.optional(v.number()), // computed score for trending
  })
    .index("by_tag", ["tag"])
    .index("by_post_count", ["postCount"])
    .index("by_trending_score", ["trendingScore"]),

  postHashtags: defineTable({
    postId: v.id("posts"),
    hashtagId: v.id("hashtags"),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_hashtag", ["hashtagId"])
    .index("by_hashtag_created", ["hashtagId", "createdAt"]),

  notifications: defineTable({
    recipientId: v.id("users"), // user receiving the notification
    actorId: v.id("users"), // user who triggered the notification
    type: v.union(
      v.literal("reaction"), // someone reacted to your post/comment
      v.literal("comment"), // someone commented on your post
      v.literal("mention"), // someone mentioned you
      v.literal("follow"), // someone followed you
      v.literal("reply") // someone replied to your comment
    ),
    referenceId: v.optional(v.string()), // postId, commentId, etc.
    message: v.string(), // e.g., "John Doe liked your post"
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_recipient", ["recipientId"])
    .index("by_recipient_unread", ["recipientId", "isRead"])
    .index("by_recipient_created", ["recipientId", "createdAt"]),
})
