/**
 * @jest-environment node
 *
 * Third batch of regression coverage for routes fixed from 501 stubs this
 * session (docs/TASKS.md §5 lists these as "not yet covered" after the
 * first two batches in stub-routes-regression.test.ts and
 * fixed-routes-coverage-2.test.ts).
 */
import { POST as approveMemberRoute } from "@/app/api/communities/members/approve/route"
import { POST as respondInviteRoute } from "@/app/api/communities/invite/respond/route"
import { GET as userStoriesRoute } from "@/app/api/stories/user/route"
import { POST as deleteStoryRoute } from "@/app/api/stories/delete/route"
import { POST as marketplaceContactRoute } from "@/app/api/marketplace/contact/route"
import { GET as myEventsRoute } from "@/app/api/events/my-events/route"
import { GET as reactionCountsRoute } from "@/app/api/reactions/counts/route"
import { GET as commentRepliesRoute } from "@/app/api/comments/replies/route"
import { GET as postActivityRoute } from "@/app/api/posts/activity/route"

const mockGetUser = jest.fn()
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { invitee_id: "invitee-1" } }) })) })),
    })),
  })),
}))

jest.mock("@/server/db/communities", () => ({
  approveMember: jest.fn(),
  respondToInvite: jest.fn(),
}))
jest.mock("@/server/db/content", () => ({
  getUserStories: jest.fn(),
  deleteStory: jest.fn(),
}))
jest.mock("@/server/db/misc", () => ({
  getListingById: jest.fn(),
}))
jest.mock("@/server/db/messages", () => ({
  getOrCreateDMConversation: jest.fn(),
  sendMessage: jest.fn(),
}))
jest.mock("@/server/db/events-jobs", () => ({
  getUserEvents: jest.fn(),
}))
jest.mock("@/server/db/reactions", () => ({
  getReactionCounts: jest.fn(),
}))
jest.mock("@/server/db/comments", () => ({
  getReplies: jest.fn(),
}))
jest.mock("@/server/db/posts", () => ({
  getUserPosts: jest.fn(),
}))

import { approveMember, respondToInvite } from "@/server/db/communities"
import { getUserStories, deleteStory } from "@/server/db/content"
import { getListingById } from "@/server/db/misc"
import { getOrCreateDMConversation, sendMessage } from "@/server/db/messages"
import { getUserEvents } from "@/server/db/events-jobs"
import { getReactionCounts } from "@/server/db/reactions"
import { getReplies } from "@/server/db/comments"
import { getUserPosts } from "@/server/db/posts"

function jsonReq(url: string, body?: unknown) {
  return new Request(url, { method: "POST", body: body ? JSON.stringify(body) : undefined })
}

describe("POST /api/communities/members/approve", () => {
  beforeEach(() => jest.clearAllMocks())

  it("requires communityId and requestId", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "mod-1" } } })
    const res = await approveMemberRoute(jsonReq("http://localhost/api/communities/members/approve", {}))
    expect(res.status).toBe(400)
  })

  it("propagates a 403 from approveMember (non-moderator)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "mod-1" } } })
    ;(approveMember as jest.Mock).mockResolvedValue({ error: "Forbidden", status: 403 })
    const res = await approveMemberRoute(jsonReq("http://localhost/api/communities/members/approve", { communityId: "c1", requestId: "r1" }))
    expect(res.status).toBe(403)
  })

  it("returns 200 on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "mod-1" } } })
    ;(approveMember as jest.Mock).mockResolvedValue({ success: true })
    const res = await approveMemberRoute(jsonReq("http://localhost/api/communities/members/approve", { communityId: "c1", requestId: "r1" }))
    expect(res.status).toBe(200)
  })
})

describe("POST /api/communities/invite/respond", () => {
  beforeEach(() => jest.clearAllMocks())

  it("rejects an invalid status value", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "invitee-1" } } })
    const res = await respondInviteRoute(jsonReq("http://localhost/api/communities/invite/respond", { inviteId: "i1", status: "maybe" }))
    expect(res.status).toBe(400)
  })

  it("forbids responding to someone else's invite", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "not-the-invitee" } } })
    const res = await respondInviteRoute(jsonReq("http://localhost/api/communities/invite/respond", { inviteId: "i1", status: "accepted" }))
    expect(res.status).toBe(403)
    expect(respondToInvite).not.toHaveBeenCalled()
  })

  it("accepts a valid response from the actual invitee", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "invitee-1" } } })
    const res = await respondInviteRoute(jsonReq("http://localhost/api/communities/invite/respond", { inviteId: "i1", status: "accepted" }))
    expect(res.status).toBe(200)
    expect(respondToInvite).toHaveBeenCalledWith("i1", "accepted")
  })
})

describe("GET /api/stories/user", () => {
  beforeEach(() => jest.clearAllMocks())

  it("requires a userId", async () => {
    const res = await userStoriesRoute(new Request("http://localhost/api/stories/user"))
    expect(res.status).toBe(400)
  })

  it("returns the user's stories", async () => {
    ;(getUserStories as jest.Mock).mockResolvedValue([{ id: "s1" }])
    const res = await userStoriesRoute(new Request("http://localhost/api/stories/user?userId=u1"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.stories).toEqual([{ id: "s1" }])
  })
})

describe("POST /api/stories/delete", () => {
  beforeEach(() => jest.clearAllMocks())

  it("requires authentication", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await deleteStoryRoute(jsonReq("http://localhost/api/stories/delete", { id: "s1" }))
    expect(res.status).toBe(401)
  })

  it("requires a storyId", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } })
    const res = await deleteStoryRoute(jsonReq("http://localhost/api/stories/delete", {}))
    expect(res.status).toBe(400)
  })

  it("propagates a 403 from deleteStory (non-owner)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } })
    ;(deleteStory as jest.Mock).mockResolvedValue({ error: "Forbidden", status: 403 })
    const res = await deleteStoryRoute(jsonReq("http://localhost/api/stories/delete", { id: "s1" }))
    expect(res.status).toBe(403)
  })
})

describe("POST /api/marketplace/contact", () => {
  beforeEach(() => jest.clearAllMocks())

  it("requires a listingId", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "buyer-1" } } })
    const res = await marketplaceContactRoute(jsonReq("http://localhost/api/marketplace/contact", {}))
    expect(res.status).toBe(400)
  })

  it("404s when the listing doesn't exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "buyer-1" } } })
    ;(getListingById as jest.Mock).mockResolvedValue(null)
    const res = await marketplaceContactRoute(jsonReq("http://localhost/api/marketplace/contact", { listingId: "l1" }))
    expect(res.status).toBe(404)
  })

  it("refuses to let a seller contact themselves", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "seller-1" } } })
    ;(getListingById as jest.Mock).mockResolvedValue({ posted_by: "seller-1" })
    const res = await marketplaceContactRoute(jsonReq("http://localhost/api/marketplace/contact", { listingId: "l1" }))
    expect(res.status).toBe(400)
  })

  it("opens a DM conversation with the seller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "buyer-1" } } })
    ;(getListingById as jest.Mock).mockResolvedValue({ posted_by: "seller-1" })
    ;(getOrCreateDMConversation as jest.Mock).mockResolvedValue({ id: "conv-1" })
    const res = await marketplaceContactRoute(jsonReq("http://localhost/api/marketplace/contact", { listingId: "l1" }))
    expect(res.status).toBe(201)
    expect(getOrCreateDMConversation).toHaveBeenCalledWith("buyer-1", "seller-1")
  })
})

describe("GET /api/events/my-events", () => {
  beforeEach(() => jest.clearAllMocks())

  it("requires authentication", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await myEventsRoute()
    expect(res.status).toBe(401)
  })

  it("returns the signed-in user's events", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } })
    ;(getUserEvents as jest.Mock).mockResolvedValue([{ id: "e1" }])
    const res = await myEventsRoute()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.events).toEqual([{ id: "e1" }])
  })
})

describe("GET /api/reactions/counts", () => {
  beforeEach(() => jest.clearAllMocks())

  it("requires a targetId", async () => {
    const res = await reactionCountsRoute(new Request("http://localhost/api/reactions/counts"))
    expect(res.status).toBe(400)
  })

  it("returns counts for the target, defaulting targetType to post", async () => {
    ;(getReactionCounts as jest.Mock).mockResolvedValue({ like: 3 })
    const res = await reactionCountsRoute(new Request("http://localhost/api/reactions/counts?targetId=p1"))
    expect(res.status).toBe(200)
    expect(getReactionCounts).toHaveBeenCalledWith("p1", "post")
  })
})

describe("GET /api/comments/replies", () => {
  beforeEach(() => jest.clearAllMocks())

  it("requires a commentId", async () => {
    const res = await commentRepliesRoute(new Request("http://localhost/api/comments/replies"))
    expect(res.status).toBe(400)
  })

  it("returns replies with hasMore computed from the page size", async () => {
    ;(getReplies as jest.Mock).mockResolvedValue([{ id: "r1" }])
    const res = await commentRepliesRoute(new Request("http://localhost/api/comments/replies?commentId=c1&limit=1"))
    const body = await res.json()
    expect(body.hasMore).toBe(true)
  })
})

describe("GET /api/posts/activity", () => {
  beforeEach(() => jest.clearAllMocks())

  it("requires a userId when not signed in", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await postActivityRoute(new Request("http://localhost/api/posts/activity"))
    expect(res.status).toBe(400)
  })

  it("defaults to the signed-in user when no userId param is given", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "me" } } })
    ;(getUserPosts as jest.Mock).mockResolvedValue([])
    const res = await postActivityRoute(new Request("http://localhost/api/posts/activity"))
    expect(res.status).toBe(200)
    expect(getUserPosts).toHaveBeenCalledWith("me", 20, 0)
  })
})
