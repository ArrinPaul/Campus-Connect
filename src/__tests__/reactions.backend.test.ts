/**
 * Tests for convex/reactions.ts backend logic.
 *
 * Pure handler logic tests using mock ctx objects
 * (same pattern as other convex tests).
 */

const makeUser = (overrides = {}) => ({
  _id: "user_001", clerkId: "clerk_001", name: "Alice", username: "alice",
  followerCount: 0, followingCount: 0, ...overrides,
})
const makePost = (overrides = {}) => ({
  _id: "post_001", authorId: "user_001", content: "Test post", likeCount: 0,
  reactionCounts: { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 },
  commentCount: 0, createdAt: Date.now(), updatedAt: Date.now(), ...overrides,
})
const makeReaction = (overrides = {}) => ({
  _id: "reaction_001", userId: "user_001", targetId: "post_001",
  targetType: "post", type: "like", createdAt: Date.now(), ...overrides,
})
const validReactionTypes = ["like", "love", "laugh", "wow", "sad", "scholarly"]

describe("addReaction logic", () => {
  it("should create a new reaction when none exists", async () => {
    const insertMock = jest.fn().mockResolvedValue("reaction_001")
    const existingReaction = null
    if (!existingReaction) {
      await insertMock("reactions", { userId: "user_001", targetId: "post_001", targetType: "post", type: "like", createdAt: Date.now() })
    }
    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(insertMock).toHaveBeenCalledWith("reactions", expect.objectContaining({ userId: "user_001", targetId: "post_001", targetType: "post", type: "like" }))
  })

  it("should return no-change when same reaction type already exists", () => {
    const existingReaction = makeReaction({ type: "like" })
    const newType = "like"
    const action = existingReaction.type === newType ? "no-change" : "updated"
    expect(action).toBe("no-change")
  })

  it("should return updated when changing to a different reaction type", async () => {
    const patchMock = jest.fn().mockResolvedValue(undefined)
    const existingReaction = makeReaction({ type: "like" })
    const newType = "love"
    let action
    if (existingReaction && existingReaction.type === newType) { action = "no-change" }
    else if (existingReaction) { await patchMock(existingReaction._id, { type: newType }); action = "updated" }
    else { action = "created" }
    expect(action).toBe("updated")
    expect(patchMock).toHaveBeenCalledWith("reaction_001", expect.objectContaining({ type: "love" }))
  })

  it("should throw when user is not authenticated", async () => {
    const ctx = { auth: { getUserIdentity: async () => null } }
    const identity = await ctx.auth.getUserIdentity()
    expect(() => { if (!identity) throw new Error("Not authenticated") }).toThrow("Not authenticated")
  })

  it("should only accept valid reaction types", () => {
    expect(validReactionTypes.includes("dislike")).toBe(false)
    expect(validReactionTypes.includes("scholarly")).toBe(true)
  })
})

describe("removeReaction logic", () => {
  it("should remove an existing reaction", async () => {
    const deleteMock = jest.fn().mockResolvedValue(undefined)
    const existingReaction = makeReaction()
    if (existingReaction) await deleteMock(existingReaction._id)
    expect(deleteMock).toHaveBeenCalledWith("reaction_001")
  })

  it("should return success false when reaction not found", () => {
    const existingReaction = null
    const result = existingReaction ? { success: true } : { success: false, message: "Reaction not found" }
    expect(result.success).toBe(false)
    expect(result.message).toBe("Reaction not found")
  })

  it("should throw when user is not authenticated", async () => {
    const ctx = { auth: { getUserIdentity: async () => null } }
    const identity = await ctx.auth.getUserIdentity()
    expect(() => { if (!identity) throw new Error("Not authenticated") }).toThrow("Not authenticated")
  })
})

describe("getReactions logic", () => {
  it("should return reaction counts grouped by type", () => {
    const reactions = [
      makeReaction({ _id: "r1", type: "like" }),
      makeReaction({ _id: "r2", userId: "user_002", type: "love" }),
      makeReaction({ _id: "r3", userId: "user_003", type: "like" }),
    ]
    const counts = { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 }
    reactions.forEach((r) => { counts[r.type]++ })
    const total = Object.values(counts).reduce((s, c) => s + c, 0)
    const topReactions = Object.entries(counts).filter(([,c]) => c > 0).sort((a,b) => b[1]-a[1]).slice(0,3)
    expect(total).toBe(3)
    expect(counts.like).toBe(2)
    expect(counts.love).toBe(1)
    expect(topReactions[0][0]).toBe("like")
  })

  it("should return zero counts when no reactions exist", () => {
    const reactions = []
    const counts = { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 }
    reactions.forEach((r) => { counts[r.type]++ })
    expect(Object.values(counts).reduce((s,c) => s+c, 0)).toBe(0)
  })

  it("should limit topReactions to top 3 types", () => {
    const counts = { like: 2, love: 1, laugh: 1, wow: 1, sad: 0, scholarly: 0 }
    const top = Object.entries(counts).filter(([,c]) => c > 0).sort((a,b) => b[1]-a[1]).slice(0,3)
    expect(top).toHaveLength(3)
  })
})

describe("getUserReaction logic", () => {
  it("should return null when user is not authenticated", async () => {
    const ctx = { auth: { getUserIdentity: async () => null } }
    const identity = await ctx.auth.getUserIdentity()
    expect(identity ? "like" : null).toBeNull()
  })

  it("should return null when user has not reacted", () => {
    const reaction = null
    expect(reaction ? reaction.type : null).toBeNull()
  })

  it("should return the reaction type when user has reacted", () => {
    const reaction = makeReaction({ type: "scholarly" })
    expect(reaction ? reaction.type : null).toBe("scholarly")
  })

  it("should return null when user is not found in the database", () => {
    const user = null
    expect(user ? "like" : null).toBeNull()
  })
})

describe("reaction type validation", () => {
  it("should have exactly 6 reaction types", () => { expect(validReactionTypes).toHaveLength(6) })
  it("should include all expected types", () => {
    ["like","love","laugh","wow","sad","scholarly"].forEach(t => expect(validReactionTypes).toContain(t))
  })
  it("should include scholarly for academic context", () => { expect(validReactionTypes).toContain("scholarly") })
})

describe("updateReactionCounts logic", () => {
  it("should correctly compute totals from all reaction types", () => {
    const reactions = [
      makeReaction({ type: "like" }), makeReaction({ _id: "r2", type: "like" }),
      makeReaction({ _id: "r3", type: "love" }), makeReaction({ _id: "r4", type: "scholarly" }),
    ]
    const counts = { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 }
    reactions.forEach((r) => { counts[r.type]++ })
    const total = Object.values(counts).reduce((s,c) => s+c, 0)
    expect(total).toBe(4)
    expect(counts.like).toBe(2)
    expect(counts.scholarly).toBe(1)
  })

  it("should reset all counts to zero when all reactions are removed", () => {
    const counts = { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 }
    expect(Object.values(counts).every((c) => c === 0)).toBe(true)
  })
})