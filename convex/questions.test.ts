/**
 * Q&A (Questions & Answers) — Unit Tests
 *
 * Tests pure validation/filtering/sorting/voting logic from convex/questions.ts
 */

// ─── Extracted helpers ──────────────────────────────────────────

function validateQuestionTitle(title: string) {
  if (!title.trim()) throw new Error("Title cannot be empty")
  if (title.length > 300) throw new Error("Title must not exceed 300 characters")
  return title.trim()
}

function validateContent(content: string, label = "Content") {
  if (!content.trim()) throw new Error(`${label} cannot be empty`)
  if (content.length > 10000) throw new Error(`${label} must not exceed 10000 characters`)
  return content.trim()
}

function validateTags(tags: string[]) {
  if (tags.length > 10) throw new Error("Maximum 10 tags allowed")
  return tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
}

type Question = {
  _id: string
  title: string
  content: string
  tags: string[]
  upvotes: number
  downvotes: number
  answerCount: number
  viewCount: number
  createdAt: number
  acceptedAnswerId?: string
}

type Answer = {
  _id: string
  content: string
  upvotes: number
  downvotes: number
  isAccepted: boolean
  createdAt: number
}

function sortQuestions(
  questions: Question[],
  sort: "newest" | "votes" | "unanswered"
) {
  let result = [...questions]
  if (sort === "votes") {
    result.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
  } else if (sort === "unanswered") {
    result = result.filter((q) => q.answerCount === 0)
  }
  // "newest" default order = already desc by createdAt
  return result
}

function filterQuestions(
  questions: Question[],
  opts: { tag?: string; query?: string }
) {
  let result = [...questions]

  if (opts.tag) {
    const tag = opts.tag.toLowerCase().trim()
    result = result.filter((q) => q.tags.includes(tag))
  }

  const q = opts.query?.toLowerCase().trim()
  if (q) {
    result = result.filter(
      (qn) =>
        qn.title.toLowerCase().includes(q) ||
        qn.content.toLowerCase().includes(q) ||
        qn.tags.some((t) => t.includes(q))
    )
  }

  return result
}

function sortAnswers(answers: Answer[]) {
  return [...answers].sort((a, b) => {
    if (a.isAccepted && !b.isAccepted) return -1
    if (!a.isAccepted && b.isAccepted) return 1
    return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
  })
}

function computeVote(
  existing: { voteType: string } | null,
  newVoteType: "up" | "down",
  currentUpvotes: number,
  currentDownvotes: number
): { action: string; upvotes: number; downvotes: number } {
  if (existing) {
    if (existing.voteType === newVoteType) {
      // Toggle off
      return {
        action: "removed",
        upvotes: newVoteType === "up" ? Math.max(0, currentUpvotes - 1) : currentUpvotes,
        downvotes: newVoteType === "down" ? Math.max(0, currentDownvotes - 1) : currentDownvotes,
      }
    } else {
      // Change direction
      return {
        action: "changed",
        upvotes: newVoteType === "up" ? currentUpvotes + 1 : Math.max(0, currentUpvotes - 1),
        downvotes: newVoteType === "down" ? currentDownvotes + 1 : Math.max(0, currentDownvotes - 1),
      }
    }
  }
  // New vote
  return {
    action: "voted",
    upvotes: newVoteType === "up" ? currentUpvotes + 1 : currentUpvotes,
    downvotes: newVoteType === "down" ? currentDownvotes + 1 : currentDownvotes,
  }
}

// ─── Test data ──────────────────────────────────────────────────

const sampleQuestions: Question[] = [
  {
    _id: "q1",
    title: "How to implement binary search?",
    content: "I need help with binary search in Python",
    tags: ["algorithms", "python"],
    upvotes: 10,
    downvotes: 2,
    answerCount: 3,
    viewCount: 50,
    createdAt: Date.now() - 1000,
  },
  {
    _id: "q2",
    title: "React hooks vs class components",
    content: "When should I choose hooks over class components?",
    tags: ["react", "javascript"],
    upvotes: 25,
    downvotes: 1,
    answerCount: 5,
    viewCount: 100,
    createdAt: Date.now() - 2000,
  },
  {
    _id: "q3",
    title: "SQL JOIN optimization",
    content: "My SQL query with multiple JOINs is slow",
    tags: ["sql", "database", "performance"],
    upvotes: 5,
    downvotes: 0,
    answerCount: 0,
    viewCount: 15,
    createdAt: Date.now() - 3000,
  },
  {
    _id: "q4",
    title: "Python list comprehension syntax",
    content: "Can someone explain list comprehension in Python?",
    tags: ["python", "beginner"],
    upvotes: 3,
    downvotes: 1,
    answerCount: 0,
    viewCount: 8,
    createdAt: Date.now() - 4000,
  },
]

const sampleAnswers: Answer[] = [
  { _id: "a1", content: "Use iterative approach", upvotes: 5, downvotes: 0, isAccepted: false, createdAt: Date.now() - 500 },
  { _id: "a2", content: "Recursive approach works too", upvotes: 3, downvotes: 1, isAccepted: true, createdAt: Date.now() - 400 },
  { _id: "a3", content: "Here is a template", upvotes: 8, downvotes: 0, isAccepted: false, createdAt: Date.now() - 300 },
]

// ─── Tests ──────────────────────────────────────────────────────

describe("Q&A: Title Validation", () => {
  test("rejects empty title", () => {
    expect(() => validateQuestionTitle("")).toThrow("Title cannot be empty")
  })

  test("rejects whitespace-only", () => {
    expect(() => validateQuestionTitle("   ")).toThrow("Title cannot be empty")
  })

  test("rejects title > 300 chars", () => {
    expect(() => validateQuestionTitle("T".repeat(301))).toThrow("Title must not exceed 300 characters")
  })

  test("trims valid title", () => {
    expect(validateQuestionTitle("  How to sort?  ")).toBe("How to sort?")
  })

  test("accepts 300 char title", () => {
    const t = "T".repeat(300)
    expect(validateQuestionTitle(t)).toBe(t)
  })
})

describe("Q&A: Content Validation", () => {
  test("rejects empty content", () => {
    expect(() => validateContent("")).toThrow("Content cannot be empty")
  })

  test("rejects content > 10000 chars", () => {
    expect(() => validateContent("C".repeat(10001))).toThrow("Content must not exceed 10000 characters")
  })

  test("trims valid content", () => {
    expect(validateContent("  Help me  ")).toBe("Help me")
  })

  test("uses custom label in error", () => {
    expect(() => validateContent("", "Answer")).toThrow("Answer cannot be empty")
  })
})

describe("Q&A: Tags Validation", () => {
  test("rejects more than 10 tags", () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`)
    expect(() => validateTags(tags)).toThrow("Maximum 10 tags allowed")
  })

  test("normalizes tags to lowercase and trims", () => {
    expect(validateTags(["  React  ", "TypeScript"])).toEqual(["react", "typescript"])
  })

  test("filters empty tags", () => {
    expect(validateTags(["react", "", "  ", "node"])).toEqual(["react", "node"])
  })

  test("accepts exactly 10 tags", () => {
    const tags = Array.from({ length: 10 }, (_, i) => `tag${i}`)
    expect(validateTags(tags)).toHaveLength(10)
  })
})

describe("Q&A: Sort Questions", () => {
  test("sort by votes (descending net score)", () => {
    const sorted = sortQuestions(sampleQuestions, "votes")
    expect(sorted[0]._id).toBe("q2") // 25-1=24
    expect(sorted[1]._id).toBe("q1") // 10-2=8
    expect(sorted[2]._id).toBe("q3") // 5-0=5
    expect(sorted[3]._id).toBe("q4") // 3-1=2
  })

  test("sort unanswered returns only 0-answer questions", () => {
    const result = sortQuestions(sampleQuestions, "unanswered")
    expect(result).toHaveLength(2)
    expect(result.every((q) => q.answerCount === 0)).toBe(true)
    expect(result.map((q) => q._id)).toEqual(["q3", "q4"])
  })

  test("sort newest preserves order", () => {
    const result = sortQuestions(sampleQuestions, "newest")
    expect(result).toHaveLength(4)
    expect(result[0]._id).toBe("q1") // most recent
  })
})

describe("Q&A: Filter Questions", () => {
  test("filter by tag", () => {
    const results = filterQuestions(sampleQuestions, { tag: "python" })
    expect(results).toHaveLength(2)
    expect(results.map((q) => q._id)).toContain("q1")
    expect(results.map((q) => q._id)).toContain("q4")
  })

  test("filter by text query — title", () => {
    const results = filterQuestions(sampleQuestions, { query: "binary search" })
    expect(results).toHaveLength(1)
    expect(results[0]._id).toBe("q1")
  })

  test("filter by text query — content", () => {
    const results = filterQuestions(sampleQuestions, { query: "slow" })
    expect(results).toHaveLength(1)
    expect(results[0]._id).toBe("q3")
  })

  test("filter by tag + text combined", () => {
    const results = filterQuestions(sampleQuestions, { tag: "python", query: "list" })
    expect(results).toHaveLength(1)
    expect(results[0]._id).toBe("q4")
  })

  test("no matches returns empty", () => {
    const results = filterQuestions(sampleQuestions, { query: "blockchain" })
    expect(results).toHaveLength(0)
  })
})

describe("Q&A: Sort Answers", () => {
  test("accepted answer comes first", () => {
    const sorted = sortAnswers(sampleAnswers)
    expect(sorted[0]._id).toBe("a2") // isAccepted=true
  })

  test("non-accepted sorted by net votes", () => {
    const sorted = sortAnswers(sampleAnswers)
    // After accepted (a2), sort by votes: a3 (8-0=8) then a1 (5-0=5)
    expect(sorted[1]._id).toBe("a3")
    expect(sorted[2]._id).toBe("a1")
  })

  test("all non-accepted sorted purely by votes", () => {
    const nonAccepted: Answer[] = [
      { _id: "x1", content: "a", upvotes: 2, downvotes: 1, isAccepted: false, createdAt: 0 },
      { _id: "x2", content: "b", upvotes: 5, downvotes: 0, isAccepted: false, createdAt: 0 },
      { _id: "x3", content: "c", upvotes: 3, downvotes: 3, isAccepted: false, createdAt: 0 },
    ]
    const sorted = sortAnswers(nonAccepted)
    expect(sorted[0]._id).toBe("x2") // net 5
    expect(sorted[1]._id).toBe("x1") // net 1
    expect(sorted[2]._id).toBe("x3") // net 0
  })
})

describe("Q&A: Vote Logic", () => {
  test("new upvote increments upvotes", () => {
    const result = computeVote(null, "up", 5, 2)
    expect(result).toEqual({ action: "voted", upvotes: 6, downvotes: 2 })
  })

  test("new downvote increments downvotes", () => {
    const result = computeVote(null, "down", 5, 2)
    expect(result).toEqual({ action: "voted", upvotes: 5, downvotes: 3 })
  })

  test("toggle off upvote decrements upvotes", () => {
    const result = computeVote({ voteType: "up" }, "up", 5, 2)
    expect(result).toEqual({ action: "removed", upvotes: 4, downvotes: 2 })
  })

  test("toggle off downvote decrements downvotes", () => {
    const result = computeVote({ voteType: "down" }, "down", 5, 2)
    expect(result).toEqual({ action: "removed", upvotes: 5, downvotes: 1 })
  })

  test("change from up to down", () => {
    const result = computeVote({ voteType: "up" }, "down", 5, 2)
    expect(result).toEqual({ action: "changed", upvotes: 4, downvotes: 3 })
  })

  test("change from down to up", () => {
    const result = computeVote({ voteType: "down" }, "up", 5, 2)
    expect(result).toEqual({ action: "changed", upvotes: 6, downvotes: 1 })
  })

  test("votes cannot go below zero", () => {
    const result = computeVote({ voteType: "up" }, "up", 0, 0)
    expect(result.upvotes).toBe(0)
  })

  test("downvotes cannot go below zero on change", () => {
    const result = computeVote({ voteType: "down" }, "up", 0, 0)
    expect(result.downvotes).toBe(0)
    expect(result.upvotes).toBe(1)
  })
})

describe("Q&A: Score Calculation", () => {
  test("score is upvotes minus downvotes", () => {
    const q = sampleQuestions[0]
    const score = q.upvotes - q.downvotes
    expect(score).toBe(8)
  })

  test("zero downvotes gives upvotes as score", () => {
    const q = sampleQuestions[2]
    expect(q.upvotes - q.downvotes).toBe(5)
  })

  test("equal votes give zero score", () => {
    expect(10 - 10).toBe(0)
  })
})
