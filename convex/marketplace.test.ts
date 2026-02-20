import {
  CATEGORIES,
  CONDITIONS,
  LISTING_EXPIRY_MS,
  validateListingTitle,
  validateListingDescription,
  validatePrice,
  validateCategory,
  validateCondition,
  isListingActive,
  matchesPriceRange,
} from "./marketplace"

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
describe("marketplace – constants", () => {
  test("CATEGORIES contains expected values", () => {
    expect(CATEGORIES).toContain("books")
    expect(CATEGORIES).toContain("electronics")
    expect(CATEGORIES).toContain("furniture")
    expect(CATEGORIES).toContain("services")
    expect(CATEGORIES).toContain("other")
  })

  test("CONDITIONS contains expected values", () => {
    expect(CONDITIONS).toContain("new")
    expect(CONDITIONS).toContain("like_new")
    expect(CONDITIONS).toContain("good")
    expect(CONDITIONS).toContain("fair")
    expect(CONDITIONS).toContain("poor")
  })

  test("LISTING_EXPIRY_MS is 30 days", () => {
    expect(LISTING_EXPIRY_MS).toBe(30 * 24 * 60 * 60 * 1000)
  })
})

// ──────────────────────────────────────────────
// validateListingTitle
// ──────────────────────────────────────────────
describe("marketplace – validateListingTitle", () => {
  test("accepts normal title", () => {
    expect(() => validateListingTitle("Intro to Algorithms Textbook")).not.toThrow()
  })

  test("throws on empty", () => {
    expect(() => validateListingTitle("")).toThrow("required")
  })

  test("throws on whitespace-only", () => {
    expect(() => validateListingTitle("   ")).toThrow("required")
  })

  test("accepts 150-char title", () => {
    expect(() => validateListingTitle("a".repeat(150))).not.toThrow()
  })

  test("throws on 151-char title", () => {
    expect(() => validateListingTitle("a".repeat(151))).toThrow("150")
  })
})

// ──────────────────────────────────────────────
// validateListingDescription
// ──────────────────────────────────────────────
describe("marketplace – validateListingDescription", () => {
  test("accepts valid description", () => {
    expect(() => validateListingDescription("Lightly used, no highlights")).not.toThrow()
  })

  test("throws on empty", () => {
    expect(() => validateListingDescription("")).toThrow("required")
  })

  test("accepts 3000-char description", () => {
    expect(() => validateListingDescription("x".repeat(3000))).not.toThrow()
  })

  test("throws on 3001-char description", () => {
    expect(() => validateListingDescription("x".repeat(3001))).toThrow("3000")
  })
})

// ──────────────────────────────────────────────
// validatePrice
// ──────────────────────────────────────────────
describe("marketplace – validatePrice", () => {
  test("accepts positive price", () => {
    expect(() => validatePrice(25)).not.toThrow()
    expect(() => validatePrice(0.99)).not.toThrow()
  })

  test("accepts free (0)", () => {
    expect(() => validatePrice(0)).not.toThrow()
  })

  test("throws on negative", () => {
    expect(() => validatePrice(-5)).toThrow("negative")
  })

  test("throws on NaN", () => {
    expect(() => validatePrice(NaN)).toThrow("valid number")
  })

  test("throws on Infinity", () => {
    expect(() => validatePrice(Infinity)).toThrow("valid number")
  })

  test("accepts large price", () => {
    expect(() => validatePrice(9999.99)).not.toThrow()
  })
})

// ──────────────────────────────────────────────
// validateCategory
// ──────────────────────────────────────────────
describe("marketplace – validateCategory", () => {
  test.each(CATEGORIES)("accepts valid category: %s", (c) => {
    expect(() => validateCategory(c)).not.toThrow()
  })

  test("throws on invalid category", () => {
    expect(() => validateCategory("clothing")).toThrow("one of")
  })

  test("throws on empty string", () => {
    expect(() => validateCategory("")).toThrow("one of")
  })
})

// ──────────────────────────────────────────────
// validateCondition
// ──────────────────────────────────────────────
describe("marketplace – validateCondition", () => {
  test.each(CONDITIONS)("accepts valid condition: %s", (c) => {
    expect(() => validateCondition(c)).not.toThrow()
  })

  test("throws on invalid condition", () => {
    expect(() => validateCondition("broken")).toThrow("one of")
  })
})

// ──────────────────────────────────────────────
// isListingActive
// ──────────────────────────────────────────────
describe("marketplace – isListingActive", () => {
  const NOW = Date.now()

  test("active with future expiry is active", () => {
    expect(isListingActive("active", NOW + 100_000_000, NOW)).toBe(true)
  })

  test("active with no expiry is active", () => {
    expect(isListingActive("active", undefined, NOW)).toBe(true)
  })

  test("active with past expiry is NOT active", () => {
    expect(isListingActive("active", NOW - 1000, NOW)).toBe(false)
  })

  test("sold listing is not active", () => {
    expect(isListingActive("sold", NOW + 100_000_000, NOW)).toBe(false)
  })

  test("expired listing is not active", () => {
    expect(isListingActive("expired", NOW + 100_000_000, NOW)).toBe(false)
  })
})

// ──────────────────────────────────────────────
// matchesPriceRange
// ──────────────────────────────────────────────
describe("marketplace – matchesPriceRange", () => {
  test("no filter passes any price", () => {
    expect(matchesPriceRange(50, undefined, undefined)).toBe(true)
  })

  test("minPrice: above min passes", () => {
    expect(matchesPriceRange(50, 10, undefined)).toBe(true)
  })

  test("minPrice: at min passes", () => {
    expect(matchesPriceRange(10, 10, undefined)).toBe(true)
  })

  test("minPrice: below min fails", () => {
    expect(matchesPriceRange(5, 10, undefined)).toBe(false)
  })

  test("maxPrice: below max passes", () => {
    expect(matchesPriceRange(30, undefined, 100)).toBe(true)
  })

  test("maxPrice: at max passes", () => {
    expect(matchesPriceRange(100, undefined, 100)).toBe(true)
  })

  test("maxPrice: above max fails", () => {
    expect(matchesPriceRange(150, undefined, 100)).toBe(false)
  })

  test("range: within range passes", () => {
    expect(matchesPriceRange(50, 10, 100)).toBe(true)
  })

  test("range: below min fails", () => {
    expect(matchesPriceRange(5, 10, 100)).toBe(false)
  })

  test("range: above max fails", () => {
    expect(matchesPriceRange(200, 10, 100)).toBe(false)
  })
})
