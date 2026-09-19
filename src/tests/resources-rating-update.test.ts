/**
 * @jest-environment node
 *
 * The resource detail page showed a rating widget backed by no table or
 * route, read fields that don't exist (uploadedBy, fileUrl, createdAt,
 * rating.toFixed on undefined), and updateResource wrote the raw request
 * body, letting a caller overwrite any column (docs/TASKS.md §7).
 */
import { POST as rateRoute } from "@/app/api/resources/rate/route"
import { GET as singleRoute } from "@/app/api/resources/single/route"

const mockGetUser = jest.fn()
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}))
jest.mock("@/server/db/content", () => ({ rateResource: jest.fn(), getResourceById: jest.fn() }))
import { rateResource, getResourceById } from "@/server/db/content"

const post = (b: unknown) => new Request("http://x", { method: "POST", body: JSON.stringify(b) })
beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: "me" } } })
})

describe("POST /api/resources/rate", () => {
  it.each([0, 6, 2.5, "abc"])("rejects rating %p", async (rating) => {
    expect((await rateRoute(post({ resourceId: "r1", rating }))).status).toBe(400)
  })
  it("requires auth", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    expect((await rateRoute(post({ resourceId: "r1", rating: 5 }))).status).toBe(401)
  })
  it("saves a valid rating for the caller", async () => {
    ;(rateResource as jest.Mock).mockResolvedValue({ success: true })
    expect((await rateRoute(post({ resourceId: "r1", rating: 4 }))).status).toBe(200)
    expect(rateResource).toHaveBeenCalledWith("r1", "me", 4)
  })
  it("surfaces 'cannot rate your own resource'", async () => {
    ;(rateResource as jest.Mock).mockResolvedValue({ error: "You cannot rate your own resource", status: 400 })
    expect((await rateRoute(post({ resourceId: "r1", rating: 4 }))).status).toBe(400)
  })
})

describe("GET /api/resources/single", () => {
  it("returns 200 null for an unknown resource (a 404 would hang useQuery)", async () => {
    ;(getResourceById as jest.Mock).mockResolvedValue(null)
    const res = await singleRoute(new Request("http://x/api/resources/single?id=nope"))
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
  })
  it("passes the viewer so their own rating comes back", async () => {
    ;(getResourceById as jest.Mock).mockResolvedValue({ id: "r1", viewer_rating: 3 })
    await singleRoute(new Request("http://x/api/resources/single?id=r1"))
    expect(getResourceById).toHaveBeenCalledWith("r1", "me")
  })
})
