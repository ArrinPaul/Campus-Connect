import { EventBus } from "./event-bus"

describe("EventBus", () => {
  let bus: EventBus

  beforeEach(() => {
    bus = EventBus.create()
  })

  afterEach(() => {
    bus.reset()
  })

  // ── Basic Pub/Sub ──────────────────────────────────────────────────────

  it("delivers events to subscribers", async () => {
    const received: unknown[] = []
    bus.subscribe("user.created", (event) => {
      received.push(event.payload)
    })

    await bus.publish({ type: "user.created", payload: { id: "u1" } })

    expect(received).toEqual([{ id: "u1" }])
  })

  it("supports multiple subscribers for the same event", async () => {
    let count = 0
    bus.subscribe("post.liked", () => { count++ })
    bus.subscribe("post.liked", () => { count++ })

    await bus.publish({ type: "post.liked", payload: {} })
    expect(count).toBe(2)
  })

  it("unsubscribes correctly", async () => {
    let count = 0
    const unsub = bus.subscribe("x", () => { count++ })
    unsub()

    await bus.publish({ type: "x", payload: {} })
    expect(count).toBe(0)
  })

  // ── Wildcard ───────────────────────────────────────────────────────────

  it("wildcard subscriber receives all events", async () => {
    const received: string[] = []
    bus.subscribe("*", (event) => {
      received.push(event.type)
    })

    await bus.publish({ type: "a", payload: {} })
    await bus.publish({ type: "b", payload: {} })

    expect(received).toEqual(["a", "b"])
  })

  // ── Retry & DLQ ────────────────────────────────────────────────────────

  it("retries failed handlers up to maxRetries", async () => {
    let attempts = 0
    bus.subscribe(
      "fragile",
      () => {
        attempts++
        if (attempts < 3) throw new Error("fail")
      },
      { maxRetries: 3, retryDelayMs: 1 }
    )

    await bus.publish({ type: "fragile", payload: {} })
    expect(attempts).toBe(3)
  })

  it("sends to DLQ after exhausting retries", async () => {
    bus.subscribe(
      "dead",
      () => { throw new Error("always fails") },
      { maxRetries: 1, retryDelayMs: 1 }
    )

    await bus.publish({ type: "dead", payload: { val: 42 } })

    const metrics = bus.getMetrics()
    expect(metrics.deadLetterCount).toBeGreaterThanOrEqual(1)
  })

  // ── Request/Reply ──────────────────────────────────────────────────────

  it("request() resolves with a reply", async () => {
    bus.subscribe("math.add", async (event) => {
      const { a, b } = event.payload as { a: number; b: number }
      if (event.correlationId) {
        await bus.publish({
          type: `math.add.reply`,
          payload: { result: a + b },
          correlationId: event.correlationId,
        })
      }
    })

    const reply = await bus.request<{ a: number; b: number }, { result: number }>(
      { type: "math.add", payload: { a: 2, b: 3 } },
      2000
    )
    expect(reply.payload).toEqual({ result: 5 })
  })

  it("request() times out when no reply arrives", async () => {
    await expect(
      bus.request({ type: "nobody.home", payload: {} }, 50)
    ).rejects.toThrow(/timeout/i)
  })

  // ── Metrics ────────────────────────────────────────────────────────────

  it("tracks publish and delivery counts", async () => {
    bus.subscribe("counted", () => {})

    await bus.publish({ type: "counted", payload: {} })
    await bus.publish({ type: "counted", payload: {} })

    const m = bus.getMetrics()
    expect(m.totalEmitted).toBeGreaterThanOrEqual(2)
    expect(m.totalDelivered).toBeGreaterThanOrEqual(2)
  })

  // ── Reset ──────────────────────────────────────────────────────────────

  it("reset() clears all subscribers, DLQ, and metrics", async () => {
    bus.subscribe("x", () => {})
    await bus.publish({ type: "x", payload: {} })
    bus.reset()
    const m = bus.getMetrics()
    expect(m.totalEmitted).toBe(0)
    expect(m.totalDelivered).toBe(0)
  })
})
