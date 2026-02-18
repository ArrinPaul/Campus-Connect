import { describe, it, expect, vi, beforeEach } from "@jest/globals"
// Note: convex-test/testing is not available as a dependency.
// These tests are designed for Convex's testing framework and are skipped in Jest.
// Backend tests for reactions are covered by convex/reposts.test.ts and convex/posts.test.ts.

describe.skip("Reactions (requires convex-test)", () => {
  let t: ConvexTestingHelper<typeof schema>

  beforeEach(() => {
    t = new ConvexTestingHelper(schema)
  })

  describe("addReaction", () => {
    it("should create a new reaction", async () => {
      // Create test user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: "test-user",
          email: "test@example.com",
          name: "Test User",
          role: "Student",
          experienceLevel: "Beginner",
          skills: [],
          socialLinks: {},
          followerCount: 0,
          followingCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create test post
      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          authorId: userId,
          content: "Test post",
          likeCount: 0,
          commentCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Add reaction
      const result = await t.mutation(api.reactions.addReaction, {
        targetId: postId,
        targetType: "post",
        type: "like",
      })

      expect(result.success).toBe(true)
      expect(result.action).toBe("created")

      // Verify reaction was created
      const reactions = await t.run(async (ctx) => {
        return await ctx.db
          .query("reactions")
          .withIndex("by_target", (q) => q.eq("targetId", postId).eq("targetType", "post"))
          .collect()
      })

      expect(reactions).toHaveLength(1)
      expect(reactions[0].type).toBe("like")
      expect(reactions[0].userId).toBe(userId)
    })

    it("should update existing reaction to new type", async () => {
      // Setup user and post
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: "test-user",
          email: "test@example.com",
          name: "Test User",
          role: "Student",
          experienceLevel: "Beginner",
          skills: [],
          socialLinks: {},
          followerCount: 0,
          followingCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          authorId: userId,
          content: "Test post",
          likeCount: 0,
          commentCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Add initial reaction
      await t.mutation(api.reactions.addReaction, {
        targetId: postId,
        targetType: "post",
        type: "like",
      })

      // Change reaction type
      const result = await t.mutation(api.reactions.addReaction, {
        targetId: postId,
        targetType: "post",
        type: "love",
      })

      expect(result.success).toBe(true)
      expect(result.action).toBe("updated")

      // Verify reaction was updated
      const reactions = await t.run(async (ctx) => {
        return await ctx.db
          .query("reactions")
          .withIndex("by_target", (q) => q.eq("targetId", postId).eq("targetType", "post"))
          .collect()
      })

      expect(reactions).toHaveLength(1)
      expect(reactions[0].type).toBe("love")
    })

    it("should not create duplicate reactions of same type", async () => {
      // Setup
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: "test-user",
          email: "test@example.com",
          name: "Test User",
          role: "Student",
          experienceLevel: "Beginner",
          skills: [],
          socialLinks: {},
          followerCount: 0,
          followingCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          authorId: userId,
          content: "Test post",
          likeCount: 0,
          commentCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Add reaction twice
      await t.mutation(api.reactions.addReaction, {
        targetId: postId,
        targetType: "post",
        type: "like",
      })

      const result = await t.mutation(api.reactions.addReaction, {
        targetId: postId,
        targetType: "post",
        type: "like",
      })

      expect(result.success).toBe(true)
      expect(result.action).toBe("no-change")

      // Verify only one reaction exists
      const reactions = await t.run(async (ctx) => {
        return await ctx.db
          .query("reactions")
          .withIndex("by_target", (q) => q.eq("targetId", postId).eq("targetType", "post"))
          .collect()
      })

      expect(reactions).toHaveLength(1)
    })
  })

  describe("removeReaction", () => {
    it("should remove a reaction", async () => {
      // Setup
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: "test-user",
          email: "test@example.com",
          name: "Test User",
          role: "Student",
          experienceLevel: "Beginner",
          skills: [],
          socialLinks: {},
          followerCount: 0,
          followingCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          authorId: userId,
          content: "Test post",
          likeCount: 0,
          commentCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Add reaction
      await t.mutation(api.reactions.addReaction, {
        targetId: postId,
        targetType: "post",
        type: "like",
      })

      // Remove reaction
      const result = await t.mutation(api.reactions.removeReaction, {
        targetId: postId,
        targetType: "post",
      })

      expect(result.success).toBe(true)

      // Verify reaction was removed
      const reactions = await t.run(async (ctx) => {
        return await ctx.db
          .query("reactions")
          .withIndex("by_target", (q) => q.eq("targetId", postId).eq("targetType", "post"))
          .collect()
      })

      expect(reactions).toHaveLength(0)
    })
  })

  describe("getReactions", () => {
    it("should return reaction counts grouped by type", async () => {
      // Setup multiple users and reactions
      const user1Id = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: "user1",
          email: "user1@example.com",
          name: "User 1",
          role: "Student",
          experienceLevel: "Beginner",
          skills: [],
          socialLinks: {},
          followerCount: 0,
          followingCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const user2Id = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: "user2",
          email: "user2@example.com",
          name: "User 2",
          role: "Student",
          experienceLevel: "Beginner",
          skills: [],
          socialLinks: {},
          followerCount: 0,
          followingCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          authorId: user1Id,
          content: "Test post",
          likeCount: 0,
          commentCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Add different reactions
      await t.run(async (ctx) => {
        await ctx.db.insert("reactions", {
          userId: user1Id,
          targetId: postId,
          targetType: "post",
          type: "like",
          createdAt: Date.now(),
        })
        await ctx.db.insert("reactions", {
          userId: user2Id,
          targetId: postId,
          targetType: "post",
          type: "love",
          createdAt: Date.now(),
        })
      })

      // Get reactions
      const result = await t.query(api.reactions.getReactions, {
        targetId: postId,
        targetType: "post",
      })

      expect(result.total).toBe(2)
      expect(result.counts.like).toBe(1)
      expect(result.counts.love).toBe(1)
      expect(result.topReactions).toHaveLength(2)
    })
  })

  describe("getUserReaction", () => {
    it("should return current user's reaction type", async () => {
      // Setup
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          clerkId: "test-user",
          email: "test@example.com",
          name: "Test User",
          role: "Student",
          experienceLevel: "Beginner",
          skills: [],
          socialLinks: {},
          followerCount: 0,
          followingCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          authorId: userId,
          content: "Test post",
          likeCount: 0,
          commentCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Add reaction
      await t.run(async (ctx) => {
        await ctx.db.insert("reactions", {
          userId,
          targetId: postId,
          targetType: "post",
          type: "scholarly",
          createdAt: Date.now(),
        })
      })

      // Get user's reaction
      const result = await t.query(api.reactions.getUserReaction, {
        targetId: postId,
        targetType: "post",
      })

      expect(result).toBe("scholarly")
    })

    it("should return null if user has not reacted", async () => {
      const postId = "test-post-id"

      const result = await t.query(api.reactions.getUserReaction, {
        targetId: postId,
        targetType: "post",
      })

      expect(result).toBeNull()
    })
  })
})
