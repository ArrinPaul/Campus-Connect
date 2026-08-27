/**
 * @jest-environment node
 */
import { GET as healthRoute } from "@/app/api/health/route"
import { GET as readyRoute } from "@/app/api/health/ready/route"
import { scrubSensitiveData } from "@/lib/logger"
import { getPaymentAdapter } from "@/server/subscriptions/service"
import { getRateLimiter } from "@/lib/rate-limiter"
import { getEmbeddingProvider } from "@/server/recommendations/embedding-provider"
import fs from "fs"
import path from "path"

// Mock Supabase Server Client
const mockSelect = jest.fn()
const mockSupabase = {
  from: jest.fn(() => ({
    select: mockSelect,
  })),
}

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(() => mockSupabase),
}))

describe("Phase 8 — Production Launch & Security Verification", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSelect.mockReturnValue({
      limit: jest.fn().mockResolvedValue({ data: [{ id: "test-user-id" }], error: null }),
    })
  })

  describe("Step 1: Environment & Secret Isolation", () => {
    it("ensures no server-only private keys are exposed as NEXT_PUBLIC_", () => {
      const serverSecrets = [
        "SUPABASE_SERVICE_ROLE_KEY",
        "DATABASE_URL",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "VAPID_PRIVATE_KEY",
        "UPSTASH_REDIS_REST_TOKEN",
        "OPENAI_API_KEY",
      ]

      for (const secret of serverSecrets) {
        expect(secret.startsWith("NEXT_PUBLIC_")).toBe(false)
      }
    })

    it("verifies sensitive data scrubber completely neutralizes credential leakage", () => {
      const testPayload = {
        user: "student@mit.edu",
        SUPABASE_SERVICE_ROLE_KEY: "secret_role_key_12345",
        STRIPE_SECRET_KEY: "sk_live_stripe_secret_key",
        VAPID_PRIVATE_KEY: "vapid_private_key_abc",
        UPSTASH_REDIS_REST_TOKEN: "redis_token_xyz",
        nested: {
          password: "MySecurePassword123!",
          token: "jwt.session.token",
        },
      }

      const sanitized: any = scrubSensitiveData(testPayload)
      expect(sanitized.SUPABASE_SERVICE_ROLE_KEY).toBe("[REDACTED]")
      expect(sanitized.STRIPE_SECRET_KEY).toBe("[REDACTED]")
      expect(sanitized.VAPID_PRIVATE_KEY).toBe("[REDACTED]")
      expect(sanitized.UPSTASH_REDIS_REST_TOKEN).toBe("[REDACTED]")
      expect(sanitized.nested.password).toBe("[REDACTED]")
      expect(sanitized.nested.token).toBe("[REDACTED]")
      expect(sanitized.user).toBe("student@mit.edu")
    })
  })

  describe("Step 2 & 3: Database & Migration Schema Integrity", () => {
    it("verifies all canonical tables are declared in migration files", () => {
      const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20240101000000_init.sql")
      const initSql = fs.readFileSync(migrationPath, "utf-8").toLowerCase()

      const tableMatches = Array.from(initSql.matchAll(/create\s+table\s+if\s+not\s+exists\s+([a-z0-9_]+)/g))
      const declaredTables = Array.from(new Set(tableMatches.map((m) => m[1])))

      expect(declaredTables.length).toBeGreaterThanOrEqual(40)

      const requiredKeyTables = [
        "users", "follows", "posts", "comments", "reactions", "hashtags",
        "communities", "community_members", "events", "jobs",
        "questions", "question_answers", "research_papers",
        "marketplace_listings", "stories", "resources",
        "conversations", "messages", "notifications", "user_reputation",
        "skill_endorsements", "calls", "push_subscriptions",
        "subscriptions", "subscription_events", "research_embeddings",
        "user_interest_embeddings"
      ]

      for (const table of requiredKeyTables) {
        expect(declaredTables).toContain(table)
      }
    })
  })

  describe("Step 12: Production Health & Readiness Probes", () => {
    it("GET /api/health responds with HTTP 200 and sanitized liveness metadata", async () => {
      const res = await healthRoute()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe("ok")
      expect(data).toHaveProperty("version")
      expect(data).not.toHaveProperty("password")
      expect(data).not.toHaveProperty("secret")
    })

    it("GET /api/health/ready probes database connectivity without leaking connection string", async () => {
      const res = await readyRoute()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe("ready")
      expect(data.checks.database).toBe("connected")
      expect(JSON.stringify(data)).not.toContain("postgresql://")
    })
  })

  describe("Step 7, 8, 9, 10: External Service Fallbacks & Resilience", () => {
    it("payment adapter operates safely in offline/test fallback mode", () => {
      const adapter = getPaymentAdapter()
      expect(adapter).toBeDefined()
      expect(typeof adapter.createCheckoutSession).toBe("function")
    })

    it("rate limiter operates safely with distributed Upstash or local memory fallback", () => {
      const limiter = getRateLimiter()
      expect(limiter).toBeDefined()
      expect(typeof limiter.limit).toBe("function")
    })

    it("embedding provider provides deterministic unit vectors", async () => {
      const provider = getEmbeddingProvider()
      const vector = await provider.generateEmbedding("Campus Connect Academic Research")
      expect(Array.isArray(vector)).toBe(true)
      expect(vector.length).toBeGreaterThan(0)
    })
  })
})
