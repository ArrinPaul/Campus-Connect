/**
 * @jest-environment node
 */
import { POST as checkoutRoute } from "@/app/api/subscriptions/checkout/route"
import { POST as webhookRoute } from "@/app/api/subscriptions/webhook/route"
import { GET as getSubscriptionRoute, DELETE as cancelSubscriptionRoute } from "@/app/api/subscriptions/route"
import { processWebhook, getUserSubscription } from "@/server/subscriptions/service"

// Mock Supabase Server Client
const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockUpsert = jest.fn()
const mockUpdate = jest.fn()
const mockSingle = jest.fn()

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    upsert: mockUpsert,
    update: mockUpdate,
  })),
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
  createAdminClient: jest.fn(() => mockSupabase),
}))

describe("Phase 6 — P6-03 Subscriptions & Monetization Infrastructure", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const mockChain: any = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: mockSingle,
    }

    mockSelect.mockReturnValue(mockChain)
    mockInsert.mockResolvedValue({ error: null })
    mockUpsert.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    })
  })

  describe("POST /api/subscriptions/checkout", () => {
    it("should reject unauthenticated checkout with 401", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })

      const req = new Request("http://localhost:3000/api/subscriptions/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: "pro" }),
      })

      const res = await checkoutRoute(req)
      expect(res.status).toBe(401)
    })

    it("should reject invalid subscription plan with 400", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })

      const req = new Request("http://localhost:3000/api/subscriptions/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: "enterprise_platinum" }),
      })

      const res = await checkoutRoute(req)
      expect(res.status).toBe(400)
    })

    it("should create checkout session for valid plan", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1", email: "student@mit.edu" } } })

      const req = new Request("http://localhost:3000/api/subscriptions/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: "pro" }),
      })

      const res = await checkoutRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty("sessionId")
      expect(data).toHaveProperty("checkoutUrl")
    })
  })

  describe("POST /api/subscriptions/webhook (Idempotent Webhook Reconciliation)", () => {
    it("should reject webhook with missing signature header", async () => {
      const req = new Request("http://localhost:3000/api/subscriptions/webhook", {
        method: "POST",
        body: JSON.stringify({ id: "evt_1" }),
      })

      const res = await webhookRoute(req)
      expect(res.status).toBe(400)
    })

    it("should process webhook and reconcile subscription state", async () => {
      // Idempotency check: event does not exist yet
      mockSingle.mockResolvedValueOnce({ data: null, error: null })

      const eventPayload = {
        id: "evt_checkout_123",
        type: "checkout.session.completed",
        data: {
          userId: "user-1",
          plan: "pro",
          status: "active",
          subscriptionId: "sub_mock_1",
          customerId: "cus_mock_1",
        },
      }

      const req = new Request("http://localhost:3000/api/subscriptions/webhook", {
        method: "POST",
        headers: { "x-webhook-signature": "mock_valid_signature" },
        body: JSON.stringify(eventPayload),
      })

      const res = await webhookRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.eventId).toBe("evt_checkout_123")

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          provider_event_id: "evt_checkout_123",
          event_type: "checkout.session.completed",
        })
      )
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          plan: "pro",
          status: "active",
        }),
        { onConflict: "user_id" }
      )
    })

    it("should skip duplicate webhook events idempotently", async () => {
      // Idempotency check: event already exists in database
      mockSingle.mockResolvedValueOnce({ data: { id: "evt_existing" }, error: null })

      const eventPayload = {
        id: "evt_checkout_123",
        type: "checkout.session.completed",
        data: { userId: "user-1" },
      }

      const req = new Request("http://localhost:3000/api/subscriptions/webhook", {
        method: "POST",
        headers: { "x-webhook-signature": "mock_valid_signature" },
        body: JSON.stringify(eventPayload),
      })

      const res = await webhookRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.duplicate).toBe(true)
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe("GET & DELETE /api/subscriptions", () => {
    it("should return free plan defaults when no subscription exists", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-free" } } })
      mockSingle.mockResolvedValueOnce({ data: null, error: null })

      const res = await getSubscriptionRoute()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.plan).toBe("free")
      expect(data.status).toBe("active")
    })

    it("should cancel active subscription", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-paid" } } })
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "sub-row-1",
          user_id: "user-paid",
          plan: "pro",
          provider_subscription_id: "sub_live_123",
        },
        error: null,
      })

      const res = await cancelSubscriptionRoute()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })
  })
})
