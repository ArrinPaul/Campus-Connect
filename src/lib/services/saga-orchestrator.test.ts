import { SagaOrchestrator } from "./saga-orchestrator"

describe("SagaOrchestrator", () => {
  // ── Happy Path ──────────────────────────────────────────────────────────

  it("executes all steps in order and returns completed", async () => {
    const order: string[] = []

    const result = await SagaOrchestrator.create("order-flow")
      .step({
        name: "reserve-stock",
        execute: async (ctx) => {
          order.push("reserve")
          ctx.data.reserved = true
        },
        compensate: async () => { order.push("unreserve") },
      })
      .step({
        name: "charge-payment",
        execute: async (ctx) => {
          order.push("charge")
          ctx.data.charged = true
        },
        compensate: async () => { order.push("refund") },
      })
      .step({
        name: "send-email",
        execute: async () => { order.push("email") },
        compensate: async () => { order.push("unsend") },
      })
      .run()

    expect(result.status).toBe("completed")
    expect(order).toEqual(["reserve", "charge", "email"])
    expect(result.data.reserved).toBe(true)
    expect(result.data.charged).toBe(true)
  })

  // ── Rollback ────────────────────────────────────────────────────────────

  it("rolls back completed steps in reverse when a step fails", async () => {
    const order: string[] = []

    const result = await SagaOrchestrator.create("rollback-test")
      .step({
        name: "step-a",
        execute: async () => { order.push("a") },
        compensate: async () => { order.push("undo-a") },
      })
      .step({
        name: "step-b",
        execute: async () => { order.push("b") },
        compensate: async () => { order.push("undo-b") },
      })
      .step({
        name: "step-c",
        execute: async () => { throw new Error("boom") },
        compensate: async () => { order.push("undo-c") },
      })
      .run()

    expect(result.status).toBe("rolled_back")
    expect(order).toEqual(["a", "b", "undo-b", "undo-a"])
  })

  // ── Shared Context ─────────────────────────────────────────────────────

  it("shares data between steps via ctx.data", async () => {
    const result = await SagaOrchestrator.create("shared-ctx")
      .step({
        name: "produce",
        execute: async (ctx) => { ctx.data.value = 42 },
        compensate: async () => {},
      })
      .step({
        name: "consume",
        execute: async (ctx) => { ctx.data.doubled = (ctx.data.value as number) * 2 },
        compensate: async () => {},
      })
      .run()

    expect(result.data.doubled).toBe(84)
  })

  // ── Retry ──────────────────────────────────────────────────────────────

  it("retries a failing step up to maxRetries before rolling back", async () => {
    let attempts = 0

    const result = await SagaOrchestrator.create("retry-test")
      .step({
        name: "flaky",
        execute: async () => {
          attempts++
          if (attempts < 3) throw new Error("transient")
        },
        compensate: async () => {},
        maxRetries: 3,
        retryDelayMs: 1,
      })
      .run()

    expect(result.status).toBe("completed")
    expect(attempts).toBe(3)
  })

  // ── Execution Log ──────────────────────────────────────────────────────

  it("records execution log with timestamps", async () => {
    const result = await SagaOrchestrator.create("log-test")
      .step({
        name: "step-1",
        execute: async () => {},
        compensate: async () => {},
      })
      .run()

    expect(result.log.length).toBe(1)
    expect(result.log[0].stepName).toBe("step-1")
    expect(result.log[0].status).toBe("completed")
    expect(result.log[0].startedAt).toBeDefined()
    expect(result.log[0].completedAt).toBeDefined()
  })

  // ── Hooks ──────────────────────────────────────────────────────────────

  it("invokes onStepComplete and onComplete hooks", async () => {
    const completed: string[] = []
    let sagaDone = false

    await SagaOrchestrator.create("hooks-test")
      .step({
        name: "a",
        execute: async () => {},
        compensate: async () => {},
      })
      .step({
        name: "b",
        execute: async () => {},
        compensate: async () => {},
      })
      .onHooks({
        onStepComplete: (step) => { completed.push(step) },
        onComplete: () => { sagaDone = true },
      })
      .run()

    expect(completed).toEqual(["a", "b"])
    expect(sagaDone).toBe(true)
  })

  it("invokes onRollback hook on failure", async () => {
    let rolledBack = false

    await SagaOrchestrator.create("rollback-hook")
      .step({
        name: "fail",
        execute: async () => { throw new Error("oops") },
        compensate: async () => {},
      })
      .onHooks({
        onRollback: () => { rolledBack = true },
      })
      .run()

    expect(rolledBack).toBe(true)
  })

  // ── Duration ───────────────────────────────────────────────────────────

  it("reports total saga duration", async () => {
    const result = await SagaOrchestrator.create("duration")
      .step({
        name: "wait",
        execute: async () => new Promise((r) => setTimeout(r, 10)),
        compensate: async () => {},
      })
      .run()

    expect(result.durationMs).toBeGreaterThanOrEqual(5)
  })

  // ── Empty saga ─────────────────────────────────────────────────────────

  it("completes immediately when no steps are defined", async () => {
    const result = await SagaOrchestrator.create("empty").run()
    expect(result.status).toBe("completed")
    expect(result.log).toEqual([])
  })
})
