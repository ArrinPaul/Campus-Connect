/**
 * @jest-environment node
 */
import { POST as subscribeRoute, DELETE as unsubscribeRoute } from "@/app/api/push/subscribe/route"
import { GET as vapidKeyRoute } from "@/app/api/push/vapid-key/route"
import { GET as endpointRoute } from "@/app/api/push/endpoint/route"
import { savePushSubscription, removePushSubscription, sendPushNotification } from "@/server/push/web-push"

// Mock Supabase Server Client
const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockUpsert = jest.fn()
const mockUpdate = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: jest.fn(() => ({
    select: mockSelect,
    upsert: mockUpsert,
    update: mockUpdate,
  })),
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
  createAdminClient: jest.fn(() => mockSupabase),
}))

describe("Phase 6 — P6-01 Web Push Notification System", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const mockChain: any = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: mockSingle,
    }

    mockSelect.mockReturnValue(mockChain)
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    })
    mockUpsert.mockReturnValue({
      select: jest.fn().mockReturnValue({ single: mockSingle }),
    })
  })

  describe("POST /api/push/subscribe", () => {
    it("should reject unauthenticated subscription request with 401", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })

      const req = new Request("http://localhost:3000/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint: "https://fcm.googleapis.com/fcm/send/sub1",
          p256dh: "key123",
          auth: "auth123",
        }),
      })

      const res = await subscribeRoute(req)
      expect(res.status).toBe(401)
    })

    it("should reject malformed subscription payloads with 400", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })

      const req = new Request("http://localhost:3000/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint: "https://fcm.googleapis.com/fcm/send/sub1",
          // missing p256dh and auth keys
        }),
      })

      const res = await subscribeRoute(req)
      expect(res.status).toBe(400)
    })

    it("should save valid push subscription and return success", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "sub-123",
          user_id: "user-1",
          endpoint: "https://fcm.googleapis.com/fcm/send/sub1",
          is_active: true,
        },
        error: null,
      })

      const req = new Request("http://localhost:3000/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint: "https://fcm.googleapis.com/fcm/send/sub1",
          keys: {
            p256dh: "BM6h...",
            auth: "9s1...",
          },
        }),
      })

      const res = await subscribeRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          endpoint: "https://fcm.googleapis.com/fcm/send/sub1",
          is_active: true,
        }),
        { onConflict: "user_id, endpoint" }
      )
    })
  })

  describe("DELETE /api/push/subscribe (Unsubscribe)", () => {
    it("should deactivate subscription by endpoint for authenticated user", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })

      const req = new Request("http://localhost:3000/api/push/subscribe", {
        method: "DELETE",
        body: JSON.stringify({
          endpoint: "https://fcm.googleapis.com/fcm/send/sub1",
        }),
      })

      const res = await unsubscribeRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })
  })

  describe("GET /api/push/vapid-key", () => {
    it("should return public VAPID key without exposing private key", async () => {
      const res = await vapidKeyRoute()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty("publicKey")
      expect(data).not.toHaveProperty("privateKey")
    })
  })

  describe("Server Dispatch & Error Recovery", () => {
    it("should handle user with no active subscriptions gracefully", async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

      const res = await sendPushNotification({
        userId: "user-inactive",
        title: "Test Alert",
        body: "You have a new message",
      })

      expect(res.success).toBe(true)
      expect(res.sentCount).toBe(0)
    })
  })
})
