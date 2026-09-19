/**
 * @jest-environment node
 *
 * The job detail page sent { jobId } to a route that read `id` (400 on every
 * visit), read camelCase fields that don't exist, and posters had no way to
 * see or triage applicants (docs/TASKS.md §7).
 */
import { GET as singleRoute } from "@/app/api/jobs/single/route"
import { PATCH as applicationsPatch } from "@/app/api/jobs/job-applications/route"

const mockGetUser = jest.fn()
const mockSingleProfile = jest.fn()
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: () => ({ select: () => ({ eq: () => ({ single: mockSingleProfile }) }) }),
  })),
}))
jest.mock("@/server/db/events-jobs", () => ({
  getJobById: jest.fn(),
  getViewerApplication: jest.fn(),
  getJobApplications: jest.fn(),
  updateApplicationStatus: jest.fn(),
}))
import { getJobById, getViewerApplication, updateApplicationStatus } from "@/server/db/events-jobs"

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: "me" } } })
  mockSingleProfile.mockResolvedValue({ data: { is_admin: false } })
})

describe("GET /api/jobs/single", () => {
  it("accepts both id and jobId", async () => {
    ;(getJobById as jest.Mock).mockResolvedValue({ id: "j1", posted_by: "other" })
    ;(getViewerApplication as jest.Mock).mockResolvedValue(null)
    expect((await singleRoute(new Request("http://x/api/jobs/single?jobId=j1"))).status).toBe(200)
    expect((await singleRoute(new Request("http://x/api/jobs/single?id=j1"))).status).toBe(200)
  })
  it("returns 200 null for an unknown job (a 404 would hang useQuery)", async () => {
    ;(getJobById as jest.Mock).mockResolvedValue(null)
    const res = await singleRoute(new Request("http://x/api/jobs/single?id=nope"))
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
  })
  it("flags ownership and the viewer's own application", async () => {
    ;(getJobById as jest.Mock).mockResolvedValue({ id: "j1", posted_by: "me" })
    ;(getViewerApplication as jest.Mock).mockResolvedValue({ id: "a1", status: "pending" })
    const body = await (await singleRoute(new Request("http://x/api/jobs/single?id=j1"))).json()
    expect(body.isOwner).toBe(true)
    expect(body.viewerApplication).toMatchObject({ id: "a1" })
  })
})

describe("PATCH /api/jobs/job-applications", () => {
  const patch = (b: unknown) => new Request("http://x", { method: "PATCH", body: JSON.stringify(b) })
  it("rejects an invalid status", async () => {
    expect((await applicationsPatch(patch({ applicationId: "a1", status: "hired" }))).status).toBe(400)
  })
  it("404s when the caller doesn't own the job", async () => {
    ;(updateApplicationStatus as jest.Mock).mockResolvedValue(null)
    expect((await applicationsPatch(patch({ applicationId: "a1", status: "accepted" }))).status).toBe(404)
  })
  it("updates for the poster", async () => {
    ;(updateApplicationStatus as jest.Mock).mockResolvedValue({ id: "a1", status: "accepted" })
    const res = await applicationsPatch(patch({ applicationId: "a1", status: "accepted" }))
    expect(res.status).toBe(200)
    expect(updateApplicationStatus).toHaveBeenCalledWith("a1", "accepted", "me", false)
  })
})
