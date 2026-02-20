import { PRO_FEATURES, PRICING } from "./subscriptions"

// ──────────────────────────────────────────────
// Pure logic extracted for testing
// ──────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000

function calcPeriodEnd(plan: "monthly" | "yearly", from: number): number {
  return plan === "monthly" ? from + 30 * DAY : from + 365 * DAY
}

function daysRemaining(expiresAt: number, now: number): number {
  return Math.max(0, Math.ceil((expiresAt - now) / DAY))
}

function isProActive(
  isPro: boolean | undefined,
  proExpiresAt: number | undefined,
  now: number
): boolean {
  return !!(isPro && proExpiresAt && proExpiresAt > now)
}

function planTransition(
  currentStatus: string,
  event: string
): { status: string; isPro: boolean } {
  if (event === "customer.subscription.deleted") {
    return { status: "cancelled", isPro: false }
  }
  if (event === "customer.subscription.updated") {
    return { status: currentStatus === "active" ? "active" : "past_due", isPro: currentStatus === "active" }
  }
  return { status: currentStatus, isPro: true }
}

function validateUpgradeArgs(plan: string): { valid: boolean; error?: string } {
  if (!["monthly", "yearly"].includes(plan)) {
    return { valid: false, error: "Invalid plan. Must be monthly or yearly." }
  }
  return { valid: true }
}

function buildSubRecord(
  userId: string,
  plan: "monthly" | "yearly",
  now: number
) {
  return {
    userId,
    plan: "pro",
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: calcPeriodEnd(plan, now),
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  }
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe("subscriptions – pricing constants", () => {
  test("monthly plan has correct price", () => {
    expect(PRICING.monthly.amount).toBe(999)
    expect(PRICING.monthly.interval).toBe("month")
  })

  test("yearly plan has correct price", () => {
    expect(PRICING.yearly.amount).toBe(7999)
    expect(PRICING.yearly.interval).toBe("year")
  })

  test("yearly plan is cheaper per month than monthly", () => {
    const monthlyPerYear = PRICING.monthly.amount * 12
    expect(PRICING.yearly.amount).toBeLessThan(monthlyPerYear)
  })
})

describe("subscriptions – PRO_FEATURES", () => {
  test("has at least 5 features", () => {
    expect(PRO_FEATURES.length).toBeGreaterThanOrEqual(5)
  })

  test("every feature has key, label, description", () => {
    for (const f of PRO_FEATURES) {
      expect(f.key).toBeTruthy()
      expect(f.label).toBeTruthy()
      expect(f.description).toBeTruthy()
    }
  })

  test("feature keys are unique", () => {
    const keys = PRO_FEATURES.map((f) => f.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  test("includes analytics and advanced_search", () => {
    const keys = PRO_FEATURES.map((f) => f.key)
    expect(keys).toContain("advanced_search")
    expect(keys).toContain("profile_analytics")
  })
})

describe("subscriptions – period calculation", () => {
  const BASE = 1_700_000_000_000

  test("monthly adds 30 days", () => {
    const end = calcPeriodEnd("monthly", BASE)
    expect(end - BASE).toBe(30 * DAY)
  })

  test("yearly adds 365 days", () => {
    const end = calcPeriodEnd("yearly", BASE)
    expect(end - BASE).toBe(365 * DAY)
  })

  test("yearly period is longer than monthly", () => {
    expect(calcPeriodEnd("yearly", BASE)).toBeGreaterThan(calcPeriodEnd("monthly", BASE))
  })
})

describe("subscriptions – daysRemaining", () => {
  const NOW = 1_700_000_000_000

  test("returns 0 when expired", () => {
    expect(daysRemaining(NOW - DAY, NOW)).toBe(0)
  })

  test("returns 1 when expiring in 12 hours (ceil)", () => {
    expect(daysRemaining(NOW + 12 * 60 * 60 * 1000, NOW)).toBe(1)
  })

  test("returns 30 when monthly just started", () => {
    expect(daysRemaining(NOW + 30 * DAY, NOW)).toBe(30)
  })

  test("returns 365 when yearly just started", () => {
    expect(daysRemaining(NOW + 365 * DAY, NOW)).toBe(365)
  })
})

describe("subscriptions – isProActive", () => {
  const FUTURE = Date.now() + 100_000_000
  const PAST = Date.now() - 1_000

  test("returns true when isPro=true and not expired", () => {
    expect(isProActive(true, FUTURE, Date.now())).toBe(true)
  })

  test("returns false when isPro=false", () => {
    expect(isProActive(false, FUTURE, Date.now())).toBe(false)
  })

  test("returns false when expired", () => {
    expect(isProActive(true, PAST, Date.now())).toBe(false)
  })

  test("returns false when proExpiresAt is undefined", () => {
    expect(isProActive(true, undefined, Date.now())).toBe(false)
  })
})

describe("subscriptions – planTransition (webhook logic)", () => {
  test("deletion sets cancelled and isPro=false", () => {
    const r = planTransition("active", "customer.subscription.deleted")
    expect(r.status).toBe("cancelled")
    expect(r.isPro).toBe(false)
  })

  test("update with active status stays active", () => {
    const r = planTransition("active", "customer.subscription.updated")
    expect(r.status).toBe("active")
    expect(r.isPro).toBe(true)
  })

  test("update with non-active status becomes past_due", () => {
    const r = planTransition("past_due", "customer.subscription.updated")
    expect(r.status).toBe("past_due")
    expect(r.isPro).toBe(false)
  })

  test("unknown event is a no-op", () => {
    const r = planTransition("active", "invoice.paid")
    expect(r.status).toBe("active")
    expect(r.isPro).toBe(true)
  })
})

describe("subscriptions – validateUpgradeArgs", () => {
  test("accepts monthly", () => {
    expect(validateUpgradeArgs("monthly").valid).toBe(true)
  })

  test("accepts yearly", () => {
    expect(validateUpgradeArgs("yearly").valid).toBe(true)
  })

  test("rejects unknown plan", () => {
    const r = validateUpgradeArgs("lifetime")
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/invalid plan/i)
  })

  test("rejects empty string", () => {
    expect(validateUpgradeArgs("").valid).toBe(false)
  })
})

describe("subscriptions – buildSubRecord", () => {
  const NOW = 1_700_000_000_000

  test("monthly record has correct fields", () => {
    const r = buildSubRecord("user123", "monthly", NOW)
    expect(r.plan).toBe("pro")
    expect(r.status).toBe("active")
    expect(r.cancelAtPeriodEnd).toBe(false)
    expect(r.currentPeriodEnd).toBe(NOW + 30 * DAY)
  })

  test("yearly record has correct fields", () => {
    const r = buildSubRecord("user123", "yearly", NOW)
    expect(r.currentPeriodEnd).toBe(NOW + 365 * DAY)
  })

  test("timestamps are set", () => {
    const r = buildSubRecord("user123", "monthly", NOW)
    expect(r.createdAt).toBe(NOW)
    expect(r.updatedAt).toBe(NOW)
    expect(r.currentPeriodStart).toBe(NOW)
  })

  test("userId is stored", () => {
    const r = buildSubRecord("userABC", "monthly", NOW)
    expect(r.userId).toBe("userABC")
  })
})
