import {
  validateAdTitle,
  validateAdContent,
  validateBudget,
  validateLinkUrl,
  calcCtr,
  matchesTargeting,
} from "./ads"

// ──────────────────────────────────────────────
// validateAdTitle
// ──────────────────────────────────────────────
describe("ads – validateAdTitle", () => {
  test("accepts a normal title", () => {
    expect(() => validateAdTitle("Learn Python Now")).not.toThrow()
  })

  test("throws on empty string", () => {
    expect(() => validateAdTitle("")).toThrow("required")
  })

  test("throws on whitespace-only string", () => {
    expect(() => validateAdTitle("   ")).toThrow("required")
  })

  test("accepts title at exactly 200 chars", () => {
    expect(() => validateAdTitle("a".repeat(200))).not.toThrow()
  })

  test("throws on title over 200 chars", () => {
    expect(() => validateAdTitle("a".repeat(201))).toThrow("200")
  })
})

// ──────────────────────────────────────────────
// validateAdContent
// ──────────────────────────────────────────────
describe("ads – validateAdContent", () => {
  test("accepts valid content", () => {
    expect(() => validateAdContent("Click here to learn more")).not.toThrow()
  })

  test("throws on empty", () => {
    expect(() => validateAdContent("")).toThrow("required")
  })

  test("accepts content at 2000 chars", () => {
    expect(() => validateAdContent("x".repeat(2000))).not.toThrow()
  })

  test("throws on content over 2000 chars", () => {
    expect(() => validateAdContent("x".repeat(2001))).toThrow("2000")
  })
})

// ──────────────────────────────────────────────
// validateBudget
// ──────────────────────────────────────────────
describe("ads – validateBudget", () => {
  test("accepts positive budget", () => {
    expect(() => validateBudget(100)).not.toThrow()
    expect(() => validateBudget(0.01)).not.toThrow()
  })

  test("throws on zero", () => {
    expect(() => validateBudget(0)).toThrow("greater than 0")
  })

  test("throws on negative", () => {
    expect(() => validateBudget(-50)).toThrow("greater than 0")
  })

  test("throws on Infinity", () => {
    expect(() => validateBudget(Infinity)).toThrow("valid number")
  })

  test("throws on NaN", () => {
    expect(() => validateBudget(NaN)).toThrow()
  })
})

// ──────────────────────────────────────────────
// validateLinkUrl
// ──────────────────────────────────────────────
describe("ads – validateLinkUrl", () => {
  test("accepts https URL", () => {
    expect(() => validateLinkUrl("https://example.com")).not.toThrow()
  })

  test("accepts http URL", () => {
    expect(() => validateLinkUrl("http://example.com/promo")).not.toThrow()
  })

  test("throws on empty", () => {
    expect(() => validateLinkUrl("")).toThrow("required")
  })

  test("throws on non-URL string", () => {
    expect(() => validateLinkUrl("not a url")).toThrow("valid URL")
  })

  test("throws on ftp:// URL", () => {
    expect(() => validateLinkUrl("ftp://example.com")).toThrow("http or https")
  })

  test("throws on javascript: URL", () => {
    expect(() => validateLinkUrl("javascript:alert(1)")).toThrow("http or https")
  })
})

// ──────────────────────────────────────────────
// calcCtr
// ──────────────────────────────────────────────
describe("ads – calcCtr", () => {
  test("returns 0 when no impressions", () => {
    expect(calcCtr(0, 0)).toBe(0)
  })

  test("calculates 10% CTR correctly", () => {
    expect(calcCtr(100, 10)).toBe(10)
  })

  test("calculates 2.5% CTR", () => {
    expect(calcCtr(1000, 25)).toBe(2.5)
  })

  test("100% CTR is valid", () => {
    expect(calcCtr(5, 5)).toBe(100)
  })

  test("rounds to 2 decimal places", () => {
    const ctr = calcCtr(3, 1) // 33.3333...
    expect(ctr.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2)
  })
})

// ──────────────────────────────────────────────
// matchesTargeting
// ──────────────────────────────────────────────
describe("ads – matchesTargeting", () => {
  const mockUser = {
    university: "MIT",
    role: "student",
    skills: ["Python", "React"],
  }

  test("untargeted ad matches any user", () => {
    expect(matchesTargeting({}, mockUser)).toBe(true)
  })

  test("matching university passes", () => {
    expect(matchesTargeting({ targetUniversity: "MIT" }, mockUser)).toBe(true)
  })

  test("non-matching university fails", () => {
    expect(matchesTargeting({ targetUniversity: "Harvard" }, mockUser)).toBe(false)
  })

  test("matching role passes", () => {
    expect(matchesTargeting({ targetRole: "student" }, mockUser)).toBe(true)
  })

  test("non-matching role fails", () => {
    expect(matchesTargeting({ targetRole: "professor" }, mockUser)).toBe(false)
  })

  test("matching skill passes", () => {
    expect(matchesTargeting({ targetSkills: ["Python"] }, mockUser)).toBe(true)
  })

  test("no overlapping skills fails", () => {
    expect(matchesTargeting({ targetSkills: ["Java", "C++"] }, mockUser)).toBe(false)
  })

  test("empty skills array targets everyone", () => {
    expect(matchesTargeting({ targetSkills: [] }, mockUser)).toBe(true)
  })

  test("multi-condition match: all matching passes", () => {
    expect(
      matchesTargeting(
        { targetUniversity: "MIT", targetRole: "student", targetSkills: ["React"] },
        mockUser
      )
    ).toBe(true)
  })

  test("multi-condition match: one fails → all fail", () => {
    expect(
      matchesTargeting(
        { targetUniversity: "MIT", targetRole: "professor", targetSkills: ["React"] },
        mockUser
      )
    ).toBe(false)
  })

  test("user with no skills fails skill-targeted ad", () => {
    expect(
      matchesTargeting({ targetSkills: ["Python"] }, { university: "MIT", role: "student" })
    ).toBe(false)
  })
})
