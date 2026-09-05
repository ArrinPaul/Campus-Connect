/**
 * @jest-environment node
 *
 * Regression coverage for PATCH /api/portfolio/projects, added because
 * `api.portfolio.updateProject` mapped to it with no handler at all
 * (docs/TASKS.md §7 sweep) — every update attempt would have 405'd.
 */
import { PATCH as updateProjectRoute } from "@/app/api/portfolio/projects/route"

const mockGetUser = jest.fn()
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}))
jest.mock("@/server/db/misc", () => ({
  addProject: jest.fn(),
  getPortfolio: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
}))

import { updateProject } from "@/server/db/misc"

function patchReq(body: unknown) {
  return new Request("http://localhost/api/portfolio/projects", { method: "PATCH", body: JSON.stringify(body) })
}

describe("PATCH /api/portfolio/projects", () => {
  beforeEach(() => jest.clearAllMocks())

  it("rejects unauthenticated requests", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await updateProjectRoute(patchReq({ id: "p1", title: "New" }))
    expect(res.status).toBe(401)
  })

  it("requires a project id", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } })
    const res = await updateProjectRoute(patchReq({ title: "New" }))
    expect(res.status).toBe(400)
    expect(updateProject).not.toHaveBeenCalled()
  })

  it("404s when the project doesn't exist or isn't owned by the caller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } })
    ;(updateProject as jest.Mock).mockResolvedValue(null)
    const res = await updateProjectRoute(patchReq({ id: "p1", title: "New" }))
    expect(res.status).toBe(404)
  })

  it("updates and returns the project on success, scoped to the caller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } })
    ;(updateProject as jest.Mock).mockResolvedValue({ id: "p1", title: "New", user_id: "u1" })
    const res = await updateProjectRoute(patchReq({ id: "p1", title: "New" }))
    expect(res.status).toBe(200)
    expect(updateProject).toHaveBeenCalledWith("p1", "u1", expect.objectContaining({ title: "New" }))
  })
})
