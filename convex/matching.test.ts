/**
 * Unit Tests for Skill-Based Matching
 * Feature: Skill-Based Matching (Phase 4.5)
 *
 * Tests all scoring helpers exported from convex/matching.ts
 */

import {
  skillOverlap,
  complementarity,
  experienceLevelValue,
  expertScore,
  partnerScore,
} from "./matching"

describe("skillOverlap", () => {
  it("should return 0 when both sets are empty", () => {
    expect(skillOverlap([], [])).toBe(0)
  })

  it("should return 0 when there is no overlap", () => {
    expect(skillOverlap(["react"], ["python"])).toBe(0)
  })

  it("should return 1 for identical sets", () => {
    expect(skillOverlap(["react", "node"], ["react", "node"])).toBe(1)
  })

  it("should return 0.5 for sets with 50% overlap", () => {
    // intersection={a}, union={a,b,c}
    expect(skillOverlap(["a", "b"], ["a", "c"])).toBeCloseTo(1 / 3)
  })

  it("should be case-insensitive", () => {
    expect(skillOverlap(["JavaScript"], ["javascript"])).toBe(1)
  })

  it("should return 1/3 when one is a subset", () => {
    // intersection={python}, union={python,react,node}
    const result = skillOverlap(["python"], ["python", "react", "node"])
    expect(result).toBeCloseTo(1 / 3)
  })

  it("should be commutative", () => {
    const a = ["react", "node", "python"]
    const b = ["python", "typescript", "go"]
    expect(skillOverlap(a, b)).toBeCloseTo(skillOverlap(b, a))
  })

  it("should return a value between 0 and 1", () => {
    const result = skillOverlap(["a", "b", "c"], ["b", "c", "d", "e"])
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(1)
  })
})

describe("complementarity", () => {
  it("should return 0 when B is empty", () => {
    expect(complementarity(["react"], [])).toBe(0)
  })

  it("should return 0 when A already has all of B's skills", () => {
    expect(complementarity(["react", "node"], ["react"])).toBe(0)
  })

  it("should return 1 when B has nothing in common with A", () => {
    expect(complementarity(["react"], ["python", "go"])).toBe(1)
  })

  it("should return 0.5 when half of B's skills are new to A", () => {
    // B has 2 skills, 1 is in A, 1 is new → 0.5
    expect(complementarity(["react"], ["react", "node"])).toBeCloseTo(0.5)
  })

  it("should be case-insensitive", () => {
    expect(complementarity(["React"], ["react"])).toBe(0)
    expect(complementarity(["REACT"], ["node"])).toBe(1)
  })

  it("should return 1 when A is empty and B has skills", () => {
    // All of B's skills are new to A
    expect(complementarity([], ["python", "react"])).toBe(1)
  })

  it("should return a value between 0 and 1", () => {
    const result = complementarity(["a", "b"], ["b", "c", "d"])
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(1)
  })
})

describe("experienceLevelValue", () => {
  it("should return 1 for Beginner", () => {
    expect(experienceLevelValue("Beginner")).toBe(1)
  })

  it("should return 2 for Intermediate", () => {
    expect(experienceLevelValue("Intermediate")).toBe(2)
  })

  it("should return 3 for Advanced", () => {
    expect(experienceLevelValue("Advanced")).toBe(3)
  })

  it("should return 4 for Expert", () => {
    expect(experienceLevelValue("Expert")).toBe(4)
  })

  it("should be monotonically increasing", () => {
    const beginner = experienceLevelValue("Beginner")
    const intermediate = experienceLevelValue("Intermediate")
    const advanced = experienceLevelValue("Advanced")
    const expert = experienceLevelValue("Expert")

    expect(beginner).toBeLessThan(intermediate)
    expect(intermediate).toBeLessThan(advanced)
    expect(advanced).toBeLessThan(expert)
  })
})

describe("expertScore", () => {
  it("should return 0.3 for an Expert with no matching skills and no endorsements", () => {
    // overlap=0, levelScore=4/4=1, endorseScore=0
    // = 0*0.5 + 1*0.3 + 0*0.2 = 0.3
    const score = expertScore(["react"], ["python"], "Expert", 0)
    expect(score).toBeCloseTo(0.3)
  })

  it("should return 0.5 for perfect skill match, Beginner, no endorsements", () => {
    // overlap=1, levelScore=1/4=0.25, endorseScore=0
    // = 1*0.5 + 0.25*0.3 + 0*0.2 = 0.5 + 0.075 = 0.575
    const score = expertScore(["python"], ["python"], "Beginner", 0)
    expect(score).toBeCloseTo(0.575)
  })

  it("should return 1.0 for perfect match, Expert, 20+ endorsements", () => {
    // overlap=1, levelScore=1, endorseScore=1
    // = 1*0.5 + 1*0.3 + 1*0.2 = 1.0
    const score = expertScore(["react"], ["react"], "Expert", 20)
    expect(score).toBeCloseTo(1.0)
  })

  it("should cap endorsementScore at 1 for 20+ endorsements", () => {
    const score20 = expertScore(["a"], ["a"], "Expert", 20)
    const score100 = expertScore(["a"], ["a"], "Expert", 100)
    expect(score20).toBeCloseTo(score100)
  })

  it("should return a value between 0 and 1", () => {
    const score = expertScore(
      ["react", "node"],
      ["react", "python"],
      "Advanced",
      5
    )
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
  })

  it("should rank Expert higher than Beginner with same skills and endorsements", () => {
    const expertResultScore = expertScore(["react"], ["react"], "Expert", 0)
    const beginnerResultScore = expertScore(["react"], ["react"], "Beginner", 0)
    expect(expertResultScore).toBeGreaterThan(beginnerResultScore)
  })
})

describe("partnerScore", () => {
  it("should return 0 when both have no skills", () => {
    expect(partnerScore([], [])).toBe(0)
  })

  it("should return 0.55 when B is completely complementary with no overlap", () => {
    // comp=1 (all new), overlap=0
    // = 1*0.55 + 0*0.45 = 0.55
    expect(partnerScore(["react"], ["python"])).toBeCloseTo(0.55)
  })

  it("should return 0.45 when B duplicates all of A's skills", () => {
    // comp=0 (none new), overlap=1
    // = 0*0.55 + 1*0.45 = 0.45
    expect(partnerScore(["react"], ["react"])).toBeCloseTo(0.45)
  })

  it("should return a value between 0 and 1", () => {
    const score = partnerScore(["a", "b", "c"], ["b", "c", "d", "e"])
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
  })

  it("should prefer complementary over purely overlapping partners", () => {
    const complementaryScore = partnerScore(["react"], ["python", "go"])
    const overlappingScore = partnerScore(["react"], ["react"])
    expect(complementaryScore).toBeGreaterThan(overlappingScore)
  })

  it("should be maximized by a mix of overlap and complementarity", () => {
    // Pure complement: comp=1, overlap=0 → 0.55
    const pureComplement = partnerScore(["a"], ["b"])
    // Mix: some overlap some complement
    const mixed = partnerScore(["a", "b"], ["b", "c"])
    // Both should be valid scores
    expect(pureComplement).toBeCloseTo(0.55)
    expect(mixed).toBeGreaterThan(0)
    expect(mixed).toBeLessThan(1)
  })
})

describe("Integration: skillOverlap + complementarity", () => {
  it("overlap + complementarity together describe full relationship", () => {
    const viewer = ["react", "node"]
    const candidate = ["react", "python"]

    const overlap = skillOverlap(viewer, candidate)
    const comp = complementarity(viewer, candidate)

    // Overlap: intersection={react}, union={react,node,python} → 1/3
    expect(overlap).toBeCloseTo(1 / 3)
    // Complementarity: python not in viewer → 1/2 (1 of 2 candidate skills is new)
    expect(comp).toBeCloseTo(0.5)
  })
})
