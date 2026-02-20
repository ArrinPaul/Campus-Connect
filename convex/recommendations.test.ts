/**
 * Unit Tests for Content Recommendation Engine (Phase 4.3)
 * Tests scoring functions, weights, and recommendation properties.
 */
import {
  topicAffinity,
  authorAffinity,
  freshnessBoost,
  engagementQuality,
  computeRecommendationScore,
  REC_WEIGHTS,
} from "./recommendations"

const HOUR_MS = 1000 * 60 * 60

describe("Content Recommendation Engine", () => {
  // ────────────────────────────────────────────
  // topicAffinity (Jaccard on hashtag IDs)
  // ────────────────────────────────────────────
  describe("topicAffinity", () => {
    it("should return 0 for no overlap", () => {
      expect(topicAffinity(["h1", "h2"], ["h3", "h4"])).toBe(0)
    })

    it("should return 1 for identical sets", () => {
      expect(topicAffinity(["h1", "h2"], ["h1", "h2"])).toBe(1)
    })

    it("should return correct Jaccard for partial overlap", () => {
      // {h1, h2} ∩ {h2, h3} = {h2} → 1/3
      expect(topicAffinity(["h1", "h2"], ["h2", "h3"])).toBeCloseTo(1 / 3, 5)
    })

    it("should return 0 for two empty arrays", () => {
      expect(topicAffinity([], [])).toBe(0)
    })

    it("should return 0 for one empty array", () => {
      expect(topicAffinity(["h1"], [])).toBe(0)
    })

    it("should handle superset correctly", () => {
      // {h1, h2, h3} ∩ {h1} = {h1} → 1/3
      expect(topicAffinity(["h1", "h2", "h3"], ["h1"])).toBeCloseTo(1 / 3, 5)
    })
  })

  // ────────────────────────────────────────────
  // authorAffinity
  // ────────────────────────────────────────────
  describe("authorAffinity", () => {
    it("should return 0 for no interactions", () => {
      expect(authorAffinity(0)).toBe(0)
    })

    it("should return 1 for 15+ interactions", () => {
      expect(authorAffinity(15)).toBe(1)
      expect(authorAffinity(30)).toBe(1)
    })

    it("should return proportional value for partial interactions", () => {
      expect(authorAffinity(3)).toBeCloseTo(3 / 15, 5)
      expect(authorAffinity(7.5)).toBeCloseTo(0.5, 5)
    })

    it("should be monotonically increasing", () => {
      const scores = [0, 1, 5, 10, 15, 20].map(authorAffinity)
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1])
      }
    })
  })

  // ────────────────────────────────────────────
  // freshnessBoost
  // ────────────────────────────────────────────
  describe("freshnessBoost", () => {
    const now = Date.now()

    it("should return ~1 for brand-new post", () => {
      expect(freshnessBoost(now, now)).toBeCloseTo(1, 5)
    })

    it("should return ~0.5 after 48 hours (half-life)", () => {
      expect(freshnessBoost(now - 48 * HOUR_MS, now)).toBeCloseTo(0.5, 1)
    })

    it("should return 0 for posts older than 14 days", () => {
      expect(freshnessBoost(now - 15 * 24 * HOUR_MS, now)).toBe(0)
    })

    it("should return 1 for future timestamps", () => {
      expect(freshnessBoost(now + HOUR_MS, now)).toBe(1)
    })

    it("should be monotonically decreasing with age", () => {
      const scores = [0, 6, 24, 48, 96, 168, 336].map((hours) =>
        freshnessBoost(now - hours * HOUR_MS, now)
      )
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1])
      }
    })
  })

  // ────────────────────────────────────────────
  // engagementQuality
  // ────────────────────────────────────────────
  describe("engagementQuality", () => {
    it("should return 0 for no engagement", () => {
      expect(engagementQuality(undefined, 0)).toBe(0)
    })

    it("should weight comments 3x more than reactions", () => {
      const reactionsOnly = engagementQuality(
        { like: 1, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 },
        0
      )
      const commentsOnly = engagementQuality(undefined, 1) // 1 comment = 3 raw
      expect(commentsOnly).toBeGreaterThan(reactionsOnly)
    })

    it("should increase with more engagement", () => {
      const low = engagementQuality(
        { like: 1, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 },
        0
      )
      const high = engagementQuality(
        { like: 30, love: 10, laugh: 5, wow: 5, sad: 2, scholarly: 3 },
        20
      )
      expect(high).toBeGreaterThan(low)
    })

    it("should cap at 1.0", () => {
      const extreme = engagementQuality(
        { like: 1000, love: 500, laugh: 200, wow: 100, sad: 50, scholarly: 50 },
        500
      )
      expect(extreme).toBeLessThanOrEqual(1)
    })

    it("should be in [0, 1] range", () => {
      const values = [
        engagementQuality(undefined, 0),
        engagementQuality(
          { like: 5, love: 3, laugh: 1, wow: 0, sad: 0, scholarly: 0 },
          2
        ),
        engagementQuality(
          { like: 100, love: 50, laugh: 25, wow: 10, sad: 5, scholarly: 5 },
          50
        ),
      ]
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    })
  })

  // ────────────────────────────────────────────
  // computeRecommendationScore
  // ────────────────────────────────────────────
  describe("computeRecommendationScore", () => {
    it("should return 0 when all signals are 0", () => {
      expect(
        computeRecommendationScore({
          topicAffinity: 0,
          authorAffinity: 0,
          freshness: 0,
          engagementQuality: 0,
        })
      ).toBe(0)
    })

    it("should return 1 when all signals are 1", () => {
      expect(
        computeRecommendationScore({
          topicAffinity: 1,
          authorAffinity: 1,
          freshness: 1,
          engagementQuality: 1,
        })
      ).toBeCloseTo(1, 5)
    })

    it("should give highest weight to topicAffinity", () => {
      const topicOnly = computeRecommendationScore({
        topicAffinity: 1,
        authorAffinity: 0,
        freshness: 0,
        engagementQuality: 0,
      })
      const freshnessOnly = computeRecommendationScore({
        topicAffinity: 0,
        authorAffinity: 0,
        freshness: 1,
        engagementQuality: 0,
      })
      expect(topicOnly).toBeGreaterThan(freshnessOnly)
    })

    it("should produce higher score for topic + engagement match", () => {
      const topicAndEngagement = computeRecommendationScore({
        topicAffinity: 0.8,
        authorAffinity: 0.2,
        freshness: 0.5,
        engagementQuality: 0.9,
      })
      const lowScore = computeRecommendationScore({
        topicAffinity: 0.1,
        authorAffinity: 0.1,
        freshness: 0.3,
        engagementQuality: 0.1,
      })
      expect(topicAndEngagement).toBeGreaterThan(lowScore)
    })
  })

  // ────────────────────────────────────────────
  // REC_WEIGHTS
  // ────────────────────────────────────────────
  describe("REC_WEIGHTS", () => {
    it("should sum to 1.0", () => {
      const total =
        REC_WEIGHTS.topicAffinity +
        REC_WEIGHTS.authorAffinity +
        REC_WEIGHTS.freshness +
        REC_WEIGHTS.engagementQuality
      expect(total).toBeCloseTo(1.0, 10)
    })

    it("topicAffinity should have the highest weight", () => {
      expect(REC_WEIGHTS.topicAffinity).toBeGreaterThanOrEqual(
        Math.max(
          REC_WEIGHTS.authorAffinity,
          REC_WEIGHTS.freshness,
          REC_WEIGHTS.engagementQuality
        )
      )
    })

    it("should have all non-negative weights", () => {
      for (const val of Object.values(REC_WEIGHTS)) {
        expect(val).toBeGreaterThanOrEqual(0)
      }
    })
  })

  // ────────────────────────────────────────────
  // Property: score consistency
  // ────────────────────────────────────────────
  describe("Score property tests", () => {
    it("fresher posts with same topic match should score higher", () => {
      const now = Date.now()
      const baseParams = {
        topicAffinity: 0.7,
        authorAffinity: 0.3,
        engagementQuality: 0.5,
      }

      const scores = [0, 6, 24, 48, 96].map((hoursAgo) => {
        const freshness = freshnessBoost(now - hoursAgo * HOUR_MS, now)
        return computeRecommendationScore({ ...baseParams, freshness })
      })

      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1])
      }
    })

    it("higher topic overlap should produce higher composite score", () => {
      const baseParams = {
        authorAffinity: 0.3,
        freshness: 0.8,
        engagementQuality: 0.5,
      }

      const affinities = [0, 0.2, 0.5, 0.8, 1.0]
      const scores = affinities.map((topicAffinity) =>
        computeRecommendationScore({ ...baseParams, topicAffinity })
      )

      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1])
      }
    })

    it("all scores should be in [0, 1] range", () => {
      // Generate many random combos
      const combos = [
        { topicAffinity: 0, authorAffinity: 0, freshness: 0, engagementQuality: 0 },
        { topicAffinity: 1, authorAffinity: 1, freshness: 1, engagementQuality: 1 },
        { topicAffinity: 0.5, authorAffinity: 0.3, freshness: 0.7, engagementQuality: 0.9 },
        { topicAffinity: 0.1, authorAffinity: 0.9, freshness: 0.1, engagementQuality: 0.5 },
      ]

      for (const combo of combos) {
        const score = computeRecommendationScore(combo)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
      }
    })
  })
})
