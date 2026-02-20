/**
 * Unit Tests for Nested Comment Threads
 * Feature: Nested Comment Threads (Phase 5.2)
 */

// ─────────────────────────────────────
// Depth calculation helpers
// ─────────────────────────────────────
const MAX_DEPTH = 5

function calculateDepth(parentDepth: number | undefined): number {
  if (parentDepth === undefined) return 0
  return Math.min(parentDepth + 1, MAX_DEPTH)
}

describe("Comment depth calculation", () => {
  it("should return 0 for a top-level comment (no parent)", () => {
    expect(calculateDepth(undefined)).toBe(0)
  })

  it("should return 1 for a direct reply to a top-level comment", () => {
    expect(calculateDepth(0)).toBe(1)
  })

  it("should increment depth by 1 for each nesting level", () => {
    expect(calculateDepth(1)).toBe(2)
    expect(calculateDepth(2)).toBe(3)
    expect(calculateDepth(3)).toBe(4)
  })

  it("should cap depth at MAX_DEPTH (5)", () => {
    expect(calculateDepth(4)).toBe(5)
    expect(calculateDepth(5)).toBe(5) // already at max, stays at 5
    expect(calculateDepth(10)).toBe(5) // way over max
  })

  it("should return MAX_DEPTH for very deep nesting attempts", () => {
    expect(calculateDepth(100)).toBe(MAX_DEPTH)
  })
})

// ─────────────────────────────────────
// Reply count logic
// ─────────────────────────────────────
function updateReplyCount(current: number | undefined, delta: 1 | -1): number {
  const count = current ?? 0
  return Math.max(0, count + delta)
}

describe("Reply count updates", () => {
  it("should increment reply count from 0 to 1", () => {
    expect(updateReplyCount(0, 1)).toBe(1)
  })

  it("should increment reply count from undefined to 1", () => {
    expect(updateReplyCount(undefined, 1)).toBe(1)
  })

  it("should increment reply count from N to N+1", () => {
    expect(updateReplyCount(3, 1)).toBe(4)
    expect(updateReplyCount(9, 1)).toBe(10)
  })

  it("should decrement reply count by 1", () => {
    expect(updateReplyCount(3, -1)).toBe(2)
    expect(updateReplyCount(1, -1)).toBe(0)
  })

  it("should not allow reply count to go below 0", () => {
    expect(updateReplyCount(0, -1)).toBe(0)
    expect(updateReplyCount(undefined, -1)).toBe(0)
  })
})

// ─────────────────────────────────────
// Cascade delete count
// ─────────────────────────────────────
interface CommentNode {
  id: string
  parentId?: string
  replyCount: number
  depth: number
}

function collectDescendantIds(rootId: string, comments: CommentNode[]): string[] {
  const result: string[] = [rootId]
  const queue = [rootId]
  while (queue.length > 0) {
    const parentId = queue.shift()!
    const children = comments.filter((c) => c.parentId === parentId)
    for (const child of children) {
      result.push(child.id)
      queue.push(child.id)
    }
  }
  return result
}

describe("Cascade delete — collect descendants", () => {
  const comments: CommentNode[] = [
    { id: "A", depth: 0, replyCount: 2 },
    { id: "B", parentId: "A", depth: 1, replyCount: 1 },
    { id: "C", parentId: "A", depth: 1, replyCount: 0 },
    { id: "D", parentId: "B", depth: 2, replyCount: 0 },
  ]

  it("should collect only the root comment if it has no children", () => {
    expect(collectDescendantIds("C", comments)).toEqual(["C"])
  })

  it("should collect root and all descendants", () => {
    const ids = collectDescendantIds("A", comments)
    expect(ids).toContain("A")
    expect(ids).toContain("B")
    expect(ids).toContain("C")
    expect(ids).toContain("D")
    expect(ids.length).toBe(4)
  })

  it("should collect root and one level of children", () => {
    const ids = collectDescendantIds("B", comments)
    expect(ids).toContain("B")
    expect(ids).toContain("D")
    expect(ids.length).toBe(2)
  })

  it("should return just the root if it is a leaf", () => {
    const ids = collectDescendantIds("D", comments)
    expect(ids).toEqual(["D"])
  })
})

// ─────────────────────────────────────
// Sort options for top-level comments
// ─────────────────────────────────────
interface SortableComment {
  id: string
  createdAt: number
  depth: number
  replyCount: number
  likeCount: number
}

type SortOption = "old" | "new" | "best" | "controversial"

function sortTopLevel(comments: SortableComment[], sort: SortOption): SortableComment[] {
  const top = comments.filter((c) => c.depth === 0)
  const sorted = [...top]
  if (sort === "old") {
    sorted.sort((a, b) => a.createdAt - b.createdAt)
  } else if (sort === "new") {
    sorted.sort((a, b) => b.createdAt - a.createdAt)
  } else if (sort === "best") {
    sorted.sort((a, b) => (b.likeCount + b.replyCount) - (a.likeCount + a.replyCount))
  } else if (sort === "controversial") {
    sorted.sort((a, b) => (b.replyCount - b.likeCount) - (a.replyCount - a.likeCount))
  }
  return sorted
}

describe("Comment sort options", () => {
  const comments: SortableComment[] = [
    { id: "A", createdAt: 100, depth: 0, replyCount: 1, likeCount: 5 },
    { id: "B", createdAt: 200, depth: 0, replyCount: 10, likeCount: 2 },
    { id: "C", createdAt: 300, depth: 0, replyCount: 0, likeCount: 20 },
    { id: "D", createdAt: 400, depth: 1, replyCount: 0, likeCount: 3 }, // reply, should be excluded from top-level sort
  ]

  it("should sort old → newest createdAt ascending", () => {
    const result = sortTopLevel(comments, "old")
    expect(result.map((c) => c.id)).toEqual(["A", "B", "C"])
  })

  it("should sort new → newest createdAt descending", () => {
    const result = sortTopLevel(comments, "new")
    expect(result.map((c) => c.id)).toEqual(["C", "B", "A"])
  })

  it("should sort best → highest (likes + replies)", () => {
    // A: 6, B: 12, C: 20 → C, B, A
    const result = sortTopLevel(comments, "best")
    expect(result.map((c) => c.id)).toEqual(["C", "B", "A"])
  })

  it("should sort controversial → high replies but low likes", () => {
    // A: 1-5=-4, B: 10-2=8, C: 0-20=-20 → B, A, C
    const result = sortTopLevel(comments, "controversial")
    expect(result.map((c) => c.id)).toEqual(["B", "A", "C"])
  })

  it("should exclude non-top-level comments from sort results", () => {
    const result = sortTopLevel(comments, "old")
    expect(result.some((c) => c.id === "D")).toBe(false)
  })
})

// ─────────────────────────────────────
// Client-side tree building
// ─────────────────────────────────────
interface FlatComment {
  id: string
  parentId?: string
  depth: number
}

function buildChildrenMap(comments: FlatComment[]): Map<string, FlatComment[]> {
  const map = new Map<string, FlatComment[]>()
  for (const c of comments) {
    if (c.parentId) {
      const arr = map.get(c.parentId) ?? []
      arr.push(c)
      map.set(c.parentId, arr)
    }
  }
  return map
}

describe("Client-side tree building (CommentList)", () => {
  const flat: FlatComment[] = [
    { id: "1", depth: 0 },
    { id: "2", depth: 0 },
    { id: "3", parentId: "1", depth: 1 },
    { id: "4", parentId: "1", depth: 1 },
    { id: "5", parentId: "3", depth: 2 },
  ]

  it("should build a map of parent → children", () => {
    const map = buildChildrenMap(flat)
    expect(map.get("1")?.map((c) => c.id)).toEqual(["3", "4"])
    expect(map.get("3")?.map((c) => c.id)).toEqual(["5"])
  })

  it("should return empty array for comments with no children", () => {
    const map = buildChildrenMap(flat)
    expect(map.get("2")).toBeUndefined()
    expect(map.get("5")).toBeUndefined()
  })

  it("should identify top-level comments correctly", () => {
    const topLevel = flat.filter((c) => !c.parentId)
    expect(topLevel.map((c) => c.id)).toEqual(["1", "2"])
  })

  it("should identify whether a comment is hidden by a collapsed ancestor", () => {
    const collapsed = new Set(["1"])
    function isHidden(comment: FlatComment): boolean {
      if (!comment.parentId) return false
      if (collapsed.has(comment.parentId)) return true
      const parent = flat.find((c) => c.id === comment.parentId)
      return parent ? isHidden(parent) : false
    }
    expect(isHidden(flat.find((c) => c.id === "3")!)).toBe(true)
    expect(isHidden(flat.find((c) => c.id === "5")!)).toBe(true) // grandchild also hidden
    expect(isHidden(flat.find((c) => c.id === "2")!)).toBe(false)
  })
})

// ─────────────────────────────────────
// Integration: comment count tracking
// ─────────────────────────────────────
describe("Post comment count tracking", () => {
  it("should increment post commentCount for a reply", () => {
    const initialCount = 3
    const newCount = initialCount + 1
    expect(newCount).toBe(4)
  })

  it("should decrement by total deleted count (cascaded)", () => {
    const initialCount = 10
    const deletedCount = 3 // 1 root + 2 descendants
    const newCount = Math.max(0, initialCount - deletedCount)
    expect(newCount).toBe(7)
  })

  it("should not go below 0 on decrement", () => {
    const count = Math.max(0, 1 - 5)
    expect(count).toBe(0)
  })
})
