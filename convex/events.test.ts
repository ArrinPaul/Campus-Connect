/**
 * Unit Tests for Events & Scheduling
 * Feature: Events (Phase 5.3)
 * These test pure logic extracted from events.ts — no Convex test harness required.
 */

// ────────────────────────────────────────────────────────────
// Event validation helpers (mirrors events.ts validation logic)
// ────────────────────────────────────────────────────────────
function validateEventTitle(title: string): string | null {
  if (!title || title.trim().length === 0) return "Event title cannot be empty"
  if (title.length > 200) return "Event title must not exceed 200 characters"
  return null
}

function validateEventDescription(description: string): string | null {
  if (description.length > 5000) return "Event description must not exceed 5000 characters"
  return null
}

function validateEventDates(startDate: number, endDate: number, now = Date.now()): string | null {
  if (startDate >= endDate) return "End date must be after start date"
  if (startDate < now - 60_000) return "Start date cannot be in the past"
  return null
}

function validateMaxAttendees(maxAttendees: number): string | null {
  if (maxAttendees < 1) return "Max attendees must be at least 1"
  return null
}

// ────────────────────────────────────────────────────────────
// RSVP helpers
// ────────────────────────────────────────────────────────────
function computeAttendeeCountDelta(
  existingStatus: string | null,
  newStatus: string
): number {
  const wasGoing = existingStatus === "going"
  const isNowGoing = newStatus === "going"
  if (isNowGoing && !wasGoing) return 1
  if (!isNowGoing && wasGoing) return -1
  return 0
}

function checkCapacity(
  attendeeCount: number,
  maxAttendees: number | undefined,
  existingStatus: string | null,
  newStatus: string
): string | null {
  if (newStatus !== "going") return null
  if (existingStatus === "going") return null // no change
  if (maxAttendees === undefined) return null
  if (attendeeCount >= maxAttendees) return "Event is at full capacity"
  return null
}

// ────────────────────────────────────────────────────────────
// Date utility helpers (mirrors frontend formatting)
// ────────────────────────────────────────────────────────────
function formatEventDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function isEventUpcoming(startDate: number, now = Date.now()): boolean {
  return startDate >= now
}

function isEventPast(startDate: number, now = Date.now()): boolean {
  return startDate < now
}

// ────────────────────────────────────────────────────────────
// Sort helpers
// ────────────────────────────────────────────────────────────
function sortEventsByStartDate(events: { startDate: number }[], direction: "asc" | "desc") {
  return [...events].sort((a, b) =>
    direction === "asc" ? a.startDate - b.startDate : b.startDate - a.startDate
  )
}

// ────────────────────────────────────────────────────────────
// Tests: Event title validation
// ────────────────────────────────────────────────────────────
describe("Event title validation", () => {
  it("should reject empty title", () => {
    expect(validateEventTitle("")).toBe("Event title cannot be empty")
    expect(validateEventTitle("   ")).toBe("Event title cannot be empty")
  })

  it("should reject titles over 200 characters", () => {
    const longTitle = "a".repeat(201)
    expect(validateEventTitle(longTitle)).toBe("Event title must not exceed 200 characters")
  })

  it("should accept valid titles", () => {
    expect(validateEventTitle("Weekly Study Group")).toBeNull()
    expect(validateEventTitle("a".repeat(200))).toBeNull()
  })
})

// ────────────────────────────────────────────────────────────
// Tests: Event description validation
// ────────────────────────────────────────────────────────────
describe("Event description validation", () => {
  it("should reject descriptions over 5000 characters", () => {
    expect(validateEventDescription("a".repeat(5001))).toBe(
      "Event description must not exceed 5000 characters"
    )
  })

  it("should accept empty or normal descriptions", () => {
    expect(validateEventDescription("")).toBeNull()
    expect(validateEventDescription("Come join us for a study session!")).toBeNull()
    expect(validateEventDescription("a".repeat(5000))).toBeNull()
  })
})

// ────────────────────────────────────────────────────────────
// Tests: Event date validation
// ────────────────────────────────────────────────────────────
describe("Event date validation", () => {
  const now = Date.now()
  const future1h = now + 3_600_000
  const future2h = now + 7_200_000
  const past2h = now - 7_200_000

  it("should reject when end date is before start date", () => {
    expect(validateEventDates(future2h, future1h, now)).toBe(
      "End date must be after start date"
    )
  })

  it("should reject when start equals end date", () => {
    expect(validateEventDates(future1h, future1h, now)).toBe(
      "End date must be after start date"
    )
  })

  it("should reject start dates more than 1 minute in the past", () => {
    expect(validateEventDates(past2h, future1h, now)).toBe(
      "Start date cannot be in the past"
    )
  })

  it("should accept valid future dates", () => {
    expect(validateEventDates(future1h, future2h, now)).toBeNull()
  })

  it("should accept start date within the 1-minute grace window", () => {
    const almostNow = now - 30_000 // 30 seconds ago (within grace)
    expect(validateEventDates(almostNow, future1h, now)).toBeNull()
  })
})

// ────────────────────────────────────────────────────────────
// Tests: Max attendees validation
// ────────────────────────────────────────────────────────────
describe("Max attendees validation", () => {
  it("should reject 0 or negative", () => {
    expect(validateMaxAttendees(0)).toBe("Max attendees must be at least 1")
    expect(validateMaxAttendees(-5)).toBe("Max attendees must be at least 1")
  })

  it("should accept positive numbers", () => {
    expect(validateMaxAttendees(1)).toBeNull()
    expect(validateMaxAttendees(100)).toBeNull()
  })
})

// ────────────────────────────────────────────────────────────
// Tests: RSVP attendeeCount delta
// ────────────────────────────────────────────────────────────
describe("RSVP attendeeCount delta", () => {
  it("should increment when new RSVP is going", () => {
    expect(computeAttendeeCountDelta(null, "going")).toBe(1)
    expect(computeAttendeeCountDelta("maybe", "going")).toBe(1)
    expect(computeAttendeeCountDelta("not_going", "going")).toBe(1)
  })

  it("should decrement when changing from going to another status", () => {
    expect(computeAttendeeCountDelta("going", "maybe")).toBe(-1)
    expect(computeAttendeeCountDelta("going", "not_going")).toBe(-1)
  })

  it("should return 0 when status does not cross going boundary", () => {
    expect(computeAttendeeCountDelta("going", "going")).toBe(0)
    expect(computeAttendeeCountDelta("maybe", "not_going")).toBe(0)
    expect(computeAttendeeCountDelta(null, "maybe")).toBe(0)
  })
})

// ────────────────────────────────────────────────────────────
// Tests: Capacity check
// ────────────────────────────────────────────────────────────
describe("Event capacity check", () => {
  it("should return error when full and trying to RSVP going", () => {
    expect(checkCapacity(10, 10, null, "going")).toBe("Event is at full capacity")
    expect(checkCapacity(10, 10, "maybe", "going")).toBe("Event is at full capacity")
  })

  it("should allow changing RSVP from going to going (no-op)", () => {
    expect(checkCapacity(10, 10, "going", "going")).toBeNull()
  })

  it("should allow maybe/not_going even if full", () => {
    expect(checkCapacity(10, 10, null, "maybe")).toBeNull()
    expect(checkCapacity(10, 10, null, "not_going")).toBeNull()
  })

  it("should allow going when under capacity", () => {
    expect(checkCapacity(5, 10, null, "going")).toBeNull()
  })

  it("should allow going when no maxAttendees set", () => {
    expect(checkCapacity(1000, undefined, null, "going")).toBeNull()
  })
})

// ────────────────────────────────────────────────────────────
// Tests: Event upcoming/past logic
// ────────────────────────────────────────────────────────────
describe("Event upcoming/past categorization", () => {
  const now = 1_000_000

  it("should identify upcoming events correctly", () => {
    expect(isEventUpcoming(now + 1, now)).toBe(true)
    expect(isEventUpcoming(now, now)).toBe(true)
    expect(isEventUpcoming(now - 1, now)).toBe(false)
  })

  it("should identify past events correctly", () => {
    expect(isEventPast(now - 1, now)).toBe(true)
    expect(isEventPast(now, now)).toBe(false)
    expect(isEventPast(now + 1, now)).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────
// Tests: Event sorting
// ────────────────────────────────────────────────────────────
describe("Event sorting", () => {
  const events = [
    { startDate: 3000 },
    { startDate: 1000 },
    { startDate: 2000 },
  ]

  it("should sort ascending (soonest first)", () => {
    const sorted = sortEventsByStartDate(events, "asc")
    expect(sorted.map((e) => e.startDate)).toEqual([1000, 2000, 3000])
  })

  it("should sort descending (most recent first for past)", () => {
    const sorted = sortEventsByStartDate(events, "desc")
    expect(sorted.map((e) => e.startDate)).toEqual([3000, 2000, 1000])
  })

  it("should not mutate original array", () => {
    const original = events.map((e) => e.startDate)
    sortEventsByStartDate(events, "asc")
    expect(events.map((e) => e.startDate)).toEqual(original)
  })
})

// ────────────────────────────────────────────────────────────
// Integration: full event creation validation flow
// ────────────────────────────────────────────────────────────
describe("Full event creation validation", () => {
  const now = Date.now()

  it("should pass for valid event data", () => {
    const startDate = now + 3_600_000
    const endDate = now + 7_200_000
    expect(validateEventTitle("Study Session")).toBeNull()
    expect(validateEventDescription("Weekly review")).toBeNull()
    expect(validateEventDates(startDate, endDate, now)).toBeNull()
  })

  it("should collect all validation errors independently", () => {
    const errors = [
      validateEventTitle(""),
      validateEventDescription("x".repeat(5001)),
      validateEventDates(now - 7_200_000, now - 3_600_000, now),
    ].filter(Boolean)
    expect(errors.length).toBe(3)
  })
})
