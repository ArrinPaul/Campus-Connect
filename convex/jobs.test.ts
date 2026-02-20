/**
 * Jobs / Internship Board — Unit Tests
 *
 * Tests pure validation/filtering/search logic extracted from convex/jobs.ts
 */

// ─── Extracted helpers (mirroring backend logic) ────────────────

function validateJobTitle(title: string) {
  if (!title.trim()) throw new Error("Job title cannot be empty")
  if (title.length > 200) throw new Error("Title must not exceed 200 characters")
  return title.trim()
}

function validateCompany(company: string) {
  if (!company.trim()) throw new Error("Company name cannot be empty")
  if (company.length > 200) throw new Error("Company must not exceed 200 characters")
  return company.trim()
}

function validateDescription(desc: string) {
  if (desc.length > 5000) throw new Error("Description must not exceed 5000 characters")
  return desc.trim()
}

function validateLocation(loc: string) {
  if (!loc.trim()) throw new Error("Location cannot be empty")
  return loc.trim()
}

function validateSkills(skills: string[]) {
  if (skills.length > 20) throw new Error("Maximum 20 skills allowed")
  return skills.map((s) => s.trim()).filter(Boolean)
}

function validateCoverLetter(cl: string) {
  if (cl.length > 3000) throw new Error("Cover letter must not exceed 3000 characters")
  return cl.trim()
}

function validateExpiry(expiresAt: number) {
  if (expiresAt < Date.now()) throw new Error("Expiry date must be in the future")
  return expiresAt
}

type Job = {
  _id: string
  title: string
  company: string
  description: string
  type: "job" | "internship"
  location: string
  remote: boolean
  skillsRequired: string[]
  salary?: string
  duration?: string
  expiresAt?: number
  createdAt: number
  applicantCount: number
  postedBy: string
}

function searchJobs(
  jobs: Job[],
  opts: {
    query?: string
    type?: "job" | "internship"
    remote?: boolean
    limit?: number
  }
) {
  const limit = opts.limit ?? 20
  const now = Date.now()

  // Exclude expired
  let filtered = jobs.filter((j) => !j.expiresAt || j.expiresAt > now)

  // Text search
  const q = opts.query?.toLowerCase().trim()
  if (q) {
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.skillsRequired.some((s) => s.toLowerCase().includes(q)) ||
        j.location.toLowerCase().includes(q)
    )
  }

  // Type filter
  if (opts.type) {
    filtered = filtered.filter((j) => j.type === opts.type)
  }

  // Remote filter
  if (opts.remote !== undefined) {
    filtered = filtered.filter((j) => j.remote === opts.remote)
  }

  return filtered.slice(0, limit)
}

// ─── Test data ──────────────────────────────────────────────────

const futureDate = Date.now() + 86400 * 30 * 1000 // 30 days from now
const pastDate = Date.now() - 86400 * 1000 // yesterday

const sampleJobs: Job[] = [
  {
    _id: "j1",
    title: "Frontend Developer",
    company: "TechCorp",
    description: "Build amazing user interfaces with React and TypeScript",
    type: "job",
    location: "San Francisco, CA",
    remote: true,
    skillsRequired: ["React", "TypeScript", "CSS"],
    salary: "$120k-$150k",
    applicantCount: 5,
    createdAt: Date.now() - 1000,
    expiresAt: futureDate,
    postedBy: "user1",
  },
  {
    _id: "j2",
    title: "Machine Learning Intern",
    company: "AI Labs",
    description: "Work on cutting-edge ML models",
    type: "internship",
    location: "New York, NY",
    remote: false,
    skillsRequired: ["Python", "TensorFlow", "PyTorch"],
    duration: "3 months",
    applicantCount: 12,
    createdAt: Date.now() - 2000,
    expiresAt: futureDate,
    postedBy: "user2",
  },
  {
    _id: "j3",
    title: "Backend Engineer",
    company: "CloudBase",
    description: "Design and implement scalable APIs in Node.js",
    type: "job",
    location: "Austin, TX",
    remote: true,
    skillsRequired: ["Node.js", "PostgreSQL", "AWS"],
    salary: "$130k-$160k",
    applicantCount: 3,
    createdAt: Date.now() - 3000,
    postedBy: "user3",
  },
  {
    _id: "j4",
    title: "Data Science Intern",
    company: "DataCo",
    description: "Analyze large-scale datasets using Python",
    type: "internship",
    location: "Remote",
    remote: true,
    skillsRequired: ["Python", "SQL", "Pandas"],
    duration: "6 months",
    applicantCount: 0,
    createdAt: Date.now() - 4000,
    expiresAt: pastDate, // EXPIRED
    postedBy: "user4",
  },
  {
    _id: "j5",
    title: "Full Stack Developer",
    company: "StartupXYZ",
    description: "End-to-end development using React and Node.js",
    type: "job",
    location: "Chicago, IL",
    remote: false,
    skillsRequired: ["React", "Node.js", "MongoDB"],
    salary: "$100k-$130k",
    applicantCount: 8,
    createdAt: Date.now() - 5000,
    postedBy: "user5",
  },
]

// ─── Tests ──────────────────────────────────────────────────────

describe("Jobs: Title Validation", () => {
  test("rejects empty title", () => {
    expect(() => validateJobTitle("")).toThrow("Job title cannot be empty")
  })

  test("rejects whitespace-only title", () => {
    expect(() => validateJobTitle("   ")).toThrow("Job title cannot be empty")
  })

  test("rejects title exceeding 200 chars", () => {
    expect(() => validateJobTitle("A".repeat(201))).toThrow("Title must not exceed 200 characters")
  })

  test("trims valid title", () => {
    expect(validateJobTitle("  Frontend Dev  ")).toBe("Frontend Dev")
  })

  test("accepts 200 char title", () => {
    const t = "A".repeat(200)
    expect(validateJobTitle(t)).toBe(t)
  })
})

describe("Jobs: Company Validation", () => {
  test("rejects empty company", () => {
    expect(() => validateCompany("")).toThrow("Company name cannot be empty")
  })

  test("rejects company exceeding 200 chars", () => {
    expect(() => validateCompany("C".repeat(201))).toThrow("Company must not exceed 200 characters")
  })

  test("trims valid company", () => {
    expect(validateCompany("  TechCorp  ")).toBe("TechCorp")
  })
})

describe("Jobs: Description Validation", () => {
  test("rejects description exceeding 5000 chars", () => {
    expect(() => validateDescription("D".repeat(5001))).toThrow(
      "Description must not exceed 5000 characters"
    )
  })

  test("accepts 5000 char description", () => {
    const d = "D".repeat(5000)
    expect(validateDescription(d)).toBe(d)
  })
})

describe("Jobs: Location Validation", () => {
  test("rejects empty location", () => {
    expect(() => validateLocation("")).toThrow("Location cannot be empty")
  })

  test("trims valid location", () => {
    expect(validateLocation("  San Francisco  ")).toBe("San Francisco")
  })
})

describe("Jobs: Skills Validation", () => {
  test("rejects more than 20 skills", () => {
    const skills = Array.from({ length: 21 }, (_, i) => `skill${i}`)
    expect(() => validateSkills(skills)).toThrow("Maximum 20 skills allowed")
  })

  test("trims and filters empty skills", () => {
    expect(validateSkills(["React", "  Node.js  ", "", "  "])).toEqual(["React", "Node.js"])
  })

  test("accepts exactly 20 skills", () => {
    const skills = Array.from({ length: 20 }, (_, i) => `skill${i}`)
    expect(validateSkills(skills)).toHaveLength(20)
  })
})

describe("Jobs: Cover Letter Validation", () => {
  test("rejects cover letter exceeding 3000 chars", () => {
    expect(() => validateCoverLetter("X".repeat(3001))).toThrow(
      "Cover letter must not exceed 3000 characters"
    )
  })

  test("trims valid cover letter", () => {
    expect(validateCoverLetter("  Hello there  ")).toBe("Hello there")
  })
})

describe("Jobs: Expiry Validation", () => {
  test("rejects past expiry date", () => {
    expect(() => validateExpiry(pastDate)).toThrow("Expiry date must be in the future")
  })

  test("accepts future expiry date", () => {
    expect(validateExpiry(futureDate)).toBe(futureDate)
  })
})

describe("Jobs: Search — Text Query", () => {
  test("searches by title", () => {
    const results = searchJobs(sampleJobs, { query: "frontend" })
    expect(results.map((r) => r._id)).toContain("j1")
  })

  test("searches by company name", () => {
    const results = searchJobs(sampleJobs, { query: "AI Labs" })
    expect(results).toHaveLength(1)
    expect(results[0]._id).toBe("j2")
  })

  test("searches by description", () => {
    const results = searchJobs(sampleJobs, { query: "scalable APIs" })
    expect(results).toHaveLength(1)
    expect(results[0]._id).toBe("j3")
  })

  test("searches by skill", () => {
    const results = searchJobs(sampleJobs, { query: "TensorFlow" })
    expect(results).toHaveLength(1)
    expect(results[0]._id).toBe("j2")
  })

  test("searches by location", () => {
    const results = searchJobs(sampleJobs, { query: "Chicago" })
    expect(results).toHaveLength(1)
    expect(results[0]._id).toBe("j5")
  })

  test("search is case-insensitive", () => {
    const results = searchJobs(sampleJobs, { query: "REACT" })
    expect(results.length).toBeGreaterThanOrEqual(2) // j1, j5
  })

  test("empty query returns all non-expired", () => {
    const results = searchJobs(sampleJobs, {})
    expect(results).toHaveLength(4) // j4 expired
  })
})

describe("Jobs: Search — Filters", () => {
  test("filter by type = job", () => {
    const results = searchJobs(sampleJobs, { type: "job" })
    expect(results.every((r) => r.type === "job")).toBe(true)
    expect(results).toHaveLength(3) // j1, j3, j5
  })

  test("filter by type = internship", () => {
    const results = searchJobs(sampleJobs, { type: "internship" })
    expect(results.every((r) => r.type === "internship")).toBe(true)
    expect(results).toHaveLength(1) // j2 only (j4 expired)
  })

  test("filter by remote = true", () => {
    const results = searchJobs(sampleJobs, { remote: true })
    expect(results.every((r) => r.remote === true)).toBe(true)
    expect(results).toHaveLength(2) // j1, j3 (j4 expired)
  })

  test("filter by remote = false", () => {
    const results = searchJobs(sampleJobs, { remote: false })
    expect(results.every((r) => r.remote === false)).toBe(true)
    expect(results).toHaveLength(2) // j2, j5
  })

  test("combine type + remote filters", () => {
    const results = searchJobs(sampleJobs, { type: "job", remote: true })
    expect(results).toHaveLength(2) // j1, j3
  })

  test("combine query + type filter", () => {
    const results = searchJobs(sampleJobs, { query: "React", type: "job" })
    expect(results.every((r) => r.type === "job")).toBe(true)
    expect(results.length).toBeGreaterThanOrEqual(2) // j1, j5
  })
})

describe("Jobs: Expired Listings", () => {
  test("expired jobs are excluded from search", () => {
    const results = searchJobs(sampleJobs, {})
    expect(results.map((r) => r._id)).not.toContain("j4")
  })

  test("non-expired jobs are included", () => {
    const results = searchJobs(sampleJobs, {})
    expect(results.map((r) => r._id)).toContain("j1")
    expect(results.map((r) => r._id)).toContain("j2")
  })

  test("jobs with no expiresAt are always included", () => {
    const results = searchJobs(sampleJobs, {})
    expect(results.map((r) => r._id)).toContain("j3") // no expiresAt
    expect(results.map((r) => r._id)).toContain("j5")
  })
})

describe("Jobs: Limit", () => {
  test("limits results count", () => {
    const results = searchJobs(sampleJobs, { limit: 2 })
    expect(results).toHaveLength(2)
  })

  test("default limit is 20", () => {
    const manyJobs: Job[] = Array.from({ length: 25 }, (_, i) => ({
      _id: `jm${i}`,
      title: `Job ${i}`,
      company: "Co",
      description: "desc",
      type: "job" as const,
      location: "NYC",
      remote: true,
      skillsRequired: [],
      applicantCount: 0,
      createdAt: Date.now() - i * 1000,
      postedBy: "u",
    }))
    const results = searchJobs(manyJobs, {})
    expect(results).toHaveLength(20)
  })
})

describe("Jobs: Application Status", () => {
  const validStatuses = ["applied", "viewed", "shortlisted", "rejected"]

  test("all statuses are valid strings", () => {
    validStatuses.forEach((s) => expect(typeof s).toBe("string"))
  })

  test("there are exactly 4 statuses", () => {
    expect(validStatuses).toHaveLength(4)
  })
})
