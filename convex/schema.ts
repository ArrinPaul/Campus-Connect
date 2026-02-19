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
    notificationPreferences: v.optional(
      v.object({
        reactions: v.boolean(),
        comments: v.boolean(),
        mentions: v.boolean(),
        follows: v.boolean(),
      })
    ),
    // Phase 2.3 — Presence & Activity Status
    status: v.optional(
      v.union(
        v.literal("online"),
        v.literal("away"),
        v.literal("dnd"),
        v.literal("invisible")
      )
    ),
    customStatus: v.optional(v.string()), // custom status message
    lastSeenAt: v.optional(v.number()), // timestamp of last activity
    showOnlineStatus: v.optional(v.boolean()), // privacy toggle (default true)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_lastSeenAt", ["lastSeenAt"]),

  posts: defineTable({
    authorId: v.id("users"),
    content: v.string(),
    likeCount: v.number(), // Legacy - will be replaced by reactionCounts
    commentCount: v.number(),
    shareCount: v.number(), // Number of reposts/shares
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
    // Phase 3.1 — Rich Media
    mediaUrls: v.optional(v.array(v.string())), // resolved URLs for uploaded media
    mediaType: v.optional(
      v.union(
        v.literal("image"),
        v.literal("video"),
        v.literal("file"),
        v.literal("link")
      )
    ),
    mediaFileNames: v.optional(v.array(v.string())), // original file names
    linkPreview: v.optional(
      v.object({
        url: v.string(),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        image: v.optional(v.string()),
        favicon: v.optional(v.string()),
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

  reposts: defineTable({
    userId: v.id("users"), // user who reposted
    originalPostId: v.id("posts"), // original post being shared
    quoteContent: v.optional(v.string()), // optional comment for quote posts
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_original_post", ["originalPostId"])
    .index("by_user_and_post", ["userId", "originalPostId"])
    .index("by_createdAt", ["createdAt"]),

  // Phase 2.1 — Direct Messaging / Phase 2.2 — Group Chat
  conversations: defineTable({
    type: v.union(v.literal("direct"), v.literal("group")), // DM or group
    participantIds: v.array(v.id("users")), // sorted for consistent lookup (DMs)
    name: v.optional(v.string()), // group name (group only)
    avatar: v.optional(v.string()), // group avatar URL (group only)
    description: v.optional(v.string()), // group description (group only)
    createdBy: v.optional(v.id("users")), // group creator
    lastMessageId: v.optional(v.id("messages")),
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()), // preview text
    createdAt: v.number(),
  })
    .index("by_last_message", ["lastMessageAt"])
    .index("by_participant", ["participantIds"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("file"),
      v.literal("system")
    ),
    attachmentUrl: v.optional(v.string()),
    attachmentName: v.optional(v.string()),
    replyToId: v.optional(v.id("messages")),
    status: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("read")
    ),
    isDeleted: v.boolean(),
    deletedForUserIds: v.optional(v.array(v.id("users"))), // "delete for me"
    isPinned: v.optional(v.boolean()), // pinned messages (group feature)
    createdAt: v.number(),
    updatedAt: v.optional(v.number()), // for edited messages
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_sender", ["senderId"]),

  conversationParticipants: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    role: v.optional(v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member")
    )), // group roles (null for DMs)
    lastReadMessageId: v.optional(v.id("messages")),
    lastReadAt: v.optional(v.number()),
    isMuted: v.boolean(),
    joinedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_conversation", ["conversationId"])
    .index("by_user_conversation", ["userId", "conversationId"]),

  // Typing indicators (ephemeral presence data)
  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user_conversation", ["userId", "conversationId"]),

  // Voice/Video Calls (Phase 2.4)
  calls: defineTable({
    conversationId: v.id("conversations"),
    callerId: v.id("users"),
    type: v.union(v.literal("audio"), v.literal("video")),
    status: v.union(
      v.literal("ringing"),
      v.literal("active"),
      v.literal("ended"),
      v.literal("missed"),
      v.literal("rejected"),
      v.literal("busy")
    ),
    participants: v.array(v.object({
      userId: v.id("users"),
      joinedAt: v.optional(v.number()),
      leftAt: v.optional(v.number()),
      status: v.union(
        v.literal("ringing"),
        v.literal("connected"),
        v.literal("declined"),
        v.literal("missed"),
        v.literal("left")
      ),
    })),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    duration: v.optional(v.number()), // in seconds
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_caller", ["callerId", "createdAt"])
    .index("by_status", ["status", "createdAt"]),

  // Stories — Ephemeral Content (Phase 3.2)
  stories: defineTable({
    authorId: v.id("users"),
    // Text content (optional — may be image-only)
    content: v.optional(v.string()),
    // Uploaded media URL (image from Convex storage)
    mediaUrl: v.optional(v.string()),
    // Background color for text-only stories (e.g. "#1a73e8")
    backgroundColor: v.optional(v.string()),
    // Unix timestamp when story expires (creation + 24h)
    expiresAt: v.number(),
    viewCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_author", ["authorId", "createdAt"])
    .index("by_expiry", ["expiresAt"]),

  storyViews: defineTable({
    storyId: v.id("stories"),
    viewerId: v.id("users"),
    viewedAt: v.number(),
  })
    .index("by_story", ["storyId", "viewedAt"])
    .index("by_viewer", ["viewerId", "viewedAt"])
    .index("by_story_viewer", ["storyId", "viewerId"]),
})
