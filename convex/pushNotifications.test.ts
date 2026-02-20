import {
  validatePushSubscription,
  validateEmailFrequency,
  buildPushPayload,
  shouldSendDigest,
  formatDigestSubject,
  EMAIL_FREQUENCIES,
} from "./pushNotifications"

// ──────────────────────────────────────────────
// EMAIL_FREQUENCIES constant
// ──────────────────────────────────────────────
describe("pushNotifications – EMAIL_FREQUENCIES", () => {
  test("contains daily, weekly, never", () => {
    expect(EMAIL_FREQUENCIES).toContain("daily")
    expect(EMAIL_FREQUENCIES).toContain("weekly")
    expect(EMAIL_FREQUENCIES).toContain("never")
  })

  test("has exactly 3 options", () => {
    expect(EMAIL_FREQUENCIES.length).toBe(3)
  })
})

// ──────────────────────────────────────────────
// validatePushSubscription
// ──────────────────────────────────────────────
describe("pushNotifications – validatePushSubscription", () => {
  const valid = {
    endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
    p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry",
    auth: "tBHItJI5svbpez7KI4CCXg==",
  }

  test("accepts valid subscription", () => {
    expect(() => validatePushSubscription(valid)).not.toThrow()
  })

  test("throws on empty endpoint", () => {
    expect(() => validatePushSubscription({ ...valid, endpoint: "" })).toThrow("required")
  })

  test("throws on non-HTTPS endpoint", () => {
    expect(() =>
      validatePushSubscription({ ...valid, endpoint: "http://fcm.googleapis.com/abc" })
    ).toThrow("HTTPS")
  })

  test("throws on empty p256dh", () => {
    expect(() => validatePushSubscription({ ...valid, p256dh: "" })).toThrow("required")
  })

  test("throws on short p256dh", () => {
    expect(() => validatePushSubscription({ ...valid, p256dh: "short" })).toThrow("invalid")
  })

  test("throws on empty auth", () => {
    expect(() => validatePushSubscription({ ...valid, auth: "" })).toThrow("required")
  })

  test("throws on short auth", () => {
    expect(() => validatePushSubscription({ ...valid, auth: "abc" })).toThrow("invalid")
  })
})

// ──────────────────────────────────────────────
// validateEmailFrequency
// ──────────────────────────────────────────────
describe("pushNotifications – validateEmailFrequency", () => {
  test("accepts daily", () => {
    expect(() => validateEmailFrequency("daily")).not.toThrow()
  })

  test("accepts weekly", () => {
    expect(() => validateEmailFrequency("weekly")).not.toThrow()
  })

  test("accepts never", () => {
    expect(() => validateEmailFrequency("never")).not.toThrow()
  })

  test("throws on invalid value", () => {
    expect(() => validateEmailFrequency("monthly")).toThrow("one of")
  })

  test("throws on empty string", () => {
    expect(() => validateEmailFrequency("")).toThrow("one of")
  })
})

// ──────────────────────────────────────────────
// buildPushPayload
// ──────────────────────────────────────────────
describe("pushNotifications – buildPushPayload", () => {
  test("new_message payload", () => {
    const p = buildPushPayload("new_message", { senderName: "Alice", preview: "Hey there!" })
    expect(p.title).toMatch(/Alice/)
    expect(p.body).toBe("Hey there!")
    expect(p.url).toBe("/messages")
  })

  test("new_comment payload", () => {
    const p = buildPushPayload("new_comment", { commenterName: "Bob", postId: "post1", preview: "Nice post" })
    expect(p.title).toMatch(/Bob/)
    expect(p.url).toBe("/posts/post1")
  })

  test("new_follower payload", () => {
    const p = buildPushPayload("new_follower", { followerName: "Carol", followerUsername: "carol" })
    expect(p.title).toMatch(/Carol/)
    expect(p.url).toBe("/profile/carol")
  })

  test("event_reminder payload", () => {
    const p = buildPushPayload("event_reminder", { eventTitle: "Hackathon", eventId: "ev1", eventTime: "Saturday 2pm" })
    expect(p.title).toMatch(/Hackathon/)
    expect(p.url).toBe("/events/ev1")
  })

  test("mention payload", () => {
    const p = buildPushPayload("mention", { mentionerName: "Dave", postId: "post2", preview: "Check this out @you" })
    expect(p.title).toMatch(/Dave/)
    expect(p.url).toBe("/posts/post2")
  })

  test("unknown type falls back to default", () => {
    const p = buildPushPayload("unknown_event", { message: "Something happened" })
    expect(p.title).toBe("Campus Connect")
    expect(p.body).toBe("Something happened")
    expect(p.url).toBe("/notifications")
  })

  test("missing data uses fallback strings", () => {
    const p = buildPushPayload("new_message", {})
    expect(p.title).toMatch(/someone/)
    expect(p.body).toBeTruthy()
  })
})

// ──────────────────────────────────────────────
// shouldSendDigest
// ──────────────────────────────────────────────
describe("pushNotifications – shouldSendDigest", () => {
  const monday = new Date("2026-02-16") // Monday
  const tuesday = new Date("2026-02-17")
  const wednesday = new Date("2026-02-18")

  test("daily frequency always returns true", () => {
    expect(shouldSendDigest("daily", monday)).toBe(true)
    expect(shouldSendDigest("daily", wednesday)).toBe(true)
  })

  test("never frequency always returns false", () => {
    expect(shouldSendDigest("never", monday)).toBe(false)
    expect(shouldSendDigest("never", wednesday)).toBe(false)
  })

  test("weekly frequency returns true only on Monday", () => {
    expect(shouldSendDigest("weekly", monday)).toBe(true)
  })

  test("weekly frequency returns false on non-Monday", () => {
    expect(shouldSendDigest("weekly", tuesday)).toBe(false)
    expect(shouldSendDigest("weekly", wednesday)).toBe(false)
  })
})

// ──────────────────────────────────────────────
// formatDigestSubject
// ──────────────────────────────────────────────
describe("pushNotifications – formatDigestSubject", () => {
  test("daily with updates includes count", () => {
    const s = formatDigestSubject("daily", 5)
    expect(s).toContain("Today's")
    expect(s).toContain("5")
  })

  test("daily with no updates omits count", () => {
    const s = formatDigestSubject("daily", 0)
    expect(s).toContain("Today's")
    expect(s).not.toContain("(0")
  })

  test("weekly subject uses 'This Week's'", () => {
    const s = formatDigestSubject("weekly", 12)
    expect(s).toContain("This Week's")
    expect(s).toContain("12")
  })

  test("subject always contains Campus Connect", () => {
    expect(formatDigestSubject("daily", 0)).toContain("Campus Connect")
    expect(formatDigestSubject("weekly", 3)).toContain("Campus Connect")
  })
})
