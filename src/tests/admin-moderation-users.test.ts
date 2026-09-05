/**
 * @jest-environment node
 *
 * Regression coverage for the admin moderation queue and user-management
 * actions (docs/TASKS.md §7 sweep):
 *  - admin/moderation's POST handler only ever deleted posts and read the
 *    wrong request field names for what the frontend actually sends.
 *  - admin/users wrote 'admin'/'suspended' into users.role, which only
 *    allows ('Student', 'Research Scholar', 'Faculty') — every such write
 *    violated the CHECK constraint and failed silently.
 */
import { POST as moderationPost } from "@/app/api/admin/moderation/route"
import { POST as usersPost } from "@/app/api/admin/users/route"

const mockGetUser = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockFrom = jest.fn()

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))
jest.mock("@/server/db/comments", () => ({ deleteComment: jest.fn() }))
jest.mock("@/server/db/messages", () => ({ deleteMessage: jest.fn() }))

import { deleteComment } from "@/server/db/comments"
import { deleteMessage } from "@/server/db/messages"

function postReq(url: string, body: unknown) {
  return new Request(url, { method: "POST", body: JSON.stringify(body) })
}

function makeAdminFrom(isAdmin = true) {
  return jest.fn((table: string) => {
    if (table === "users") {
      return {
        select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { is_admin: isAdmin } }) })) })),
        update: mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      }
    }
    if (table === "posts") {
      return { delete: mockDelete.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }
    }
    if (table === "content_reports") {
      return { update: mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }
    }
    throw new Error(`Unexpected table: ${table}`)
  })
}

describe("POST /api/admin/moderation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } })
    mockFrom.mockImplementation(makeAdminFrom(true))
  })

  it("forbids a non-admin", async () => {
    mockFrom.mockImplementation(makeAdminFrom(false))
    const res = await moderationPost(postReq("http://localhost/api/admin/moderation", { targetId: "p1", type: "post", action: "delete" }))
    expect(res.status).toBe(403)
  })

  it("deletes a reported post using target_id/target_type, not the report's own id", async () => {
    const res = await moderationPost(
      postReq("http://localhost/api/admin/moderation", { targetId: "post-1", type: "post", action: "delete", reportId: "report-1" })
    )
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalled()
  })

  it("deletes a reported comment", async () => {
    const res = await moderationPost(
      postReq("http://localhost/api/admin/moderation", { targetId: "comment-1", type: "comment", action: "delete", reportId: "report-1" })
    )
    expect(res.status).toBe(200)
    expect(deleteComment).toHaveBeenCalledWith("comment-1")
  })

  it("deletes a reported message", async () => {
    const res = await moderationPost(
      postReq("http://localhost/api/admin/moderation", { targetId: "msg-1", type: "message", action: "delete", reportId: "report-1" })
    )
    expect(res.status).toBe(200)
    expect(deleteMessage).toHaveBeenCalledWith("msg-1")
  })

  it("refuses to delete a reported user (handled on the Users admin page instead)", async () => {
    const res = await moderationPost(
      postReq("http://localhost/api/admin/moderation", { targetId: "user-1", type: "user", action: "delete", reportId: "report-1" })
    )
    expect(res.status).toBe(400)
  })

  it("marks a report dismissed (not just 'reviewed') on dismiss", async () => {
    const res = await moderationPost(
      postReq("http://localhost/api/admin/moderation", { targetId: "post-1", type: "post", action: "dismiss", reportId: "report-1" })
    )
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: "dismissed" }))
  })
})

describe("POST /api/admin/users", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } })
    mockFrom.mockImplementation(makeAdminFrom(true))
  })

  it("sets is_admin instead of writing an invalid role value", async () => {
    const res = await usersPost(postReq("http://localhost/api/admin/users", { targetUserId: "u2", action: "make_admin" }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ is_admin: true })
  })

  it("sets is_suspended instead of writing an invalid role value", async () => {
    const res = await usersPost(postReq("http://localhost/api/admin/users", { targetUserId: "u2", action: "suspend" }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ is_suspended: true })
  })

  it("unsuspends", async () => {
    const res = await usersPost(postReq("http://localhost/api/admin/users", { targetUserId: "u2", action: "unsuspend" }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ is_suspended: false })
  })

  it("refuses to let an admin remove their own admin access", async () => {
    const res = await usersPost(postReq("http://localhost/api/admin/users", { targetUserId: "admin-1", action: "remove_admin" }))
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("rejects an unknown action", async () => {
    const res = await usersPost(postReq("http://localhost/api/admin/users", { targetUserId: "u2", action: "not_a_real_action" }))
    expect(res.status).toBe(400)
  })
})
