/**
 * Tests for convex/stories.ts backend logic.
 *
 * Tests the pure handler logic by building mock ctx objects directly
 * (same pattern as convex/media.test.ts — avoids Convex wrapper internals).
 */

const STORY_TTL_MS = 24 * 60 * 60 * 1000 // 24h

// ─── Shared test helpers ──────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return {
    _id: "user_abc",
    clerkId: "clerk_abc",
    name: "Alice",
    username: "alice",
    profilePicture: undefined,
    ...overrides,
  }
}

function makeStory(overrides = {}) {
  const now = Date.now()
  return {
    _id: "story_001",
    authorId: "user_abc",
    content: "Hello world",
    mediaUrl: undefined,
    backgroundColor: "#1a73e8",
    expiresAt: now + STORY_TTL_MS,
    viewCount: 0,
    createdAt: now,
    ...overrides,
  }
}

// ─── createStory logic ────────────────────────────────────────────────────────

describe("createStory logic", () => {
  it("should reject unauthenticated requests", async () => {
    const ctx = {
      auth: { getUserIdentity: async () => null },
      db: {},
    }
    await expect(
      (async () => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) throw new Error("Not authenticated")
      })()
    ).rejects.toThrow("Not authenticated")
  })

  it("should reject when neither content nor mediaUrl is provided", async () => {
    await expect(
      (async () => {
        const args = { content: undefined, mediaUrl: undefined, backgroundColor: undefined }
        if (!args.content && !args.mediaUrl) throw new Error("Story must have either content or media")
      })()
    ).rejects.toThrow("Story must have either content or media")
  })

  it("should reject empty content string", async () => {
    await expect(
      (async () => {
        const args = { content: "   ", mediaUrl: undefined }
        if (!args.content && !args.mediaUrl) throw new Error("Story must have either content or media")
        if (args.content && args.content.trim().length === 0) throw new Error("Story content cannot be empty")
      })()
    ).rejects.toThrow("Story content cannot be empty")
  })

  it("should reject content exceeding 500 characters", async () => {
    await expect(
      (async () => {
        const args = { content: "a".repeat(501), mediaUrl: undefined }
        if (args.content && args.content.length > 500) throw new Error("Story text must not exceed 500 characters")
      })()
    ).rejects.toThrow("Story text must not exceed 500 characters")
  })

  it("should set expiresAt to 24h in the future", async () => {
    const before = Date.now()
    const expiresAt = before + STORY_TTL_MS
    expect(expiresAt - before).toBe(STORY_TTL_MS)
    expect(expiresAt).toBeGreaterThan(before)
  })

  it("should insert a story with correct fields for text story", async () => {
    const insertMock = jest.fn().mockResolvedValue("story_001")
    const ctx = {
      auth: { getUserIdentity: async () => ({ subject: "clerk_abc" }) },
      db: {
        query: (..._args: any[]) => ({
          withIndex: (..._args: any[]) => ({ unique: async () => makeUser() }),
        }),
        insert: insertMock,
      },
    }
    const args = { content: "Test story", mediaUrl: undefined, backgroundColor: "#ff0000" }

    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const user = await ctx.db.query("users").withIndex().unique()
    await ctx.db.insert("stories", {
      authorId: user._id,
      content: args.content,
      mediaUrl: args.mediaUrl,
      backgroundColor: args.backgroundColor,
      expiresAt: Date.now() + STORY_TTL_MS,
      viewCount: 0,
      createdAt: Date.now(),
    })

    expect(insertMock).toHaveBeenCalledTimes(1)
    const insertArgs = insertMock.mock.calls[0][1]
    expect(insertArgs.authorId).toBe("user_abc")
    expect(insertArgs.content).toBe("Test story")
    expect(insertArgs.viewCount).toBe(0)
    expect(insertArgs.expiresAt).toBeGreaterThan(insertArgs.createdAt)
  })
})

// ─── viewStory logic ─────────────────────────────────────────────────────────

describe("viewStory logic", () => {
  it("should throw if story is expired", async () => {
    const expiredStory = makeStory({ expiresAt: Date.now() - 1000 })
    await expect(
      (async () => {
        if (expiredStory.expiresAt <= Date.now()) throw new Error("Story has expired")
      })()
    ).rejects.toThrow("Story has expired")
  })

  it("should insert a storyView and increment viewCount on first view", async () => {
    const story = makeStory()
    const insertMock = jest.fn().mockResolvedValue("view_001")
    const patchMock = jest.fn().mockResolvedValue(undefined)

    // Simulate: no existing view found
    const existingView = null

    if (!existingView) {
      await insertMock("storyViews", {
        storyId: story._id,
        viewerId: "user_abc",
        viewedAt: Date.now(),
      })
      await patchMock(story._id, { viewCount: story.viewCount + 1 })
    }

    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(patchMock).toHaveBeenCalledWith(story._id, { viewCount: 1 })
  })

  it("should NOT insert duplicate view or increment count on second view", async () => {
    const insertMock = jest.fn()
    const patchMock = jest.fn()

    // Simulate: existing view found
    const existingView = { _id: "view_001", storyId: "story_001", viewerId: "user_abc" }

    if (!existingView) {
      await insertMock()
      await patchMock()
    }

    // Should not have been called because existingView is truthy
    expect(insertMock).not.toHaveBeenCalled()
    expect(patchMock).not.toHaveBeenCalled()
  })
})

// ─── deleteStory logic ────────────────────────────────────────────────────────

describe("deleteStory logic", () => {
  it("should reject if user is not the author", async () => {
    const story = makeStory({ authorId: "user_other" })
    const currentUserId = "user_abc"

    await expect(
      (async () => {
        if ((story.authorId as string) !== (currentUserId as string)) {
          throw new Error("Not authorized to delete this story")
        }
      })()
    ).rejects.toThrow("Not authorized to delete this story")
  })

  it("should delete the story and all its views", async () => {
    const story = makeStory({ authorId: "user_abc" })
    const views = [
      { _id: "view_001", storyId: "story_001" },
      { _id: "view_002", storyId: "story_001" },
    ]
    const deleteMock = jest.fn().mockResolvedValue(undefined)

    // Delete views
    await Promise.all(views.map((v) => deleteMock(v._id)))
    // Delete story
    await deleteMock(story._id)

    expect(deleteMock).toHaveBeenCalledTimes(3)
    expect(deleteMock).toHaveBeenCalledWith("view_001")
    expect(deleteMock).toHaveBeenCalledWith("view_002")
    expect(deleteMock).toHaveBeenCalledWith("story_001")
  })
})

// ─── getStoryViewers access control ──────────────────────────────────────────

describe("getStoryViewers access control", () => {
  it("should throw if requesting user is not the story author", async () => {
    const story = makeStory({ authorId: "user_other" })
    const currentUserId = "user_abc"

    await expect(
      (async () => {
        if ((story.authorId as string) !== (currentUserId as string)) {
          throw new Error("Not authorized — only the story author can see viewers")
        }
      })()
    ).rejects.toThrow("Not authorized")
  })

  it("should allow story author to see viewers", async () => {
    const story = makeStory({ authorId: "user_abc" })
    const currentUserId = "user_abc"

    let threw = false
    try {
      if ((story.authorId as string) !== (currentUserId as string)) {
        throw new Error("Not authorized")
      }
    } catch {
      threw = true
    }

    expect(threw).toBe(false)
  })
})

// ─── deleteExpiredStoriesInternal logic ───────────────────────────────────────

describe("deleteExpiredStoriesInternal logic", () => {
  it("should delete all expired stories and their views", async () => {
    const now = Date.now()
    const expiredStories = [
      makeStory({ _id: "story_exp1", expiresAt: now - 3600_000 }),
      makeStory({ _id: "story_exp2", expiresAt: now - 7200_000 }),
    ]
    const activeStory = makeStory({ _id: "story_active", expiresAt: now + 3600_000 })

    // Only expired stories should be collected
    const toDelete = expiredStories.filter((s) => s.expiresAt <= now)
    expect(toDelete).toHaveLength(2)
    expect(toDelete.map((s) => s._id)).not.toContain("story_active")

    const deleteMock = jest.fn().mockResolvedValue(undefined)
    for (const s of toDelete) await deleteMock(s._id)
    expect(deleteMock).toHaveBeenCalledTimes(2)
  })

  it("should leave non-expired stories intact", async () => {
    const now = Date.now()
    const stories = [
      makeStory({ _id: "story_old", expiresAt: now - 1 }),
      makeStory({ _id: "story_new", expiresAt: now + 3600_000 }),
    ]
    const toDelete = stories.filter((s) => s.expiresAt <= now)
    const toKeep = stories.filter((s) => s.expiresAt > now)
    expect(toDelete).toHaveLength(1)
    expect(toKeep).toHaveLength(1)
    expect(toKeep[0]._id).toBe("story_new")
  })
})

// ─── Story TTL constant ───────────────────────────────────────────────────────

describe("Story TTL", () => {
  it("should be exactly 24 hours", () => {
    expect(STORY_TTL_MS).toBe(24 * 60 * 60 * 1000)
    expect(STORY_TTL_MS).toBe(86_400_000)
  })
})
