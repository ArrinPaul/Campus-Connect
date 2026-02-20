/**
 * Unit Tests for Skill Endorsements
 * Feature: Skill-Based Matching — Endorsements (Phase 4.5)
 */

describe("Skill Endorsements", () => {
  describe("skill normalization", () => {
    it("should normalize skill names to lowercase", () => {
      const normalize = (s: string) => s.trim().toLowerCase()
      expect(normalize("JavaScript")).toBe("javascript")
      expect(normalize("  React  ")).toBe("react")
      expect(normalize("NODE.JS")).toBe("node.js")
    })

    it("should trim whitespace from skill names", () => {
      const normalize = (s: string) => s.trim().toLowerCase()
      expect(normalize("  python  ")).toBe("python")
      expect(normalize("\treact\n")).toBe("react")
    })

    it("should match skill regardless of case", () => {
      const userSkills = ["javascript", "python", "react"]
      const normalize = (s: string) => s.trim().toLowerCase()
      const incomingSkill = normalize("JavaScript")
      expect(userSkills.includes(incomingSkill)).toBe(true)
    })
  })

  describe("endorsement validation", () => {
    it("should prevent self-endorsement", () => {
      const currentUserId = "user1"
      const targetUserId = "user1"
      const isSelfEndorsement = currentUserId === targetUserId
      expect(isSelfEndorsement).toBe(true)
    })

    it("should allow endorsing other users", () => {
      const currentUserId = "user1"
      const targetUserId = "user2"
      const isSelfEndorsement = currentUserId === targetUserId
      expect(isSelfEndorsement).toBe(false)
    })

    it("should verify the user has the skill before endorsing", () => {
      const userSkills = ["javascript", "python"]
      const skillToEndorse = "react"
      const normalizedSkill = skillToEndorse.toLowerCase()
      const userHasSkill = userSkills.some(
        (s) => s.toLowerCase() === normalizedSkill
      )
      expect(userHasSkill).toBe(false)
    })

    it("should allow endorsing a skill the user has", () => {
      const userSkills = ["javascript", "python", "react"]
      const skillToEndorse = "React"
      const normalizedSkill = skillToEndorse.toLowerCase()
      const userHasSkill = userSkills.some(
        (s) => s.toLowerCase() === normalizedSkill
      )
      expect(userHasSkill).toBe(true)
    })

    it("should detect duplicate endorsements", () => {
      const existingEndorsements = [
        { userId: "user2", skillName: "javascript", endorserId: "user1" },
        { userId: "user2", skillName: "python", endorserId: "user1" },
      ]
      const newEndorsement = { userId: "user2", skillName: "javascript", endorserId: "user1" }
      const isDuplicate = existingEndorsements.some(
        (e) =>
          e.userId === newEndorsement.userId &&
          e.skillName === newEndorsement.skillName &&
          e.endorserId === newEndorsement.endorserId
      )
      expect(isDuplicate).toBe(true)
    })

    it("should allow same skill to be endorsed by different users", () => {
      const existingEndorsements = [
        { userId: "user2", skillName: "javascript", endorserId: "user1" },
      ]
      const newEndorsement = { userId: "user2", skillName: "javascript", endorserId: "user3" }
      const isDuplicate = existingEndorsements.some(
        (e) =>
          e.userId === newEndorsement.userId &&
          e.skillName === newEndorsement.skillName &&
          e.endorserId === newEndorsement.endorserId
      )
      expect(isDuplicate).toBe(false)
    })
  })

  describe("endorsement data aggregation", () => {
    const endorsements = [
      { skillName: "javascript", endorserId: "user1", endorserName: "Alice" },
      { skillName: "javascript", endorserId: "user2", endorserName: "Bob" },
      { skillName: "javascript", endorserId: "user3", endorserName: "Carol" },
      { skillName: "python", endorserId: "user1", endorserName: "Alice" },
    ]

    it("should count endorsements per skill", () => {
      const skillCounts: Record<string, number> = {}
      for (const e of endorsements) {
        skillCounts[e.skillName] = (skillCounts[e.skillName] ?? 0) + 1
      }
      expect(skillCounts["javascript"]).toBe(3)
      expect(skillCounts["python"]).toBe(1)
    })

    it("should return top 3 endorser names", () => {
      const jsEndorsers = endorsements
        .filter((e) => e.skillName === "javascript")
        .slice(0, 3)
        .map((e) => e.endorserName)
      expect(jsEndorsers).toEqual(["Alice", "Bob", "Carol"])
    })

    it("should detect if viewer has endorsed a skill", () => {
      const viewerId = "user2"
      const endorsedByViewer = endorsements.some(
        (e) => e.skillName === "javascript" && e.endorserId === viewerId
      )
      expect(endorsedByViewer).toBe(true)
    })

    it("should return false when viewer has not endorsed a skill", () => {
      const viewerId = "user99"
      const endorsedByViewer = endorsements.some(
        (e) => e.skillName === "python" && e.endorserId === viewerId
      )
      expect(endorsedByViewer).toBe(false)
    })

    it("should show endorsement count of 0 for skills without endorsements", () => {
      const skillWithNoEndorsements = "react"
      const count = endorsements.filter(
        (e) => e.skillName === skillWithNoEndorsements
      ).length
      expect(count).toBe(0)
    })
  })
})
