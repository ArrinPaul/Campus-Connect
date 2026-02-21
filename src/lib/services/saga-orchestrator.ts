/**
 * Saga Orchestrator — Distributed Transaction Coordination
 *
 * Implements the Saga pattern for operations that span multiple services or
 * Convex tables and need eventual consistency with compensating actions.
 *
 * Each saga is a sequence of steps.  If any step fails the orchestrator runs
 * the compensating ("undo") actions for all previously completed steps in
 * reverse order.
 *
 * Features:
 *   • Declarative step + compensation pairs
 *   • Automatic rollback on failure
 *   • Persistent execution log for audit / replay
 *   • Configurable retry per step
 *   • Hooks: onComplete, onRollback, onStepComplete
 *
 * Usage:
 *   const saga = SagaOrchestrator.create("create-post-with-media")
 *     .step({
 *       name: "upload-media",
 *       execute:    async (ctx) => { ... },
 *       compensate: async (ctx) => { ... },
 *     })
 *     .step({ name: "save-post",   execute: ...,  compensate: ... })
 *     .step({ name: "index-search", execute: ..., compensate: ... })
 *
 *   const result = await saga.run({ userId: "u1" })
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type StepStatus = "pending" | "running" | "completed" | "failed" | "compensated"
export type SagaStatus = "pending" | "running" | "completed" | "rolled_back" | "failed"

export interface SagaContext {
  /** Correlation id for the entire saga execution */
  sagaId: string
  /** Shared data store that steps can read from or write to */
  data: Record<string, unknown>
  /** Original input passed to `run()` */
  input: Record<string, unknown>
}

export interface SagaStep {
  name: string
  /** Forward action — should return a result that gets stored in `ctx.data[name]`. */
  execute: (ctx: SagaContext) => Promise<unknown>
  /** Compensating action — called during rollback with the same context. */
  compensate: (ctx: SagaContext) => Promise<void>
  /** Max retries for the execute action (default: 0 — no retry). */
  maxRetries?: number
  /** Base delay for retry back-off in ms (default: 100). */
  retryDelayMs?: number
}

export interface StepLogEntry {
  stepName: string
  status: StepStatus
  startedAt: string
  completedAt?: string
  error?: string
  result?: unknown
}

export interface SagaResult {
  sagaId: string
  sagaName: string
  status: SagaStatus
  data: Record<string, unknown>
  log: StepLogEntry[]
  startedAt: string
  completedAt: string
  durationMs: number
}

export interface SagaHooks {
  onStepComplete?: (stepName: string, result: unknown, ctx: SagaContext) => void
  onComplete?:     (result: SagaResult) => void
  onRollback?:     (result: SagaResult) => void
}

// ─── Implementation ──────────────────────────────────────────────────────────

export class SagaOrchestrator {
  private sagaName: string
  private steps: SagaStep[] = []
  private hooks: SagaHooks = {}

  private constructor(name: string) {
    this.sagaName = name
  }

  /** Create a named saga orchestrator. */
  static create(name: string): SagaOrchestrator {
    return new SagaOrchestrator(name)
  }

  /** Add a step to the saga (builder pattern — returns `this`). */
  step(stepDef: SagaStep): this {
    this.steps.push(stepDef)
    return this
  }

  /** Attach lifecycle hooks. */
  onHooks(hooks: SagaHooks): this {
    this.hooks = { ...this.hooks, ...hooks }
    return this
  }

  // ── Execution ───────────────────────────────────────────────────────────

  /**
   * Run the saga with the given input.
   *
   * Returns a `SagaResult` describing every step that executed, any errors,
   * and whether the saga completed or was rolled back.
   */
  async run(input: Record<string, unknown> = {}): Promise<SagaResult> {
    const sagaId = generateSagaId()
    const startedAt = new Date().toISOString()
    const startMs = Date.now()

    const ctx: SagaContext = {
      sagaId,
      data: {},
      input: { ...input },
    }

    const log: StepLogEntry[] = []
    const completedSteps: SagaStep[] = []

    let status: SagaStatus = "running"

    for (const step of this.steps) {
      const entry: StepLogEntry = {
        stepName: step.name,
        status: "running",
        startedAt: new Date().toISOString(),
      }

      try {
        const result = await this.executeWithRetry(step, ctx)
        ctx.data[step.name] = result
        completedSteps.push(step)

        entry.status = "completed"
        entry.result = result
        entry.completedAt = new Date().toISOString()
        log.push(entry)

        this.hooks.onStepComplete?.(step.name, result, ctx)
      } catch (err) {
        entry.status = "failed"
        entry.error = err instanceof Error ? err.message : String(err)
        entry.completedAt = new Date().toISOString()
        log.push(entry)

        // Rollback all completed steps in reverse
        const rollbackLog = await this.rollback(completedSteps, ctx)
        log.push(...rollbackLog)

        status = "rolled_back"

        const result: SagaResult = {
          sagaId,
          sagaName: this.sagaName,
          status,
          data: ctx.data,
          log,
          startedAt,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - startMs,
        }

        this.hooks.onRollback?.(result)
        return result
      }
    }

    status = "completed"
    const result: SagaResult = {
      sagaId,
      sagaName: this.sagaName,
      status,
      data: ctx.data,
      log,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startMs,
    }

    this.hooks.onComplete?.(result)
    return result
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private async executeWithRetry(step: SagaStep, ctx: SagaContext): Promise<unknown> {
    const maxRetries = step.maxRetries ?? 0
    const retryDelay = step.retryDelayMs ?? 100
    let lastError: unknown

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await step.execute(ctx)
      } catch (err) {
        lastError = err
        if (attempt < maxRetries) {
          await sleep(retryDelay * 2 ** attempt)
        }
      }
    }
    throw lastError
  }

  private async rollback(completedSteps: SagaStep[], ctx: SagaContext): Promise<StepLogEntry[]> {
    const log: StepLogEntry[] = []

    // Compensate in reverse order
    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const step = completedSteps[i]
      const entry: StepLogEntry = {
        stepName: `${step.name} [compensate]`,
        status: "running",
        startedAt: new Date().toISOString(),
      }

      try {
        await step.compensate(ctx)
        entry.status = "compensated"
      } catch (err) {
        entry.status = "failed"
        entry.error = err instanceof Error ? err.message : String(err)
      }

      entry.completedAt = new Date().toISOString()
      log.push(entry)
    }

    return log
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

let sagaCounter = 0

function generateSagaId(): string {
  sagaCounter += 1
  const time = Date.now().toString(36)
  const seq = sagaCounter.toString(36).padStart(4, "0")
  return `saga_${time}_${seq}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
