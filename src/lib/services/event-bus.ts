/**
 * Inter-Service Communication — Event Bus + Message Router
 *
 * Provides in-process pub/sub messaging between services.  When the app scales
 * to multiple processes, this module can be swapped for Redis Pub/Sub, NATS, or
 * AWS SNS/SQS with zero changes to the service code.
 *
 * Features:
 *   • Typed events (ServiceEvent<T>)
 *   • Ordered & async subscriber handling with error isolation
 *   • Retry with exponential back-off for transient failures
 *   • Dead-letter queue for exhausted retries
 *   • Request/reply pattern via correlation ids
 *   • Metrics: emitted / delivered / failed counters
 *
 * Usage:
 *   import { EventBus } from "@/lib/services/event-bus"
 *
 *   const bus = EventBus.create()
 *   bus.subscribe("post.created", handler)
 *   await bus.publish({ type: "post.created", payload: { postId } })
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ServiceEvent<T = unknown> {
  /** Dot-namespaced event type, e.g. "posts.created", "users.deleted" */
  type: string
  /** Event payload */
  payload: T
  /** Source service name */
  source?: string
  /** Unique event id for idempotency / dedup */
  eventId?: string
  /** Correlation id to link request/reply chains */
  correlationId?: string
  /** ISO-8601 timestamp */
  timestamp?: string
  /** Arbitrary headers / metadata */
  metadata?: Record<string, unknown>
}

export type EventHandler<T = unknown> = (
  event: ServiceEvent<T>
) => Promise<void> | void

export interface SubscriptionOptions {
  /** Max retries before sending to DLQ (default: 3) */
  maxRetries?: number
  /** Base delay in ms for exponential back-off (default: 100) */
  retryDelayMs?: number
  /** Optional filter predicate — handler only fires when true */
  filter?: (event: ServiceEvent) => boolean
}

export interface EventBusMetrics {
  totalEmitted: number
  totalDelivered: number
  totalFailed: number
  deadLetterCount: number
}

interface Subscription {
  handler: EventHandler<any>
  options: Required<SubscriptionOptions>
}

// ─── Implementation ──────────────────────────────────────────────────────────

export class EventBus {
  private subscribers = new Map<string, Subscription[]>()
  private wildcardSubscribers: Subscription[] = []
  private deadLetterQueue: Array<{ event: ServiceEvent; error: unknown; exhaustedAt: string }> = []
  private metrics: EventBusMetrics = {
    totalEmitted: 0,
    totalDelivered: 0,
    totalFailed: 0,
    deadLetterCount: 0,
  }

  private constructor() {}

  static create(): EventBus {
    return new EventBus()
  }

  // ── Subscribe ───────────────────────────────────────────────────────────

  /**
   * Subscribe to events matching `eventType`.
   * Use `"*"` to subscribe to all events (wildcard).
   *
   * Returns an `unsubscribe` function.
   */
  subscribe<T = unknown>(
    eventType: string,
    handler: EventHandler<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    const sub: Subscription = {
      handler,
      options: {
        maxRetries: options.maxRetries ?? 3,
        retryDelayMs: options.retryDelayMs ?? 100,
        filter: options.filter ?? (() => true),
      },
    }

    if (eventType === "*") {
      this.wildcardSubscribers.push(sub)
      return () => {
        this.wildcardSubscribers = this.wildcardSubscribers.filter((s) => s !== sub)
      }
    }

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, [])
    }
    this.subscribers.get(eventType)!.push(sub)

    return () => {
      const subs = this.subscribers.get(eventType)
      if (subs) {
        this.subscribers.set(
          eventType,
          subs.filter((s) => s !== sub)
        )
      }
    }
  }

  // ── Publish ─────────────────────────────────────────────────────────────

  /**
   * Publish an event to all matching subscribers.
   *
   * Each subscriber is invoked independently; one handler's failure doesn't
   * prevent delivery to other handlers.
   */
  async publish<T = unknown>(event: ServiceEvent<T>): Promise<void> {
    const enriched: ServiceEvent<T> = {
      ...event,
      eventId: event.eventId ?? generateEventId(),
      timestamp: event.timestamp ?? new Date().toISOString(),
    }

    this.metrics.totalEmitted++

    const subs = [
      ...(this.subscribers.get(enriched.type) ?? []),
      ...this.wildcardSubscribers,
    ]

    const promises = subs.map((sub) => this.deliverWithRetry(enriched, sub))
    await Promise.allSettled(promises)
  }

  // ── Request / Reply ─────────────────────────────────────────────────────

  /**
   * Send a request event and wait for a reply on `<type>.reply`.
   *
   * Times out after `timeoutMs` (default: 5 000 ms).
   */
  async request<TReq = unknown, TRes = unknown>(
    event: ServiceEvent<TReq>,
    timeoutMs = 5_000
  ): Promise<ServiceEvent<TRes>> {
    const correlationId = event.correlationId ?? generateEventId()
    const replyType = `${event.type}.reply`

    return new Promise<ServiceEvent<TRes>>((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe()
        reject(new Error(`Request timeout for "${event.type}" (${timeoutMs}ms)`))
      }, timeoutMs)

      const unsubscribe = this.subscribe<TRes>(replyType, (reply) => {
        if (reply.correlationId === correlationId) {
          clearTimeout(timer)
          unsubscribe()
          resolve(reply)
        }
      })

      void this.publish({ ...event, correlationId })
    })
  }

  // ── Dead-Letter Queue ───────────────────────────────────────────────────

  /** Return and clear the DLQ. */
  drainDeadLetterQueue(): Array<{ event: ServiceEvent; error: unknown; exhaustedAt: string }> {
    const items = [...this.deadLetterQueue]
    this.deadLetterQueue = []
    this.metrics.deadLetterCount = 0
    return items
  }

  getDeadLetterQueue(): ReadonlyArray<{ event: ServiceEvent; error: unknown; exhaustedAt: string }> {
    return this.deadLetterQueue
  }

  // ── Metrics / Introspection ─────────────────────────────────────────────

  getMetrics(): Readonly<EventBusMetrics> {
    return { ...this.metrics }
  }

  listSubscriptions(): Array<{ type: string; count: number }> {
    const result: Array<{ type: string; count: number }> = []
    for (const [type, subs] of Array.from(this.subscribers.entries())) {
      result.push({ type, count: subs.length })
    }
    if (this.wildcardSubscribers.length > 0) {
      result.push({ type: "*", count: this.wildcardSubscribers.length })
    }
    return result
  }

  /** Remove all subscribers (useful in tests). */
  reset(): void {
    this.subscribers.clear()
    this.wildcardSubscribers = []
    this.deadLetterQueue = []
    this.metrics = { totalEmitted: 0, totalDelivered: 0, totalFailed: 0, deadLetterCount: 0 }
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private async deliverWithRetry(event: ServiceEvent, sub: Subscription): Promise<void> {
    const { maxRetries, retryDelayMs, filter } = sub.options

    if (!filter(event)) return

    let lastError: unknown
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await sub.handler(event)
        this.metrics.totalDelivered++
        return
      } catch (err) {
        lastError = err
        if (attempt < maxRetries) {
          await sleep(retryDelayMs * 2 ** attempt)
        }
      }
    }

    // All retries exhausted → DLQ
    this.metrics.totalFailed++
    this.metrics.deadLetterCount++
    this.deadLetterQueue.push({
      event,
      error: lastError,
      exhaustedAt: new Date().toISOString(),
    })
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

let eventCounter = 0

function generateEventId(): string {
  eventCounter += 1
  const time = Date.now().toString(36)
  const seq = eventCounter.toString(36).padStart(4, "0")
  return `evt_${time}_${seq}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
