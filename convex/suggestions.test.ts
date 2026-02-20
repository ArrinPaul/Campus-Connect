/**
 * Unit Tests for Friend Suggestion Engine (Phase 4.1)
 * Tests the scoring algorithm, helpers, and suggestion logic.
 */
import {
  jaccardSimilarity,
  skillComplementarity,
  buildReasons,
  WEIGHTS,
} from "./suggestions"

describe("Friend Suggestion Engine", () => {
  // ────────────────────────────────────────────
  // Jaccard similarity
  // ────────────────────────────────────────────
  describe("jaccardSimilarity", () => {
    it("should return 0 for two empty arrays", () => {
      expect(jaccardSimilarity([], [])).toBe(0)
    })

    it("should return 0 when no shared skills", () => {
      expect(
        jaccardSimilarity(["Python", "React"], ["Java", "Go"])
      ).toBe(0)
    })

    it("should return 1 for identical skill sets", () => {
      expect(
        jaccardSimilarity(["Python", "React"], ["Python", "React"])
      ).toBe(1)
    })

    it("should be case-insensitive", () => {
      expect(jaccardSimilarity(["python"], ["Python"])).toBe(1)
    })

    it("should return correct value for partial overlap", () => {
      // {python, react} ∩ {python, java} = {python}  →  1 / 3 ≈ 0.333
      const result = jaccardSimilarity(
        ["Python", "React"],
        ["Python", "Java"]
      )
      expect(result).toBeCloseTo(1 / 3, 5)
    })

    it("should handle one empty array", () => {
      expect(jaccardSimilarity(["Python"], [])).toBe(0)
    })

    it("should handle duplicate skills in input", () => {
      // Sets: {python} — still identical
      expect(
        jaccardSimilarity(["Python", "Python"], ["python"])
      ).toBe(1)
    })
  })

  // ────────────────────────────────────────────
  // Skill complementarity
  // ────────────────────────────────────────────
  describe("skillComplementarity", () => {
    it("should return 0 when candidate has no skills", () => {
      expect(skillComplementarity(["Python"], [])).toBe(0)
    })

    it("should return 1 when all candidate skills are new", () => {
      expect(
        skillComplementarity(["Python"], ["React", "Go"])
      ).toBe(1)
    })

    it("should return 0 when all candidate skills overlap", () => {
      expect(
        skillComplementarity(["Python", "React"], ["python", "react"])
      ).toBe(0)
    })

    it("should return correct ratio for partial complement", () => {
      // candidate has ["Python", "Go"] — target has ["Python"]
      // complementary: "Go" → 1/2 = 0.5
      expect(
        skillComplementarity(["Python"], ["Python", "Go"])
      ).toBe(0.5)
    })
  })

  // ────────────────────────────────────────────
  // Build reasons
  // ────────────────────────────────────────────
  describe("buildReasons", () => {
    it("should include mutual connections when > 0", () => {
      const reasons = buildReasons(3, 0, false, false, 0, 0)
      expect(reasons).toContain("3 mutual connections")
    })

    it("should use singular for 1 mutual connection", () => {
      const reasons = buildReasons(1, 0, false, false, 0, 0)
      expect(reasons).toContain("1 mutual connection")
    })

    it("should include shared skills", () => {
      const reasons = buildReasons(0, 2, false, false, 0, 0)
      expect(reasons).toContain("2 shared skills")
    })

    it("should include same university", () => {
      const reasons = buildReasons(0, 0, true, false, 0, 0)
      expect(reasons).toContain("Same university")
    })

    it("should include same role", () => {
      const reasons = buildReasons(0, 0, false, true, 0, 0)
      expect(reasons).toContain("Same role")
    })

    it("should include interaction flag", () => {
      const reasons = buildReasons(0, 0, false, false, 5, 0)
      expect(reasons).toContain("Interacted with your posts")
    })

    it("should include complementary skills", () => {
      const reasons = buildReasons(0, 0, false, false, 0, 4)
      expect(reasons).toContain("4 complementary skills")
    })

    it("should fall back to 'Suggested for you' when no reasons", () => {
      const reasons = buildReasons(0, 0, false, false, 0, 0)
      expect(reasons).toEqual(["Suggested for you"])
    })

    it("should combine multiple reasons", () => {
      const reasons = buildReasons(2, 3, true, false, 1, 0)
      expect(reasons).toHaveLength(4)
      expect(reasons).toContain("2 mutual connections")
      expect(reasons).toContain("3 shared skills")
      expect(reasons).toContain("Same university")
      expect(reasons).toContain("Interacted with your posts")
    })
  })

  // ────────────────────────────────────────────
  // Scoring weights
  // ────────────────────────────────────────────
  describe("WEIGHTS", () => {
    it("should sum to exactly 1.0", () => {
      const total =
        WEIGHTS.mutualFollows +
        WEIGHTS.sharedSkills +
        WEIGHTS.sameUniversity +
        WEIGHTS.sameRole +
        WEIGHTS.interactionHistory +
        WEIGHTS.skillComplementarity

      expect(total).toBeCloseTo(1.0, 10)
    })

    it("mutualFollows should have the highest weight", () => {
      expect(WEIGHTS.mutualFollows).toBe(0.3)
      expect(WEIGHTS.mutualFollows).toBeGreaterThanOrEqual(
        Math.max(
          WEIGHTS.sharedSkills,
          WEIGHTS.sameUniversity,
          WEIGHTS.sameRole,
          WEIGHTS.interactionHistory,
          WEIGHTS.skillComplementarity
        )
      )
    })
  })

  // ────────────────────────────────────────────
  // Composite score range validation
  // ────────────────────────────────────────────
  describe("Score range", () => {
    it("should produce score in [0, 1] when all signals are 0", () => {
      // All signals zero → score = 0
      const score =
        WEIGHTS.mutualFollows * 0 +
        WEIGHTS.sharedSkills * 0 +
        WEIGHTS.sameUniversity * 0 +
        WEIGHTS.sameRole * 0 +
        WEIGHTS.interactionHistory * 0 +
        WEIGHTS.skillComplementarity * 0
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it("should produce score = 1.0 when all signals are maxed", () => {
      const score =
        WEIGHTS.mutualFollows * 1 +
        WEIGHTS.sharedSkills * 1 +
        WEIGHTS.sameUniversity * 1 +
        WEIGHTS.sameRole * 1 +
        WEIGHTS.interactionHistory * 1 +
        WEIGHTS.skillComplementarity * 1
      expect(score).toBeCloseTo(1.0, 10)
    })

    it("should produce higher score for more signals", () => {
      const lowScore =
        WEIGHTS.mutualFollows * 0.1 +
        WEIGHTS.sharedSkills * 0.1 +
        WEIGHTS.sameUniversity * 0 +
        WEIGHTS.sameRole * 0 +
        WEIGHTS.interactionHistory * 0 +
        WEIGHTS.skillComplementarity * 0

      const highScore =
        WEIGHTS.mutualFollows * 0.8 +
        WEIGHTS.sharedSkills * 0.6 +
        WEIGHTS.sameUniversity * 1 +
        WEIGHTS.sameRole * 1 +
        WEIGHTS.interactionHistory * 0.5 +
        WEIGHTS.skillComplementarity * 0.4

      expect(highScore).toBeGreaterThan(lowScore)
    })
  })

  // ────────────────────────────────────────────
  // Scoring scenarios (property-like)
  // ────────────────────────────────────────────
  describe("Scoring scenarios", () => {
    function computeScore(params: {
      mutualCount: number
      sharedSkillsJaccard: number
      sameUniversity: boolean
      sameRole: boolean
      interactionNorm: number
      complementarity: number
    }): number {
      return (
        WEIGHTS.mutualFollows * Math.min(1, params.mutualCount / 10) +
        WEIGHTS.sharedSkills * params.sharedSkillsJaccard +
        WEIGHTS.sameUniversity * (params.sameUniversity ? 1 : 0) +
        WEIGHTS.sameRole * (params.sameRole ? 1 : 0) +
        WEIGHTS.interactionHistory * params.interactionNorm +
        WEIGHTS.skillComplementarity * params.complementarity
      )
    }

    it("someone with 5 mutual friends and same university should score well", () => {
      const score = computeScore({
        mutualCount: 5,
        sharedSkillsJaccard: 0,
        sameUniversity: true,
        sameRole: false,
        interactionNorm: 0,
        complementarity: 0,
      })
      // 0.3 * 0.5 + 0.15 * 1 = 0.15 + 0.15 = 0.30
      expect(score).toBeCloseTo(0.3, 2)
    })

    it("someone who interacts a lot but no mutual connections should still rank", () => {
      const score = computeScore({
        mutualCount: 0,
        sharedSkillsJaccard: 0.5,
        sameUniversity: false,
        sameRole: false,
        interactionNorm: 1.0,
        complementarity: 0,
      })
      // 0.2 * 0.5 + 0.2 * 1.0 = 0.1 + 0.2 = 0.30
      expect(score).toBeCloseTo(0.3, 2)
    })

    it("perfect candidate with all signals should score 1.0", () => {
      const score = computeScore({
        mutualCount: 10,
        sharedSkillsJaccard: 1.0,
        sameUniversity: true,
        sameRole: true,
        interactionNorm: 1.0,
        complementarity: 1.0,
      })
      expect(score).toBeCloseTo(1.0, 5)
    })

    it("stranger with zero signals should score 0", () => {
      const score = computeScore({
        mutualCount: 0,
        sharedSkillsJaccard: 0,
        sameUniversity: false,
        sameRole: false,
        interactionNorm: 0,
        complementarity: 0,
      })
      expect(score).toBe(0)
    })
  })
})
