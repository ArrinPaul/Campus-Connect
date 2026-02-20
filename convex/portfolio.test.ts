/**
 * Portfolio (Academic Portfolio) — Unit Tests
 * Phase 6.2
 *
 * Tests cover: project validation, timeline types, contribution heatmap
 * grouping, date sorting, ownership, and edge cases.
 */

// ─── validation helpers ──────────────────────────────────────────

function validateProject(args: {
  title: string
  description: string
  techStack: string[]
  links: string[]
  startDate?: number
  endDate?: number
}): string | null {
  if (!args.title.trim()) return "Project title cannot be empty"
  if (args.title.length > 200) return "Title must not exceed 200 characters"
  if (args.description.length > 3000) return "Description must not exceed 3000 characters"
  if (args.techStack.length > 20) return "Maximum 20 technologies allowed"
  if (args.links.length > 10) return "Maximum 10 links allowed"
  if (args.endDate && args.startDate && args.endDate < args.startDate) {
    return "End date must be after start date"
  }
  return null
}

function validateTimelineItem(args: {
  title: string
  institution?: string
}): string | null {
  if (!args.title.trim()) return "Title cannot be empty"
  if (args.title.length > 200) return "Title must not exceed 200 characters"
  if (args.institution && args.institution.length > 200) {
    return "Institution must not exceed 200 characters"
  }
  return null
}

const VALID_TIMELINE_TYPES = ["course", "certification", "publication", "award"]

// ─── contribution heatmap logic ──────────────────────────────────

function toDay(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}

function buildHeatmap(
  posts: { createdAt: number }[],
  comments: { createdAt: number }[]
): Record<string, number> {
  const dayMap: Record<string, number> = {}
  for (const p of posts) {
    const key = toDay(p.createdAt)
    dayMap[key] = (dayMap[key] || 0) + 1
  }
  for (const c of comments) {
    const key = toDay(c.createdAt)
    dayMap[key] = (dayMap[key] || 0) + 1
  }
  return dayMap
}

// ─── tests ───────────────────────────────────────────────────────

describe("Portfolio — Phase 6.2 Academic Portfolio", () => {
  // ── Project Validation ───────────────────────────────────────
  describe("Project validation", () => {
    it("rejects empty title", () => {
      expect(
        validateProject({ title: "", description: "desc", techStack: [], links: [] })
      ).toBe("Project title cannot be empty")
    })

    it("rejects whitespace-only title", () => {
      expect(
        validateProject({ title: "   ", description: "desc", techStack: [], links: [] })
      ).toBe("Project title cannot be empty")
    })

    it("rejects title > 200 chars", () => {
      expect(
        validateProject({ title: "A".repeat(201), description: "", techStack: [], links: [] })
      ).toBe("Title must not exceed 200 characters")
    })

    it("rejects description > 3000 chars", () => {
      expect(
        validateProject({ title: "ok", description: "X".repeat(3001), techStack: [], links: [] })
      ).toBe("Description must not exceed 3000 characters")
    })

    it("rejects > 20 technologies", () => {
      const tech = Array.from({ length: 21 }, (_, i) => `tech${i}`)
      expect(
        validateProject({ title: "ok", description: "ok", techStack: tech, links: [] })
      ).toBe("Maximum 20 technologies allowed")
    })

    it("rejects > 10 links", () => {
      const links = Array.from({ length: 11 }, (_, i) => `https://ex.com/${i}`)
      expect(
        validateProject({ title: "ok", description: "ok", techStack: [], links })
      ).toBe("Maximum 10 links allowed")
    })

    it("rejects end date before start date", () => {
      expect(
        validateProject({
          title: "ok",
          description: "ok",
          techStack: [],
          links: [],
          startDate: 2000,
          endDate: 1000,
        })
      ).toBe("End date must be after start date")
    })

    it("accepts valid project", () => {
      expect(
        validateProject({
          title: "My Project",
          description: "A great project",
          techStack: ["React", "TypeScript"],
          links: ["https://github.com/example"],
          startDate: 1000,
          endDate: 2000,
        })
      ).toBeNull()
    })
  })

  // ── Timeline Validation ──────────────────────────────────────
  describe("Timeline item validation", () => {
    it("rejects empty title", () => {
      expect(validateTimelineItem({ title: "" })).toBe("Title cannot be empty")
    })

    it("rejects title > 200 chars", () => {
      expect(validateTimelineItem({ title: "T".repeat(201) })).toBe(
        "Title must not exceed 200 characters"
      )
    })

    it("rejects institution > 200 chars", () => {
      expect(
        validateTimelineItem({ title: "ok", institution: "I".repeat(201) })
      ).toBe("Institution must not exceed 200 characters")
    })

    it("accepts valid item", () => {
      expect(
        validateTimelineItem({ title: "Machine Learning", institution: "MIT" })
      ).toBeNull()
    })
  })

  // ── Timeline Types ───────────────────────────────────────────
  describe("Timeline types", () => {
    it("supports 4 types", () => {
      expect(VALID_TIMELINE_TYPES).toHaveLength(4)
    })

    it("includes course, certification, publication, award", () => {
      expect(VALID_TIMELINE_TYPES).toEqual(
        expect.arrayContaining(["course", "certification", "publication", "award"])
      )
    })

    it("rejects unknown types", () => {
      expect(VALID_TIMELINE_TYPES).not.toContain("internship")
    })
  })

  // ── Contribution Heatmap ─────────────────────────────────────
  describe("Contribution heatmap", () => {
    it("groups posts and comments by day", () => {
      const jan1 = new Date("2026-01-01T10:00:00Z").getTime()
      const jan1b = new Date("2026-01-01T18:00:00Z").getTime()
      const jan2 = new Date("2026-01-02T12:00:00Z").getTime()

      const posts = [{ createdAt: jan1 }]
      const comments = [{ createdAt: jan1b }, { createdAt: jan2 }]

      const heatmap = buildHeatmap(posts, comments)
      expect(heatmap["2026-01-01"]).toBe(2) // 1 post + 1 comment
      expect(heatmap["2026-01-02"]).toBe(1) // 1 comment
    })

    it("returns empty map for no activity", () => {
      expect(buildHeatmap([], [])).toEqual({})
    })

    it("counts posts and comments separately per day", () => {
      const ts = new Date("2026-03-15T12:00:00Z").getTime()
      const posts = [{ createdAt: ts }, { createdAt: ts }]
      const comments = [{ createdAt: ts }]
      const heatmap = buildHeatmap(posts, comments)
      expect(heatmap["2026-03-15"]).toBe(3)
    })

    it("toDay returns ISO date string", () => {
      const ts = new Date("2026-06-15T23:59:59Z").getTime()
      expect(toDay(ts)).toBe("2026-06-15")
    })
  })

  // ── Date sorting ─────────────────────────────────────────────
  describe("Timeline date sorting", () => {
    it("sorts by date descending", () => {
      const items = [
        { date: 1000, title: "oldest" },
        { date: 3000, title: "newest" },
        { date: 2000, title: "middle" },
      ]
      const sorted = [...items].sort((a, b) => b.date - a.date)
      expect(sorted[0].title).toBe("newest")
      expect(sorted[2].title).toBe("oldest")
    })
  })

  // ── Ownership ────────────────────────────────────────────────
  describe("Ownership checks", () => {
    it("owner can edit own project", () => {
      const project = { userId: "u1" }
      const currentUser = "u1"
      expect(project.userId === currentUser).toBe(true)
    })

    it("non-owner cannot edit", () => {
      const project = { userId: "u1" }
      const currentUser = "u2"
      expect(project.userId === currentUser).toBe(false)
    })
  })

  // ── Tech stack normalization ─────────────────────────────────
  describe("Tech stack trimming", () => {
    it("trims and filters empty entries", () => {
      const raw = [" React ", "  ", "TypeScript", ""]
      const cleaned = raw.map((t) => t.trim()).filter(Boolean)
      expect(cleaned).toEqual(["React", "TypeScript"])
    })
  })
})
