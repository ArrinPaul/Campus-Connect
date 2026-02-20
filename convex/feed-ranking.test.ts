/**
 * Unit Tests for Feed Ranking Algorithm (Phase 4.2)
 * Tests scoring functions, weights, and ranking properties.
 */
import {
  recencyScore,
  relevanceScore,
  engagementScore,
  relationshipScore,
  computeFeedScore,
  FEED_WEIGHTS,
} from "./feed-ranking"

const HOUR_MS = 1000 * 60 * 60

describe("Feed Ranking Algorithm", () => {
  // ────────────────────────────────────────────
  // Recency score
  // ────────────────────────────────────────────
  describe("recencyScore", () => {
    const now = Date.now()

    it("should return ~1 for a brand-new post", () => {
      expect(recencyScore(now, now)).toBeCloseTo(1, 5)
    })

    it("should return ~0.5 after 24 hours (half-life)", () => {
      const twentyFourHoursAgo = now - 24 * HOUR_MS
      expect(recencyScore(twentyFourHoursAgo, now)).toBeCloseTo(0.5, 1)
    })

    it("should return ~0.25 after 48 hours", () => {
      const fortyEightHoursAgo = now - 48 * HOUR_MS
      expect(recencyScore(fortyEightHoursAgo, now)).toBeCloseTo(0.25, 1)
    })

    it("should return 0 for posts older than 7 days", () => {
      const eightDaysAgo = now - 8 * 24 * HOUR_MS
      expect(recencyScore(eightDaysAgo, now)).toBe(0)
    })

    it("should return 1 for future timestamps", () => {
      const futureTime = now + HOUR_MS
      expect(recencyScore(futureTime, now)).toBe(1)
    })

    it("newer posts should always score higher than older posts", () => {
      const recent = recencyScore(now - 1 * HOUR_MS, now)
      const older = recencyScore(now - 12 * HOUR_MS, now)
      const oldest = recencyScore(now - 48 * HOUR_MS, now)
      expect(recent).toBeGreaterThan(older)
      expect(older).toBeGreaterThan(oldest)
    })

    it("should be monotonically decreasing with age", () => {
      const scores = [0, 1, 6, 12, 24, 48, 96, 168].map((hours) =>
        recencyScore(now - hours * HOUR_MS, now)
      )
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1])
      }
    })
  })

  // ────────────────────────────────────────────
  // Relevance score (skill overlap)
  // ────────────────────────────────────────────
  describe("relevanceScore", () => {
    it("should return 0 for no overlap", () => {
      expect(relevanceScore(["Python"], ["Java"])).toBe(0)
    })

    it("should return 1 for identical skills", () => {
      expect(relevanceScore(["Python", "React"], ["Python", "React"])).toBe(1)
    })

    it("should be case-insensitive", () => {
      expect(relevanceScore(["python"], ["Python"])).toBe(1)
    })

    it("should return correct Jaccard for partial overlap", () => {
      // {python, react} ∩ {python, java} = {python} → 1/3
      expect(
        relevanceScore(["Python", "React"], ["Python", "Java"])
      ).toBeCloseTo(1 / 3, 5)
    })

    it("should return 0 for two empty sets", () => {
      expect(relevanceScore([], [])).toBe(0)
    })
  })

  // ────────────────────────────────────────────
  // Engagement score
  // ────────────────────────────────────────────
  describe("engagementScore", () => {
    it("should return 0 for no engagement", () => {
      expect(engagementScore(undefined, 0, 0)).toBe(0)
    })

    it("should increase with more reactions", () => {
      const low = engagementScore(
        { like: 1, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 },
        0,
        0
      )
      const high = engagementScore(
        { like: 50, love: 10, laugh: 5, wow: 5, sad: 2, scholarly: 3 },
        0,
        0
      )
      expect(high).toBeGreaterThan(low)
    })

    it("should weight comments more than reactions", () => {
      const reactionsOnly = engagementScore(
        { like: 1, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 },
        0,
        0
      )
      const commentsOnly = engagementScore(undefined, 1, 0) // 1 comment = 2 raw vs 1 reaction
      expect(commentsOnly).toBeGreaterThan(reactionsOnly)
    })

    it("should weight shares highest", () => {
      const oneReaction = engagementScore(
        { like: 1, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 },
        0,
        0
      )
      const oneShare = engagementScore(undefined, 0, 1) // 1 share = 3 raw
      expect(oneShare).toBeGreaterThan(oneReaction)
    })

    it("should cap at 1.0", () => {
      const extreme = engagementScore(
        { like: 1000, love: 500, laugh: 200, wow: 100, sad: 50, scholarly: 50 },
        500,
        300
      )
      expect(extreme).toBeLessThanOrEqual(1)
    })

    it("should be in [0, 1] range", () => {
      const values = [
        engagementScore(undefined, 0, 0),
        engagementScore(
          { like: 5, love: 3, laugh: 1, wow: 0, sad: 0, scholarly: 0 },
          2,
          1
        ),
        engagementScore(
          { like: 100, love: 50, laugh: 25, wow: 10, sad: 5, scholarly: 5 },
          50,
          20
        ),
      ]
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    })
  })

  // ────────────────────────────────────────────
  // Relationship score
  // ────────────────────────────────────────────
  describe("relationshipScore", () => {
    it("should return 0 for no interactions", () => {
      expect(relationshipScore(0)).toBe(0)
    })

    it("should return 1 for 10+ interactions", () => {
      expect(relationshipScore(10)).toBe(1)
      expect(relationshipScore(20)).toBe(1)
    })

    it("should return 0.5 for 5 interactions", () => {
      expect(relationshipScore(5)).toBeCloseTo(0.5, 5)
    })

    it("should be monotonically increasing", () => {
      const scores = [0, 1, 3, 5, 7, 10, 15].map(relationshipScore)
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1])
      }
    })
  })

  // ────────────────────────────────────────────
  // Composite feed score
  // ────────────────────────────────────────────
  describe("computeFeedScore", () => {
    it("should return 0 when all signals are 0", () => {
      expect(
        computeFeedScore({
          recency: 0,
          relevance: 0,
          engagement: 0,
          relationship: 0,
        })
      ).toBe(0)
    })

    it("should return 1 when all signals are 1", () => {
      expect(
        computeFeedScore({
          recency: 1,
          relevance: 1,
          engagement: 1,
          relationship: 1,
        })
      ).toBeCloseTo(1, 5)
    })

    it("should give higher weight to recency", () => {
      const recencyOnly = computeFeedScore({
        recency: 1,
        relevance: 0,
        engagement: 0,
        relationship: 0,
      })
      const relevanceOnly = computeFeedScore({
        recency: 0,
        relevance: 1,
        engagement: 0,
        relationship: 0,
      })
      expect(recencyOnly).toBeGreaterThan(relevanceOnly)
    })

    it("should rank a recent relevant post higher than an old irrelevant one", () => {
      const recentRelevant = computeFeedScore({
        recency: 0.9,
        relevance: 0.8,
        engagement: 0.3,
        relationship: 0.5,
      })
      const oldIrrelevant = computeFeedScore({
        recency: 0.1,
        relevance: 0.1,
        engagement: 0.5,
        relationship: 0.1,
      })
      expect(recentRelevant).toBeGreaterThan(oldIrrelevant)
    })
  })

  // ────────────────────────────────────────────
  // Feed weights
  // ────────────────────────────────────────────
  describe("FEED_WEIGHTS", () => {
    it("should sum to 1.0", () => {
      const total =
        FEED_WEIGHTS.recency +
        FEED_WEIGHTS.relevance +
        FEED_WEIGHTS.engagement +
        FEED_WEIGHTS.relationship
      expect(total).toBeCloseTo(1.0, 10)
    })

    it("recency should have the highest weight", () => {
      expect(FEED_WEIGHTS.recency).toBeGreaterThanOrEqual(
        Math.max(
          FEED_WEIGHTS.relevance,
          FEED_WEIGHTS.engagement,
          FEED_WEIGHTS.relationship
        )
      )
    })
  })

  // ────────────────────────────────────────────
  // Property: score monotonicity
  // Newer posts with same engagement should score higher
  // ────────────────────────────────────────────
  describe("Score monotonicity property", () => {
    it("newer posts should score higher with same engagement/relevance/relationship", () => {
      const now = Date.now()
      const baseParams = {
        relevance: 0.5,
        engagement: 0.5,
        relationship: 0.5,
      }

      const scores = [0, 2, 6, 12, 24, 48].map((hoursAgo) => {
        const recency = recencyScore(now - hoursAgo * HOUR_MS, now)
        return computeFeedScore({ ...baseParams, recency })
      })

      // Each score should be >= the next (monotonically decreasing)
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1])
      }
    })

    it("higher engagement should produce higher score with same recency/relevance/relationship", () => {
      const reactionSets = [
        undefined,
        { like: 1, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 },
        { like: 10, love: 5, laugh: 3, wow: 2, sad: 1, scholarly: 1 },
        { like: 50, love: 20, laugh: 10, wow: 5, sad: 3, scholarly: 2 },
      ] as const

      const baseParams = {
        recency: 0.8,
        relevance: 0.5,
        relationship: 0.5,
      }

      const scores = reactionSets.map((reactions) => {
        const eng = engagementScore(reactions as any, 5, 2)
        return computeFeedScore({ ...baseParams, engagement: eng })
      })

      // Monotonically increasing
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1])
      }
    })
  })
})
