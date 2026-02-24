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
    // Phase 6.1 — Research Collaboration
    researchInterests: v.optional(v.array(v.string())),
    // Phase 6.5 — Gamification
    reputation: v.optional(v.number()),
    level: v.optional(v.number()),
    // Phase 7.1 — Premium
    isPro: v.optional(v.boolean()),
    proExpiresAt: v.optional(v.number()),
    isVerified: v.optional(v.boolean()),
    stripeCustomerId: v.optional(v.string()),
    // Phase 7.4 — Email prefs
    emailDigestFrequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("never"))),
    emailNotifications: v.optional(v.boolean()),
    // Onboarding
    onboardingComplete: v.optional(v.boolean()),
    // Admin flag
    isAdmin: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_lastSeenAt", ["lastSeenAt"])
    .searchIndex("by_search", {
      searchField: "name",
      filterFields: ["username", "bio", "university", "role", "skills"],
    }),

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
    // Phase 3.3 — Poll attachment
    pollId: v.optional(v.id("polls")),
    // Phase 5.1 — Community / Group posts
    communityId: v.optional(v.id("communities")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_community", ["communityId"])
    .searchIndex("by_content", {
      searchField: "content",
    }),

  userFeed: defineTable({
    userId: v.id("users"), // The user whose feed this is
    postId: v.id("posts"), // The post appearing in the feed
    createdAt: v.number(),
  }).index("by_user", ["userId", "createdAt"]),

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
    targetType: v.union(v.literal("post"), v.literal("comment"), v.literal("message")),
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
    .index("by_user_and_collection", ["userId", "collectionName"])
    .index("by_post", ["postId"]),  // enables fast cascade delete when a post is removed

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
    depth: v.optional(v.number()),
    replyCount: v.optional(v.number()),
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
    .index("by_author", ["authorId"])
    .index("by_parent", ["parentCommentId"]),

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
      v.literal("reply"), // someone replied to your comment
      v.literal("event"), // event-related notification
      v.literal("message") // direct message notification
    ),
    referenceId: v.optional(v.string()), // postId, commentId, etc.
    message: v.string(), // e.g., "John Doe liked your post"
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_recipient", ["recipientId"])
    .index("by_recipient_unread", ["recipientId", "isRead"])
    .index("by_recipient_created", ["recipientId", "createdAt"])
    .index("by_actor", ["actorId"]),   // enables indexed cleanup when actor is deleted

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

  // Phase 3.3 — Polls & Surveys
  polls: defineTable({
    postId: v.optional(v.id("posts")), // linked post (set after post creation)
    authorId: v.id("users"),
    question: v.optional(v.string()), // optional separate question text
    options: v.array(
      v.object({
        id: v.string(),      // stable UUID for the option
        text: v.string(),    // display text
        voteCount: v.number(),
      })
    ),
    totalVotes: v.number(),
    // Unix timestamp when poll closes (null = never)
    endsAt: v.optional(v.number()),
    isAnonymous: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"]),

  pollVotes: defineTable({
    pollId: v.id("polls"),
    userId: v.id("users"),
    optionId: v.string(), // references polls.options[n].id
    createdAt: v.number(),
  })
    .index("by_poll", ["pollId", "createdAt"])
    .index("by_user_poll", ["userId", "pollId"]),

  // Phase 4.1 — Friend Suggestion Engine
  suggestions: defineTable({
    userId: v.id("users"),             // user receiving the suggestion
    suggestedUserId: v.id("users"),    // suggested user to follow
    score: v.number(),                 // composite score 0–1
    reasons: v.array(v.string()),      // human-readable reason strings
    isDismissed: v.boolean(),          // user dismissed this suggestion
    computedAt: v.number(),            // timestamp when computed
  })
    .index("by_user", ["userId", "score"])
    .index("by_user_dismissed", ["userId", "isDismissed"])
    .index("by_suggested_user", ["suggestedUserId"]),  // enables cleanup of stale suggestions

  // Phase 4.5 — Skill-Based Matching & Endorsements
  skillEndorsements: defineTable({
    skillName: v.string(),             // the skill being endorsed (normalized lowercase)
    userId: v.id("users"),             // user whose skill is being endorsed
    endorserId: v.id("users"),         // user giving the endorsement
    createdAt: v.number(),
  })
    .index("by_user_skill", ["userId", "skillName"])
    .index("by_endorser", ["endorserId"])
    .index("by_user_skill_endorser", ["userId", "skillName", "endorserId"]),

  // Phase 5.1 — Communities / Groups
  communities: defineTable({
    name: v.string(),
    slug: v.string(),                  // unique URL-friendly identifier
    description: v.string(),
    avatar: v.optional(v.string()),    // image URL
    banner: v.optional(v.string()),    // banner image URL
    type: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("secret")
    ),
    category: v.string(),              // e.g. Academic, Research, Social, Sports, Clubs
    rules: v.array(v.string()),        // community rules list
    memberCount: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_member_count", ["memberCount"]),

  communityMembers: defineTable({
    communityId: v.id("communities"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("member"),
      v.literal("pending")             // awaiting approval for private community
    ),
    joinedAt: v.number(),
  })
    .index("by_community", ["communityId"])
    .index("by_user", ["userId"])
    .index("by_community_user", ["communityId", "userId"]),

  communityInvites: defineTable({
    communityId: v.id("communities"),
    invitedUserId: v.id("users"),
    invitedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("revoked")
    ),
    createdAt: v.number(),
  })
    .index("by_community", ["communityId"])
    .index("by_invited_user", ["invitedUserId"])
    .index("by_community_user", ["communityId", "invitedUserId"]),

  // Phase 5.3 — Events & Scheduling
  events: defineTable({
    title: v.string(),
    description: v.string(),
    organizerId: v.id("users"),
    communityId: v.optional(v.id("communities")),
    eventType: v.union(
      v.literal("in_person"),
      v.literal("virtual"),
      v.literal("hybrid")
    ),
    startDate: v.number(),             // Unix timestamp
    endDate: v.number(),               // Unix timestamp
    location: v.optional(v.string()), // physical location / address
    virtualLink: v.optional(v.string()), // video call URL
    isRecurring: v.boolean(),
    maxAttendees: v.optional(v.number()),
    attendeeCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_start_date", ["startDate"])
    .index("by_organizer", ["organizerId"])
    .index("by_community", ["communityId"]),

  eventRSVPs: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(
      v.literal("going"),
      v.literal("maybe"),
      v.literal("not_going")
    ),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_user", ["eventId", "userId"]),

  // Phase 6.1 — Research Collaboration Hub
  papers: defineTable({
    title: v.string(),
    abstract: v.string(),
    authors: v.array(v.string()),         // free-text author names
    doi: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    uploadedBy: v.id("users"),
    tags: v.array(v.string()),
    citationCount: v.number(),
    lookingForCollaborators: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_uploaded_by", ["uploadedBy"])
    .index("by_created", ["createdAt"]),

  paperAuthors: defineTable({
    paperId: v.id("papers"),
    userId: v.id("users"),
  })
    .index("by_paper", ["paperId"])
    .index("by_user", ["userId"]),

  // Phase 6.2 — Academic Portfolio
  projects: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    techStack: v.array(v.string()),
    links: v.array(v.string()),
    screenshots: v.optional(v.array(v.string())),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  timeline: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("course"),
      v.literal("certification"),
      v.literal("publication"),
      v.literal("award")
    ),
    title: v.string(),
    institution: v.optional(v.string()),
    date: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Phase 6.3 — Job / Internship Board
  jobs: defineTable({
    title: v.string(),
    company: v.string(),
    description: v.string(),
    type: v.union(v.literal("job"), v.literal("internship")),
    location: v.string(),
    remote: v.boolean(),
    duration: v.optional(v.string()),
    skillsRequired: v.array(v.string()),
    salary: v.optional(v.string()),
    postedBy: v.id("users"),
    applicantCount: v.number(),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_posted_by", ["postedBy"])
    .index("by_created", ["createdAt"]),

  jobApplications: defineTable({
    jobId: v.id("jobs"),
    userId: v.id("users"),
    coverLetter: v.optional(v.string()),
    resumeUrl: v.optional(v.string()),
    status: v.union(
      v.literal("applied"),
      v.literal("viewed"),
      v.literal("shortlisted"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
  })
    .index("by_job", ["jobId"])
    .index("by_user", ["userId"])
    .index("by_user_job", ["userId", "jobId"]),

  // Phase 6.4 — Study Resources & Q&A
  resources: defineTable({
    title: v.string(),
    description: v.string(),
    fileUrl: v.optional(v.string()),
    course: v.string(),
    subject: v.optional(v.string()),
    uploadedBy: v.id("users"),
    rating: v.number(),
    ratingCount: v.number(),
    downloadCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_course", ["course"])
    .index("by_uploaded_by", ["uploadedBy"]),

  resourceRatings: defineTable({
    resourceId: v.id("resources"),
    userId: v.id("users"),
    rating: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_resource", ["userId", "resourceId"])
    .index("by_resource", ["resourceId"]),

  questions: defineTable({
    title: v.string(),
    content: v.string(),
    askedBy: v.id("users"),
    course: v.optional(v.string()),
    tags: v.array(v.string()),
    viewCount: v.number(),
    upvotes: v.number(),
    downvotes: v.number(),
    answerCount: v.number(),
    acceptedAnswerId: v.optional(v.id("answers")),
    createdAt: v.number(),
  })
    .index("by_asked_by", ["askedBy"])
    .index("by_created", ["createdAt"]),

  answers: defineTable({
    questionId: v.id("questions"),
    content: v.string(),
    answeredBy: v.id("users"),
    upvotes: v.number(),
    downvotes: v.number(),
    isAccepted: v.boolean(),
    mediaUrls: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_question", ["questionId"])
    .index("by_answered_by", ["answeredBy"]),

  questionVotes: defineTable({
    targetId: v.string(),           // questionId or answerId
    targetType: v.union(v.literal("question"), v.literal("answer")),
    userId: v.id("users"),
    voteType: v.union(v.literal("up"), v.literal("down")),
    createdAt: v.number(),
  })
    .index("by_target", ["targetId", "targetType"])
    .index("by_user_target", ["userId", "targetId", "targetType"]),

  // Phase 6.5 — Achievement & Gamification
  achievements: defineTable({
    userId: v.id("users"),
    badge: v.string(),
    name: v.string(),
    description: v.string(),
    earnedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Phase 7.1 — Subscriptions
  subscriptions: defineTable({
    userId: v.id("users"),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro")),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_sub", ["stripeSubscriptionId"]),

  // Phase 7.2 — Advertising
  ads: defineTable({
    title: v.string(),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    linkUrl: v.string(),
    advertiserId: v.id("users"),
    targetUniversity: v.optional(v.string()),
    targetRole: v.optional(v.string()),
    targetSkills: v.optional(v.array(v.string())),
    budget: v.number(),
    impressions: v.number(),
    clicks: v.number(),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("expired")),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_advertiser", ["advertiserId"])
    .index("by_status", ["status"]),

  adImpressions: defineTable({
    adId: v.id("ads"),
    userId: v.id("users"),
    viewedAt: v.number(),
  })
    .index("by_ad", ["adId"])
    .index("by_user_ad", ["userId", "adId"]),

  adClicks: defineTable({
    adId: v.id("ads"),
    userId: v.id("users"),
    clickedAt: v.number(),
  })
    .index("by_ad", ["adId"]),

  // Phase 7.3 — Marketplace
  listings: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("books"),
      v.literal("electronics"),
      v.literal("furniture"),
      v.literal("services"),
      v.literal("other")
    ),
    price: v.number(),
    condition: v.union(
      v.literal("new"),
      v.literal("like_new"),
      v.literal("good"),
      v.literal("fair"),
      v.literal("poor")
    ),
    images: v.optional(v.array(v.string())),
    sellerId: v.id("users"),
    university: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("sold"), v.literal("expired")),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_seller", ["sellerId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"]),

  // Marketplace transactions (purchase flow)
  marketplaceTransactions: defineTable({
    listingId: v.id("listings"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    amount: v.number(),                 // price at time of purchase
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("disputed")
    ),
    message: v.optional(v.string()),    // buyer message to seller
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_listing", ["listingId"]),

  // Phase 7.4 — Push Notifications
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Rate limiting — sliding-window counters per user/action
  rateLimits: defineTable({
    userId: v.id("users"),
    action: v.string(),       // e.g., "createPost", "sendMessage"
    windowStart: v.number(),  // start of the current window (Unix timestamp ms)
    count: v.number(),        // attempts within the current window
  })
    .index("by_user_action", ["userId", "action"]),
})
