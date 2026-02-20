/**
 * Tests for convex/search.ts — Phase 4.4 Search Upgrades
 *
 * Tests the pure scoring / matching functions exported for unit testing:
 *   1. editDistance      – Levenshtein distance
 *   2. fuzzyMatch        – substring + word-level fuzzy match
 *   3. searchRelevanceScore – [0, 1] relevance scorer
 *
 * The Convex query handlers (universalSearch, searchPosts, etc.) depend on
 * the database and are covered via integration-style tests with mocked ctx.
 */

import { editDistance, fuzzyMatch, searchRelevanceScore } from "./search"

// ────────────────────────────────────────
// 1. editDistance
// ────────────────────────────────────────
describe("editDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(editDistance("hello", "hello")).toBe(0)
    expect(editDistance("", "")).toBe(0)
  })

  it("returns length of other string when one is empty", () => {
    expect(editDistance("", "abc")).toBe(3)
    expect(editDistance("xyz", "")).toBe(3)
  })

  it("computes correct distance for classic kitten/sitting example", () => {
    expect(editDistance("kitten", "sitting")).toBe(3)
  })

  it("handles single character difference", () => {
    expect(editDistance("cat", "bat")).toBe(1)
    expect(editDistance("cat", "cats")).toBe(1)
    expect(editDistance("cats", "cat")).toBe(1)
  })

  it("handles completely different strings", () => {
    expect(editDistance("abc", "xyz")).toBe(3)
  })

  it("is case-sensitive", () => {
    expect(editDistance("Hello", "hello")).toBe(1)
  })

  it("handles single character strings", () => {
    expect(editDistance("a", "b")).toBe(1)
    expect(editDistance("a", "a")).toBe(0)
  })

  it("works with whitespace", () => {
    expect(editDistance("ab cd", "abcd")).toBe(1)
  })
})

// ────────────────────────────────────────
// 2. fuzzyMatch
// ────────────────────────────────────────
describe("fuzzyMatch", () => {
  describe("exact / substring matches", () => {
    it("matches when target contains the query as substring", () => {
      expect(fuzzyMatch("react", "I love React and TypeScript")).toBe(true)
    })

    it("matches case-insensitively", () => {
      expect(fuzzyMatch("HELLO", "hello world")).toBe(true)
    })

    it("matches single character queries", () => {
      expect(fuzzyMatch("a", "apple")).toBe(true)
    })

    it("handles empty query", () => {
      expect(fuzzyMatch("", "anything")).toBe(true) // "" is always a substring
    })
  })

  describe("word-level fuzzy matching", () => {
    it("matches with one typo for words ≥ 3 chars", () => {
      // "reactt" vs "react" → edit distance 1, word len 6 → allowed = floor(6/3) = 2
      expect(fuzzyMatch("reactt", "react programming")).toBe(true)
    })

    it("rejects when typos exceed tolerance", () => {
      // "abcdef" vs "xyzuvw" → edit distance > floor(6/3) = 2
      expect(fuzzyMatch("abcdef", "xyzuvw")).toBe(false)
    })

    it("allows partial word containment", () => {
      // qw.includes(tw) or tw.includes(qw)
      expect(fuzzyMatch("typescript", "type")).toBe(true)
    })

    it("matches multi-word queries when all words match", () => {
      expect(fuzzyMatch("machine learning", "deep learning with machine models")).toBe(true)
    })

    it("rejects multi-word query when a word has no match", () => {
      expect(fuzzyMatch("quantum chemistry", "organic chemistry lab")).toBe(false)
    })
  })

  describe("custom maxDistance", () => {
    it("uses provided maxDistance if smaller than proportional", () => {
      // Word "abcdefghi" (len 9) vs "abcdefxyz" → dist 3
      // Default max proportional = floor(9/3) = 3 → would match
      // With maxDistance=1 → min(1,3)=1 → won't match
      expect(fuzzyMatch("abcdefghi", "abcdefxyz", 1)).toBe(false)
    })

    it("uses proportional tolerance when smaller than maxDistance", () => {
      // Short word "ab" → proportional = floor(2/3) = 0
      // "ab" vs "ac" → dist 1, allowed 0 → no fuzzy match on word level
      // But "ab" is not substring of "ac" ← BUT "a" containment? No, qw="ab", tw="ac", no include
      expect(fuzzyMatch("ab", "ac", 5)).toBe(false)
    })
  })
})

// ────────────────────────────────────────
// 3. searchRelevanceScore
// ────────────────────────────────────────
describe("searchRelevanceScore", () => {
  describe("exact match", () => {
    it("returns 1.0 for exact match", () => {
      expect(searchRelevanceScore("react", "react")).toBe(1.0)
    })

    it("is case-insensitive", () => {
      expect(searchRelevanceScore("React", "react")).toBe(1.0)
      expect(searchRelevanceScore("react", "REACT")).toBe(1.0)
    })

    it("trims whitespace before comparing", () => {
      expect(searchRelevanceScore("  react  ", "react")).toBe(1.0)
    })
  })

  describe("prefix match", () => {
    it("returns 0.9 for prefix match", () => {
      expect(searchRelevanceScore("reac", "react")).toBe(0.9)
    })

    it("returns 0.9 when target starts with query", () => {
      expect(searchRelevanceScore("java", "javascript")).toBe(0.9)
    })
  })

  describe("substring match", () => {
    it("returns 0.7 for non-prefix substring", () => {
      expect(searchRelevanceScore("script", "javascript")).toBe(0.7)
    })

    it("returns 0.7 for interior match", () => {
      expect(searchRelevanceScore("earn", "learning")).toBe(0.7)
    })
  })

  describe("word-level matching", () => {
    it("scores > 0 for word-level exact matches", () => {
      const score = searchRelevanceScore("machine", "I study machine learning")
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(0.7) // substring match gets 0.7
    })

    it("scores > 0 for prefix word matches", () => {
      const score = searchRelevanceScore("prog", "programming language")
      // "prog" is a prefix of "programming language" → 0.9
      expect(score).toBe(0.9)
    })

    it("gives partial credit for edit-distance matches", () => {
      // "machin" vs "machine" → edit distance 1, floor("machin".length/3) = 2 → matched via edit dist
      // But "machin" IS a substring of "machine" → so it gets 0.7
      // Let's use something that's NOT a substring
      const score = searchRelevanceScore("machne", "machine learning")
      // "machne" is not a substring of "machine learning"
      // word level: "machne" vs "machine" → dist 2, floor(6/3)=2 → match via edit dist (+0.4)
      // result: 0.4/1 * 0.6 = 0.24, min(0.6, 0.24) = 0.24
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThan(0.7)
    })

    it("returns 0 when no word matches at all", () => {
      expect(searchRelevanceScore("xyz123", "hello world")).toBe(0)
    })
  })

  describe("score ordering", () => {
    it("ranks exact > prefix > substring > fuzzy > no match", () => {
      const exact = searchRelevanceScore("react", "react")
      const prefix = searchRelevanceScore("reac", "react")
      const substring = searchRelevanceScore("eact", "react")
      const noMatch = searchRelevanceScore("zzzzz", "react")

      expect(exact).toBeGreaterThan(prefix)
      expect(prefix).toBeGreaterThan(substring)
      expect(substring).toBeGreaterThan(noMatch)
      expect(noMatch).toBe(0)
    })

    it("scores are always in [0, 1] range", () => {
      const testPairs = [
        ["hello", "hello world"],
        ["x", "xyz"],
        ["nonexistent", "completely different text"],
        ["a very long query string", "short"],
      ]

      for (const [q, t] of testPairs) {
        const score = searchRelevanceScore(q, t)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
      }
    })
  })

  describe("edge cases", () => {
    it("handles empty query", () => {
      const score = searchRelevanceScore("", "hello")
      // empty string is exact match with empty target? No: "" vs "hello"
      // "hello".startsWith("") → true → 0.9? Actually yes.
      // But t.trim() = "hello", q.trim() = "" → t === q is false, t.startsWith("") is true → 0.9
      expect(score).toBe(0.9)
    })

    it("handles empty target", () => {
      const score = searchRelevanceScore("hello", "")
      expect(score).toBeLessThanOrEqual(1)
      expect(score).toBeGreaterThanOrEqual(0)
    })

    it("handles both empty", () => {
      expect(searchRelevanceScore("", "")).toBe(1.0)
    })

    it("handles special characters", () => {
      const score = searchRelevanceScore("#react", "#react")
      expect(score).toBe(1.0)
    })
  })
})

// ────────────────────────────────────────
// 4. Property-style tests
// ────────────────────────────────────────
describe("search property tests", () => {
  it("editDistance is symmetric", () => {
    const pairs = [
      ["abc", "def"],
      ["kitten", "sitting"],
      ["", "hello"],
      ["react", "angular"],
    ]
    for (const [a, b] of pairs) {
      expect(editDistance(a, b)).toBe(editDistance(b, a))
    }
  })

  it("editDistance satisfies triangle inequality", () => {
    const a = "abc"
    const b = "abd"
    const c = "xyz"
    expect(editDistance(a, c)).toBeLessThanOrEqual(
      editDistance(a, b) + editDistance(b, c)
    )
  })

  it("fuzzyMatch always returns true for exact substring", () => {
    const targets = [
      "Hello World",
      "TypeScript React",
      "Machine Learning AI",
      "Deep Neural Networks",
    ]
    for (const target of targets) {
      const sub = target.slice(2, 6).toLowerCase()
      expect(fuzzyMatch(sub, target)).toBe(true)
    }
  })

  it("searchRelevanceScore for exact match is always >= prefix match", () => {
    const words = ["react", "typescript", "machine", "learning"]
    for (const w of words) {
      const exact = searchRelevanceScore(w, w)
      const prefix = searchRelevanceScore(w.slice(0, w.length - 1), w)
      expect(exact).toBeGreaterThanOrEqual(prefix)
    }
  })

  it("searchRelevanceScore is deterministic", () => {
    const q = "test query"
    const t = "this is a test query string"
    const s1 = searchRelevanceScore(q, t)
    const s2 = searchRelevanceScore(q, t)
    expect(s1).toBe(s2)
  })
})
