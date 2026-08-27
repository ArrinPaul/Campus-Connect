/**
 * @jest-environment node
 */
import { evaluateBadges, BADGE_DEFINITIONS } from "@/server/db/gamification"

// Mock Supabase Server Client
const mockSelect = jest.fn()
const mockUpsert = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()

const mockSupabase = {
  from: jest.fn(() => ({
    select: mockSelect,
    upsert: mockUpsert,
  })),
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe("Phase 5 — P5-04 Achievement Badges & Evaluation", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const mockChain: any = {
      eq: jest.fn().mockReturnThis(),
      single: mockSingle,
    }

    mockSelect.mockReturnValue(mockChain)
    mockUpsert.mockResolvedValue({ error: null })
  })

  it("should award Top Researcher when user has uploaded papers and earned research votes", async () => {
    // 1. user_reputation
    mockSelect
      .mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { points: 60, badges: [] },
          }),
        }),
      })
      // 2. skill_endorsements
      .mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({ data: [] }),
      })
      // 3. reputation_events
      .mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({
          data: [{ event_type: "research_vote", points: 10 }],
        }),
      })
      // 4. research_papers
      .mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({ data: [{ id: "paper-1" }] }),
      })

    const badges = await evaluateBadges("scholar-1")
    expect(badges).toHaveLength(1)
    expect(badges[0].id).toBe("top_researcher")
    expect(badges[0].name).toBe("Top Researcher")
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "scholar-1",
        badges: expect.arrayContaining([expect.objectContaining({ id: "top_researcher" })]),
      })
    )
  })

  it("should award Helpful Peer and Campus Leader when criteria are satisfied", async () => {
    // 1. user_reputation (120 points)
    mockSelect
      .mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { points: 120, badges: [] },
          }),
        }),
      })
      // 2. skill_endorsements (5 endorsements)
      .mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({ data: [{}, {}, {}, {}, {}] }),
      })
      // 3. reputation_events (accepted answer)
      .mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({
          data: [{ event_type: "accepted_answer", points: 15 }],
        }),
      })
      // 4. research_papers (0 papers)
      .mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({ data: [] }),
      })

    const badges = await evaluateBadges("peer-1")
    const badgeIds = badges.map((b) => b.id)

    expect(badgeIds).toContain("helpful_peer")
    expect(badgeIds).toContain("campus_leader")
    expect(badgeIds).not.toContain("top_researcher")
  })

  it("should not duplicate badges on repeated evaluation (Idempotency)", async () => {
    const existingBadge = {
      ...BADGE_DEFINITIONS.CAMPUS_LEADER,
      earned_at: "2026-08-01T00:00:00Z",
    }

    mockSelect
      .mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { points: 150, badges: [existingBadge] },
          }),
        }),
      })
      .mockReturnValueOnce({ eq: jest.fn().mockResolvedValue({ data: [] }) })
      .mockReturnValueOnce({ eq: jest.fn().mockResolvedValue({ data: [] }) })
      .mockReturnValueOnce({ eq: jest.fn().mockResolvedValue({ data: [] }) })

    const badges = await evaluateBadges("user-1")
    expect(badges).toHaveLength(1)
    expect(badges[0].id).toBe("campus_leader")
    // Upsert should not even be called since no new badges were added
    expect(mockUpsert).not.toHaveBeenCalled()
  })
})
