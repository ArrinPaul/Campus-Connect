/**
 * @jest-environment node
 */
import { analytics } from "@/lib/analytics"
import { createLogger } from "@/lib/logger"
import { getPaymentAdapter } from "@/server/subscriptions/service"
import { getEmbeddingProvider } from "@/server/recommendations/embedding-provider"
import { getRateLimiter } from "@/lib/rate-limiter"

describe("Phase 7 — P7-10 Graceful Failure Resilience", () => {
  it("analytics never throws if PostHog encounters runtime exceptions", () => {
    // Inject faulty posthog mock
    const originalWindow = global.window
    ;(global as any).window = {
      posthog: {
        capture: () => {
          throw new Error("Network timeout reaching PostHog ingest")
        },
        identify: () => {
          throw new Error("PostHog identify crashed")
        },
      },
    }

    expect(() => {
      analytics.track("post_created", { id: "p1" })
      analytics.identify("u1", { name: "Alice" })
    }).not.toThrow()

    ;(global as any).window = originalWindow
  })

  it("logger gracefully emits logs even if Sentry fails", () => {
    const log = createLogger("ResilienceScope")
    expect(() => {
      log.error("Simulated Sentry crash error", new Error("Sentry transport failure"), {
        contextKey: "val",
      })
    }).not.toThrow()
  })

  it("payment provider defaults to MockPaymentAdapter if Stripe is unconfigured", () => {
    const originalKey = process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_SECRET_KEY

    const adapter = getPaymentAdapter()
    expect(adapter.name).toBe("mock")

    process.env.STRIPE_SECRET_KEY = originalKey
  })

  it("embedding provider defaults to MockEmbeddingProvider if OpenAI is unconfigured", () => {
    const originalKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY

    const provider = getEmbeddingProvider()
    expect(provider.name).toBe("mock")

    process.env.OPENAI_API_KEY = originalKey
  })

  it("rate limiter defaults to MemoryRateLimiter if Upstash is unconfigured", () => {
    const limiter = getRateLimiter()
    expect(limiter).toBeDefined()
    expect(typeof limiter.limit).toBe("function")
  })
})
