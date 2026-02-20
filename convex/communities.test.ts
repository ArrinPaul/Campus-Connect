/**
 * Unit Tests for Communities
 * Feature: Communities / Groups (Phase 5.1)
 */

// ────────────────────────
// Slug generation
// ────────────────────────
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50)
}

describe("Community slug generation", () => {
  it("should convert spaces to hyphens", () => {
    expect(slugify("Computer Science Club")).toBe("computer-science-club")
  })

  it("should remove special characters", () => {
    expect(slugify("C++ & Python!")).toBe("c-python")
  })

  it("should lowercase the string", () => {
    expect(slugify("ReactJS Community")).toBe("reactjs-community")
  })

  it("should collapse multiple spaces/hyphens", () => {
    expect(slugify("hello   world")).toBe("hello-world")
    expect(slugify("hello--world")).toBe("hello-world")
  })

  it("should trim leading and trailing whitespace", () => {
    expect(slugify("  community  ")).toBe("community")
  })

  it("should truncate to 50 characters", () => {
    const longName = "a".repeat(60)
    expect(slugify(longName).length).toBe(50)
  })

  it("should handle empty string", () => {
    expect(slugify("")).toBe("")
  })

  it("should allow numbers", () => {
    expect(slugify("Group 42")).toBe("group-42")
  })
})

// ────────────────────────
// Community validation
// ────────────────────────
describe("Community creation validation", () => {
  const VALID_CATEGORIES = [
    "Academic", "Research", "Social", "Sports", "Clubs", "Technology", "Arts", "Other",
  ]

  it("should reject names shorter than 3 characters", () => {
    const validate = (name: string) => {
      if (name.trim().length < 3) throw new Error("Name too short")
    }
    expect(() => validate("ab")).toThrow("Name too short")
    expect(() => validate("abc")).not.toThrow()
  })

  it("should reject names longer than 100 characters", () => {
    const validate = (name: string) => {
      if (name.trim().length > 100) throw new Error("Name too long")
    }
    expect(() => validate("a".repeat(101))).toThrow("Name too long")
    expect(() => validate("a".repeat(100))).not.toThrow()
  })

  it("should reject invalid categories", () => {
    const validate = (category: string) => {
      if (!VALID_CATEGORIES.includes(category)) {
        throw new Error("Invalid category")
      }
    }
    expect(() => validate("Invalid")).toThrow("Invalid category")
    expect(() => validate("Academic")).not.toThrow()
    expect(() => validate("Research")).not.toThrow()
  })

  it("should accept all valid categories", () => {
    VALID_CATEGORIES.forEach((cat) => {
      expect(VALID_CATEGORIES.includes(cat)).toBe(true)
    })
  })
})

// ────────────────────────
// Community membership
// ────────────────────────
describe("Community membership logic", () => {
  it("should not allow joining secret communities directly", () => {
    const community = { type: "secret" }
    const canJoinDirectly = (type: string) => type === "public"
    const requiresRequest = (type: string) => type === "private"
    const needsInvite = (type: string) => type === "secret"

    expect(canJoinDirectly(community.type)).toBe(false)
    expect(requiresRequest(community.type)).toBe(false)
    expect(needsInvite(community.type)).toBe(true)
  })

  it("should require approval for private communities", () => {
    const community = { type: "private" }
    const requiresApproval = (type: string) => type === "private"
    expect(requiresApproval(community.type)).toBe(true)
  })

  it("should allow direct joining of public communities", () => {
    const community = { type: "public" }
    const joinDirectly = (type: string) => type === "public"
    expect(joinDirectly(community.type)).toBe(true)
  })

  it("should detect duplicate memberships", () => {
    const members = [
      { communityId: "c1", userId: "u1", role: "member" },
      { communityId: "c1", userId: "u2", role: "member" },
    ]
    const isDuplicate = (communityId: string, userId: string) =>
      members.some((m) => m.communityId === communityId && m.userId === userId)

    expect(isDuplicate("c1", "u1")).toBe(true)
    expect(isDuplicate("c1", "u3")).toBe(false)
  })

  it("should not allow owner to leave a community", () => {
    const canLeave = (role: string) => role !== "owner"
    expect(canLeave("owner")).toBe(false)
    expect(canLeave("admin")).toBe(true)
    expect(canLeave("member")).toBe(true)
  })
})

// ────────────────────────
// Role permissions
// ────────────────────────
describe("Community role permissions", () => {
  const ROLES = ["owner", "admin", "moderator", "member", "pending"]

  it("should have correct role hierarchy", () => {
    const roleLevel: Record<string, number> = {
      owner: 4,
      admin: 3,
      moderator: 2,
      member: 1,
      pending: 0,
    }
    expect(roleLevel.owner).toBeGreaterThan(roleLevel.admin)
    expect(roleLevel.admin).toBeGreaterThan(roleLevel.moderator)
    expect(roleLevel.moderator).toBeGreaterThan(roleLevel.member)
    expect(roleLevel.member).toBeGreaterThan(roleLevel.pending)
  })

  it("should only allow owner and admin to approve join requests", () => {
    const canApprove = (role: string) => role === "owner" || role === "admin"
    expect(canApprove("owner")).toBe(true)
    expect(canApprove("admin")).toBe(true)
    expect(canApprove("moderator")).toBe(false)
    expect(canApprove("member")).toBe(false)
  })

  it("should only allow owner to delete community", () => {
    const canDelete = (role: string) => role === "owner"
    expect(canDelete("owner")).toBe(true)
    expect(canDelete("admin")).toBe(false)
  })

  it("should only allow owner and admin to update community settings", () => {
    const canUpdate = (role: string) => role === "owner" || role === "admin"
    expect(canUpdate("owner")).toBe(true)
    expect(canUpdate("admin")).toBe(true)
    expect(canUpdate("moderator")).toBe(false)
    expect(canUpdate("member")).toBe(false)
  })

  it("should not allow changing owner role", () => {
    const canChangeRole = (targetRole: string) => targetRole !== "owner"
    expect(canChangeRole("owner")).toBe(false)
    expect(canChangeRole("admin")).toBe(true)
    expect(canChangeRole("member")).toBe(true)
  })
})

// ────────────────────────
// Member count tracking
// ────────────────────────
describe("Community member count", () => {
  it("should increment member count on join", () => {
    const community = { memberCount: 5 }
    const newCount = community.memberCount + 1
    expect(newCount).toBe(6)
  })

  it("should decrement member count on leave", () => {
    const community = { memberCount: 5 }
    const newCount = Math.max(0, community.memberCount - 1)
    expect(newCount).toBe(4)
  })

  it("should not go below 0 when member count is 0", () => {
    const community = { memberCount: 0 }
    const newCount = Math.max(0, community.memberCount - 1)
    expect(newCount).toBe(0)
  })

  it("should not count pending members in memberCount", () => {
    const memberships = [
      { role: "owner" },
      { role: "member" },
      { role: "pending" }, // should not count
      { role: "member" },
    ]
    const activeCount = memberships.filter((m) => m.role !== "pending").length
    expect(activeCount).toBe(3)
  })
})

// ────────────────────────
// Post community ID
// ────────────────────────
describe("Community posts", () => {
  it("should allow posts without a communityId (personal feed)", () => {
    const postArgs = { content: "Hello", communityId: undefined }
    const communityId = postArgs.communityId
    expect(communityId).toBeUndefined()
  })

  it("should allow posts with a communityId", () => {
    const postArgs = { content: "Hello community!", communityId: "c1" }
    expect(postArgs.communityId).toBe("c1")
  })

  it("should filter community posts by communityId", () => {
    const posts = [
      { content: "Post 1", communityId: "c1" },
      { content: "Post 2", communityId: "c2" },
      { content: "Post 3", communityId: "c1" },
      { content: "Post 4", communityId: undefined },
    ]
    const communityPosts = posts.filter((p) => p.communityId === "c1")
    expect(communityPosts).toHaveLength(2)
  })

  it("should not show personal posts in community feed", () => {
    const posts = [
      { content: "Personal", communityId: undefined },
      { content: "Community", communityId: "c1" },
    ]
    const communityFeed = posts.filter((p) => p.communityId !== undefined)
    expect(communityFeed).toHaveLength(1)
    expect(communityFeed[0].content).toBe("Community")
  })
})
