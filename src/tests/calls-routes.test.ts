/**
 * @jest-environment node
 *
 * Regression coverage for the calls feature (docs/TASKS.md §7): initiating a
 * call sent conversationId but the route needs recipientId; the incoming
 * endpoint returned a single object while the UI called .filter on it; any
 * user could end/answer any call.
 */
import { POST as initiateRoute } from "@/app/api/calls/route"
import { GET as incomingRoute } from "@/app/api/calls/incoming/route"
import { POST as acceptRoute } from "@/app/api/calls/accept/route"

const mockGetUser = jest.fn()
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}))
jest.mock("@/server/db/misc", () => ({
  initiateCall: jest.fn(),
  getIncomingCall: jest.fn(),
  getActiveCalls: jest.fn(),
  updateCallStatus: jest.fn(),
  toCallView: jest.requireActual("@/server/db/misc").toCallView,
}))
import { initiateCall, getIncomingCall, updateCallStatus } from "@/server/db/misc"

const post = (body: unknown) => new Request("http://localhost/api/calls", { method: "POST", body: JSON.stringify(body) })

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: "me" } } })
})

describe("POST /api/calls", () => {
  it("requires recipientId", async () => {
    expect((await initiateRoute(post({ type: "audio" }))).status).toBe(400)
  })
  it("refuses calling yourself", async () => {
    expect((await initiateRoute(post({ recipientId: "me" }))).status).toBe(400)
  })
  it("rejects an invalid type", async () => {
    expect((await initiateRoute(post({ recipientId: "u2", type: "carrier-pigeon" }))).status).toBe(400)
  })
  it("returns callId alongside the row", async () => {
    ;(initiateCall as jest.Mock).mockResolvedValue({ id: "call-1", type: "audio" })
    const res = await initiateRoute(post({ recipientId: "u2", type: "audio" }))
    expect(res.status).toBe(200)
    expect((await res.json()).callId).toBe("call-1")
  })
})

describe("GET /api/calls/incoming", () => {
  it("returns an empty array when nothing is ringing", async () => {
    ;(getIncomingCall as jest.Mock).mockResolvedValue(null)
    expect(await (await incomingRoute()).json()).toEqual([])
  })
  it("returns an array with the caller flattened for the UI", async () => {
    ;(getIncomingCall as jest.Mock).mockResolvedValue({ id: "c1", type: "video", caller: { name: "Ann", profile_picture: "p.png" } })
    const body = await (await incomingRoute()).json()
    expect(body).toHaveLength(1)
    expect(body[0]).toMatchObject({ _id: "c1", callerName: "Ann", callerProfilePicture: "p.png" })
  })
})

describe("POST /api/calls/accept", () => {
  it("404s when the caller isn't the recipient of that call", async () => {
    ;(updateCallStatus as jest.Mock).mockResolvedValue(false)
    expect((await acceptRoute(post({ callId: "c1" }))).status).toBe(404)
    expect(updateCallStatus).toHaveBeenCalledWith("c1", "active", "me")
  })
})
