/**
 * Gamification — Unit Tests
 *
 * Tests level calculation, reputation rules, achievement checks, and leaderboard sorting
 */

// ─── Extracted helpers (mirroring backend logic) ────────────────

const REPUTATION_RULES: Record<string, number> = {
  post_created: 10,
  comment_created: 5,
  receive_like: 1,
  receive_comment: 2,
  skill_endorsed: 3,
  answer_accepted: 15,
  paper_uploaded: 10,
  resource_uploaded: 5,
  question_asked: 3,
  answer_posted: 5,
}

function calculateLevel(reputation: number): number {
  if (reputation <= 0) return 1
  return Math.max(1, Math.floor(Math.sqrt(reputation / 10)))
}

const ACHIEVEMENT_DEFINITIONS = [
  { badge: "first_post", name: "First Post", description: "Published your first post" },
  { badge: "first_comment", name: "Commentator", description: "Left your first comment" },
  { badge: "popular_post", name: "Trending", description: "Got 10+ likes on a post" },
  { badge: "helpful", name: "Helpful", description: "Had an answer accepted" },
  { badge: "scholar", name: "Scholar", description: "Uploaded a research paper" },
  { badge: "teacher", name: "Teacher", description: "Shared a study resource" },
  { badge: "questioner", name: "Curious Mind", description: "Asked 10 questions" },
  { badge: "contributor", name: "Top Contributor", description: "Reached 100 reputation" },
  { badge: "expert", name: "Expert", description: "Reached 500 reputation" },
  { badge: "legend", name: "Legend", description: "Reached 1000 reputation" },
  { badge: "networker", name: "Networker", description: "Followed 20 people" },
  { badge: "endorsed", name: "Endorsed", description: "Received 5 skill endorsements" },
  { badge: "level_5", name: "Level 5", description: "Reached level 5" },
  { badge: "level_10", name: "Level 10", description: "Reached level 10" },
]

type UserStats = {
  reputation: number
  level: number
}

function checkReputationAchievements(
  stats: UserStats,
  earnedBadges: Set<string>
): string[] {
  const newAchievements: string[] = []

  if (stats.reputation >= 100 && !earnedBadges.has("contributor")) {
    newAchievements.push("contributor")
  }
  if (stats.reputation >= 500 && !earnedBadges.has("expert")) {
    newAchievements.push("expert")
  }
  if (stats.reputation >= 1000 && !earnedBadges.has("legend")) {
    newAchievements.push("legend")
  }
  if (stats.level >= 5 && !earnedBadges.has("level_5")) {
    newAchievements.push("level_5")
  }
  if (stats.level >= 10 && !earnedBadges.has("level_10")) {
    newAchievements.push("level_10")
  }

  return newAchievements
}

function calculateProgress(reputation: number) {
  const level = calculateLevel(reputation)
  const nextLevel = level + 1
  const repForNextLevel = nextLevel * nextLevel * 10
  const progress = Math.min(100, Math.round((reputation / repForNextLevel) * 100))
  return { level, nextLevel, repForNextLevel, progress }
}

type LeaderboardUser = {
  _id: string
  name: string
  reputation: number
  university?: string
}

function sortLeaderboard(users: LeaderboardUser[], university?: string, limit = 20) {
  let filtered = [...users]
  if (university) {
    const uni = university.toLowerCase()
    filtered = filtered.filter(
      (u) => u.university && u.university.toLowerCase().includes(uni)
    )
  }
  filtered.sort((a, b) => b.reputation - a.reputation)
  return filtered.slice(0, limit).map((u, i) => ({ ...u, rank: i + 1 }))
}

// ─── Tests ──────────────────────────────────────────────────────

describe("Gamification: Level Calculation", () => {
  test("level 1 for 0 reputation", () => {
    expect(calculateLevel(0)).toBe(1)
  })

  test("level 1 for negative reputation", () => {
    expect(calculateLevel(-5)).toBe(1)
  })

  test("level 1 for reputation 9", () => {
    // sqrt(9/10) = sqrt(0.9) ≈ 0.95 → floor = 0 → max(1,0) = 1
    expect(calculateLevel(9)).toBe(1)
  })

  test("level 1 for reputation 10", () => {
    // sqrt(10/10) = 1 → floor = 1
    expect(calculateLevel(10)).toBe(1)
  })

  test("level 2 for reputation 40", () => {
    // sqrt(40/10) = sqrt(4) = 2
    expect(calculateLevel(40)).toBe(2)
  })

  test("level 3 for reputation 90", () => {
    // sqrt(90/10) = sqrt(9) = 3
    expect(calculateLevel(90)).toBe(3)
  })

  test("level 5 for reputation 250", () => {
    // sqrt(250/10) = sqrt(25) = 5
    expect(calculateLevel(250)).toBe(5)
  })

  test("level 7 for reputation 500", () => {
    // sqrt(500/10) = sqrt(50) ≈ 7.07 → floor = 7
    expect(calculateLevel(500)).toBe(7)
  })

  test("level 10 for reputation 1000", () => {
    // sqrt(1000/10) = sqrt(100) = 10
    expect(calculateLevel(1000)).toBe(10)
  })

  test("level 14 for reputation 2000", () => {
    // sqrt(2000/10) = sqrt(200) ≈ 14.14 → floor = 14
    expect(calculateLevel(2000)).toBe(14)
  })
})

describe("Gamification: Reputation Rules", () => {
  test("all actions have defined points", () => {
    expect(Object.keys(REPUTATION_RULES).length).toBe(10)
  })

  test("post_created gives 10 points", () => {
    expect(REPUTATION_RULES.post_created).toBe(10)
  })

  test("answer_accepted gives 15 points (highest)", () => {
    expect(REPUTATION_RULES.answer_accepted).toBe(15)
  })

  test("receive_like gives 1 point (lowest)", () => {
    expect(REPUTATION_RULES.receive_like).toBe(1)
  })

  test("all points are positive", () => {
    Object.values(REPUTATION_RULES).forEach((v) => {
      expect(v).toBeGreaterThan(0)
    })
  })
})

describe("Gamification: Achievement Definitions", () => {
  test("14 achievements defined", () => {
    expect(ACHIEVEMENT_DEFINITIONS).toHaveLength(14)
  })

  test("all badges are unique", () => {
    const badges = ACHIEVEMENT_DEFINITIONS.map((d) => d.badge)
    expect(new Set(badges).size).toBe(badges.length)
  })

  test("all have required fields", () => {
    ACHIEVEMENT_DEFINITIONS.forEach((d) => {
      expect(d.badge).toBeTruthy()
      expect(d.name).toBeTruthy()
      expect(d.description).toBeTruthy()
    })
  })
})

describe("Gamification: Achievement Checks", () => {
  test("unlocks contributor at 100 reputation", () => {
    const result = checkReputationAchievements({ reputation: 100, level: 3 }, new Set())
    expect(result).toContain("contributor")
  })

  test("unlocks expert at 500 reputation", () => {
    const result = checkReputationAchievements({ reputation: 500, level: 7 }, new Set())
    expect(result).toContain("expert")
    expect(result).toContain("contributor") // also qualifies for contributor
  })

  test("unlocks legend at 1000 reputation", () => {
    const result = checkReputationAchievements({ reputation: 1000, level: 10 }, new Set())
    expect(result).toContain("legend")
    expect(result).toContain("expert")
    expect(result).toContain("contributor")
    expect(result).toContain("level_5")
    expect(result).toContain("level_10")
  })

  test("skips already earned badges", () => {
    const earned = new Set(["contributor", "level_5"])
    const result = checkReputationAchievements({ reputation: 500, level: 7 }, earned)
    expect(result).not.toContain("contributor")
    expect(result).not.toContain("level_5")
    expect(result).toContain("expert")
  })

  test("no achievements below 100 reputation", () => {
    const result = checkReputationAchievements({ reputation: 50, level: 2 }, new Set())
    expect(result).toHaveLength(0)
  })

  test("unlocks level_5 at level 5", () => {
    const result = checkReputationAchievements({ reputation: 250, level: 5 }, new Set())
    expect(result).toContain("level_5")
  })

  test("unlocks level_10 at level 10", () => {
    const result = checkReputationAchievements({ reputation: 1000, level: 10 }, new Set())
    expect(result).toContain("level_10")
  })
})

describe("Gamification: Progress Calculation", () => {
  test("level 1 progress at reputation 0", () => {
    const result = calculateProgress(0)
    expect(result.level).toBe(1)
    expect(result.nextLevel).toBe(2)
    expect(result.repForNextLevel).toBe(40) // 2^2 * 10
    expect(result.progress).toBe(0)
  })

  test("level 1 progress at reputation 20", () => {
    const result = calculateProgress(20)
    expect(result.level).toBe(1)
    expect(result.progress).toBe(50) // 20/40 = 50%
  })

  test("level 2 at reputation 40", () => {
    const result = calculateProgress(40)
    expect(result.level).toBe(2)
    expect(result.nextLevel).toBe(3)
    expect(result.repForNextLevel).toBe(90) // 3^2 * 10
  })

  test("progress caps at 100", () => {
    const result = calculateProgress(9999)
    expect(result.progress).toBeLessThanOrEqual(100)
  })
})

describe("Gamification: Leaderboard", () => {
  const users: LeaderboardUser[] = [
    { _id: "u1", name: "Alice", reputation: 500, university: "MIT" },
    { _id: "u2", name: "Bob", reputation: 1200, university: "Stanford" },
    { _id: "u3", name: "Charlie", reputation: 800, university: "MIT" },
    { _id: "u4", name: "Diana", reputation: 300, university: "Harvard" },
    { _id: "u5", name: "Eve", reputation: 950 },
  ]

  test("sorts by reputation descending", () => {
    const result = sortLeaderboard(users)
    expect(result[0].name).toBe("Bob") // 1200
    expect(result[1].name).toBe("Eve") // 950
    expect(result[2].name).toBe("Charlie") // 800
    expect(result[3].name).toBe("Alice") // 500
    expect(result[4].name).toBe("Diana") // 300
  })

  test("assigns correct ranks", () => {
    const result = sortLeaderboard(users)
    expect(result[0].rank).toBe(1)
    expect(result[4].rank).toBe(5)
  })

  test("filters by university", () => {
    const result = sortLeaderboard(users, "MIT")
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe("Charlie") // 800
    expect(result[1].name).toBe("Alice") // 500
  })

  test("limits results", () => {
    const result = sortLeaderboard(users, undefined, 3)
    expect(result).toHaveLength(3)
  })

  test("university filter is case-insensitive", () => {
    const result = sortLeaderboard(users, "mit")
    expect(result).toHaveLength(2)
  })

  test("empty result for non-matching university", () => {
    const result = sortLeaderboard(users, "Oxford")
    expect(result).toHaveLength(0)
  })

  test("skips users without university when filtering", () => {
    const result = sortLeaderboard(users, "Stanford")
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Bob")
  })
})
