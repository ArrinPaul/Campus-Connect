/**
 * @jest-environment node
 *
 * Regression coverage for GroupInfoPanel's admin promote/demote and pinned
 * messages — both hit a 404 before the 20240108000000 migration + these two
 * route files (docs/TASKS.md §4b follow-up).
 */
import { POST as adminPost, DELETE as adminDelete } from "@/app/api/conversations/admin/route"
import { GET as pinnedRoute } from "@/app/api/conversations/pinned/route"

const mockGetUser = jest.fn()

function makeAdminSupabase(role: string | null, updateError: unknown = null) {
  return {
    auth: { getUser: mockGetUser },
    from: jest.fn((table: string) => {
      if (table === "conversation_participants") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: role ? { role } : null }),
              })),
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({ error: updateError }),
            })),
          })),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    }),
  }
}

function makePinnedSupabase(rows: any[]) {
  return {
    auth: { getUser: mockGetUser },
    from: jest.fn((table: string) => {
      if (table === "messages") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                is: jest.fn(() => ({
                  order: jest.fn().mockResolvedValue({ data: rows, error: null }),
                })),
              })),
            })),
          })),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    }),
  }
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}))

const { createClient } = jest.requireMock("@/lib/supabase/server") as { createClient: jest.Mock }

describe("POST/DELETE /api/conversations/admin", () => {
  beforeEach(() => jest.clearAllMocks())

  it("rejects unauthenticated requests", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    createClient.mockResolvedValue(makeAdminSupabase(null))

    const req = new Request("http://localhost/api/conversations/admin", {
      method: "POST",
      body: JSON.stringify({ conversationId: "c1", userId: "u1" }),
    })
    const res = await adminPost(req)
    expect(res.status).toBe(401)
  })

  it("rejects a missing conversationId/userId", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "owner-1" } } })
    createClient.mockResolvedValue(makeAdminSupabase("owner"))

    const req = new Request("http://localhost/api/conversations/admin", {
      method: "POST",
      body: JSON.stringify({}),
    })
    const res = await adminPost(req)
    expect(res.status).toBe(400)
  })

  it("forbids promoting when the acting user is not the owner", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "member-1" } } })
    createClient.mockResolvedValue(makeAdminSupabase("member"))

    const req = new Request("http://localhost/api/conversations/admin", {
      method: "POST",
      body: JSON.stringify({ conversationId: "c1", userId: "u2" }),
    })
    const res = await adminPost(req)
    expect(res.status).toBe(403)
  })

  it("promotes to admin when the acting user is the owner", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "owner-1" } } })
    createClient.mockResolvedValue(makeAdminSupabase("owner"))

    const req = new Request("http://localhost/api/conversations/admin", {
      method: "POST",
      body: JSON.stringify({ conversationId: "c1", userId: "u2" }),
    })
    const res = await adminPost(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it("forbids demoting when the acting user is not the owner", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } })
    createClient.mockResolvedValue(makeAdminSupabase("admin"))

    const req = new Request("http://localhost/api/conversations/admin", {
      method: "DELETE",
      body: JSON.stringify({ conversationId: "c1", userId: "u2" }),
    })
    const res = await adminDelete(req)
    expect(res.status).toBe(403)
  })
})

describe("GET /api/conversations/pinned", () => {
  beforeEach(() => jest.clearAllMocks())

  it("rejects unauthenticated requests", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    createClient.mockResolvedValue(makePinnedSupabase([]))

    const req = new Request("http://localhost/api/conversations/pinned?conversationId=c1")
    const res = await pinnedRoute(req)
    expect(res.status).toBe(401)
  })

  it("rejects a missing conversationId", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } })
    createClient.mockResolvedValue(makePinnedSupabase([]))

    const req = new Request("http://localhost/api/conversations/pinned")
    const res = await pinnedRoute(req)
    expect(res.status).toBe(400)
  })

  it("returns pinned messages shaped for GroupInfoPanel (_id, senderName, content)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } })
    createClient.mockResolvedValue(
      makePinnedSupabase([
        { id: "m1", content: "Important!", sender: { id: "s1", name: "Alice" }, created_at: "t1", pinned_at: "t2" },
      ])
    )

    const req = new Request("http://localhost/api/conversations/pinned?conversationId=c1")
    const res = await pinnedRoute(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([
      { _id: "m1", id: "m1", content: "Important!", senderName: "Alice", created_at: "t1", pinned_at: "t2" },
    ])
  })
})
