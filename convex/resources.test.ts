/**
 * Study Resources — Unit Tests
 *
 * Tests pure validation/filtering/sorting logic from convex/resources.ts
 */

// ─── Extracted helpers ──────────────────────────────────────────

function validateResourceTitle(title: string) {
  if (!title.trim()) throw new Error("Title cannot be empty")
  if (title.length > 200) throw new Error("Title must not exceed 200 characters")
  return title.trim()
}

function validateDescription(desc: string) {
  if (desc.length > 3000) throw new Error("Description must not exceed 3000 characters")
  return desc.trim()
}

function validateCourse(course: string) {
  if (!course.trim()) throw new Error("Course cannot be empty")
  if (course.length > 100) throw new Error("Course must not exceed 100 characters")
  return course.trim()
}

function validateSubject(subject: string) {
  if (subject.length > 100) throw new Error("Subject must not exceed 100 characters")
  return subject.trim()
}

function validateRating(rating: number) {
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5")
  if (!Number.isInteger(rating)) throw new Error("Rating must be a whole number")
  return rating
}

function calculateNewRating(currentRating: number, currentCount: number, newRating: number) {
  const newCount = currentCount + 1
  const avg = ((currentRating * currentCount) + newRating) / newCount
  return { rating: Math.round(avg * 100) / 100, ratingCount: newCount }
}

type Resource = {
  _id: string
  title: string
  description: string
  course: string
  subject?: string
  rating: number
  ratingCount: number
  downloadCount: number
  createdAt: number
}

function searchResources(resources: Resource[], opts: { course?: string; query?: string; limit?: number }) {
  const limit = opts.limit ?? 20

  let filtered = resources
  if (opts.course) {
    filtered = filtered.filter((r) => r.course === opts.course)
  }

  const q = opts.query?.toLowerCase().trim()
  if (q) {
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.course.toLowerCase().includes(q) ||
        (r.subject && r.subject.toLowerCase().includes(q))
    )
  }

  filtered.sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt)

  return filtered.slice(0, limit)
}

// ─── Test data ──────────────────────────────────────────────────

const sampleResources: Resource[] = [
  {
    _id: "r1",
    title: "Data Structures Notes",
    description: "Comprehensive notes covering arrays, trees, graphs",
    course: "CS101",
    subject: "Computer Science",
    rating: 4.5,
    ratingCount: 10,
    downloadCount: 50,
    createdAt: Date.now() - 1000,
  },
  {
    _id: "r2",
    title: "Calculus Cheat Sheet",
    description: "Quick reference for derivatives and integrals",
    course: "MATH201",
    subject: "Mathematics",
    rating: 4.8,
    ratingCount: 25,
    downloadCount: 100,
    createdAt: Date.now() - 2000,
  },
  {
    _id: "r3",
    title: "Physics Lab Manual",
    description: "Lab procedures and formulas for mechanics experiments",
    course: "PHY101",
    subject: "Physics",
    rating: 3.5,
    ratingCount: 5,
    downloadCount: 20,
    createdAt: Date.now() - 3000,
  },
  {
    _id: "r4",
    title: "Algorithm Design Textbook Summary",
    description: "Summary of key algorithms including sorting and dynamic programming",
    course: "CS101",
    subject: "Computer Science",
    rating: 4.2,
    ratingCount: 8,
    downloadCount: 35,
    createdAt: Date.now() - 4000,
  },
]

// ─── Tests ──────────────────────────────────────────────────────

describe("Resources: Title Validation", () => {
  test("rejects empty title", () => {
    expect(() => validateResourceTitle("")).toThrow("Title cannot be empty")
  })

  test("rejects whitespace-only", () => {
    expect(() => validateResourceTitle("   ")).toThrow("Title cannot be empty")
  })

  test("rejects title > 200 chars", () => {
    expect(() => validateResourceTitle("A".repeat(201))).toThrow("Title must not exceed 200 characters")
  })

  test("trims valid title", () => {
    expect(validateResourceTitle("  Notes  ")).toBe("Notes")
  })
})

describe("Resources: Description Validation", () => {
  test("rejects description > 3000 chars", () => {
    expect(() => validateDescription("D".repeat(3001))).toThrow("Description must not exceed 3000 characters")
  })

  test("accepts 3000 char description", () => {
    expect(validateDescription("D".repeat(3000))).toHaveLength(3000)
  })
})

describe("Resources: Course Validation", () => {
  test("rejects empty course", () => {
    expect(() => validateCourse("")).toThrow("Course cannot be empty")
  })

  test("rejects course > 100 chars", () => {
    expect(() => validateCourse("C".repeat(101))).toThrow("Course must not exceed 100 characters")
  })

  test("trims valid course", () => {
    expect(validateCourse("  CS101  ")).toBe("CS101")
  })
})

describe("Resources: Subject Validation", () => {
  test("rejects subject > 100 chars", () => {
    expect(() => validateSubject("S".repeat(101))).toThrow("Subject must not exceed 100 characters")
  })

  test("trims valid subject", () => {
    expect(validateSubject("  Physics  ")).toBe("Physics")
  })
})

describe("Resources: Rating Validation", () => {
  test("rejects rating < 1", () => {
    expect(() => validateRating(0)).toThrow("Rating must be between 1 and 5")
  })

  test("rejects rating > 5", () => {
    expect(() => validateRating(6)).toThrow("Rating must be between 1 and 5")
  })

  test("rejects non-integer rating", () => {
    expect(() => validateRating(3.5)).toThrow("Rating must be a whole number")
  })

  test("accepts valid ratings 1-5", () => {
    for (let i = 1; i <= 5; i++) {
      expect(validateRating(i)).toBe(i)
    }
  })
})

describe("Resources: Rating Calculation", () => {
  test("first rating sets the value", () => {
    const result = calculateNewRating(0, 0, 5)
    expect(result.rating).toBe(5)
    expect(result.ratingCount).toBe(1)
  })

  test("averages correctly with existing ratings", () => {
    // Current: 4.0 with 4 ratings. New: 5. Expected: (4*4 + 5) / 5 = 4.2
    const result = calculateNewRating(4.0, 4, 5)
    expect(result.rating).toBe(4.2)
    expect(result.ratingCount).toBe(5)
  })

  test("rounds to 2 decimal places", () => {
    // Current: 3.0 with 2 ratings. New: 5. Expected: (6+5)/3 = 3.666... → 3.67
    const result = calculateNewRating(3.0, 2, 5)
    expect(result.rating).toBe(3.67)
  })
})

describe("Resources: Search — Course Filter", () => {
  test("filters by course", () => {
    const results = searchResources(sampleResources, { course: "CS101" })
    expect(results).toHaveLength(2)
    expect(results.every((r) => r.course === "CS101")).toBe(true)
  })

  test("returns empty for non-matching course", () => {
    const results = searchResources(sampleResources, { course: "BIO202" })
    expect(results).toHaveLength(0)
  })
})

describe("Resources: Search — Text Query", () => {
  test("searches by title", () => {
    const results = searchResources(sampleResources, { query: "calculus" })
    expect(results).toHaveLength(1)
    expect(results[0]._id).toBe("r2")
  })

  test("searches by description", () => {
    const results = searchResources(sampleResources, { query: "sorting" })
    expect(results).toHaveLength(1)
    expect(results[0]._id).toBe("r4")
  })

  test("searches by subject", () => {
    const results = searchResources(sampleResources, { query: "physics" })
    expect(results).toHaveLength(1)
    expect(results[0]._id).toBe("r3")
  })

  test("search is case-insensitive", () => {
    const results = searchResources(sampleResources, { query: "DATA STRUCTURES" })
    expect(results).toHaveLength(1)
  })
})

describe("Resources: Sorting", () => {
  test("sorts by rating desc then by recency", () => {
    const results = searchResources(sampleResources, {})
    expect(results[0]._id).toBe("r2") // rating 4.8
    expect(results[1]._id).toBe("r1") // rating 4.5
    expect(results[2]._id).toBe("r4") // rating 4.2
    expect(results[3]._id).toBe("r3") // rating 3.5
  })
})

describe("Resources: Limit", () => {
  test("limits results", () => {
    const results = searchResources(sampleResources, { limit: 2 })
    expect(results).toHaveLength(2)
  })
})
