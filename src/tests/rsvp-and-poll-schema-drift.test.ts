/**
 * @jest-environment node
 *
 * Regression coverage for two schema-drift bugs found in a sweep of
 * write-path forms (docs/TASKS.md §2):
 *  - PostComposer's poll creator never sent `question` at all (every poll
 *    creation 400'd) and sent durationHours/isAnonymous into columns that
 *    didn't exist.
 *  - The event RSVP UI sends a status ('going'|'maybe'|'not_going') that
 *    the route silently discarded, so every RSVP landed as the column
 *    default regardless of what the user actually picked.
 */
import { POST as attendRoute } from "@/app/api/events/attend/route"
import { POST as pollsRoute } from "@/app/api/polls/route"

const mockGetUser = jest.fn()
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}))
jest.mock("@/server/db/events-jobs", () => ({
  attendEvent: jest.fn().mockResolvedValue(undefined),
  unattendEvent: jest.fn().mockResolvedValue(undefined),
}))
jest.mock("@/server/db/misc", () => ({
  createPoll: jest.fn(),
  getPollResults: jest.fn(),
}))

import { attendEvent } from "@/server/db/events-jobs"
import { createPoll } from "@/server/db/misc"

function postReq(url: string, body: unknown) {
  return new Request(url, { method: "POST", body: JSON.stringify(body) })
}

describe("POST /api/events/attend", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } })
  })

  it("rejects an invalid status", async () => {
    const res = await attendRoute(postReq("http://localhost/api/events/attend", { eventId: "e1", status: "sort-of" }))
    expect(res.status).toBe(400)
    expect(attendEvent).not.toHaveBeenCalled()
  })

  it("forwards a valid status to attendEvent instead of dropping it", async () => {
    const res = await attendRoute(postReq("http://localhost/api/events/attend", { eventId: "e1", status: "maybe" }))
    expect(res.status).toBe(200)
    expect(attendEvent).toHaveBeenCalledWith("e1", "u1", "maybe")
  })

  it("defaults to undefined status (attendEvent's own default) when omitted", async () => {
    const res = await attendRoute(postReq("http://localhost/api/events/attend", { eventId: "e1" }))
    expect(res.status).toBe(200)
    expect(attendEvent).toHaveBeenCalledWith("e1", "u1", undefined)
  })
})

describe("POST /api/polls", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } })
    ;(createPoll as jest.Mock).mockResolvedValue({ id: "poll-1" })
  })

  it("requires a question", async () => {
    const res = await pollsRoute(postReq("http://localhost/api/polls", { options: ["A", "B"] }))
    expect(res.status).toBe(400)
    expect(createPoll).not.toHaveBeenCalled()
  })

  it("forwards isAnonymous and converts durationHours into an expires_at timestamp", async () => {
    const before = Date.now()
    const res = await pollsRoute(
      postReq("http://localhost/api/polls", { question: "Best IDE?", options: ["Vim", "Emacs"], durationHours: 24, isAnonymous: true })
    )
    expect(res.status).toBe(201)
    expect(createPoll).toHaveBeenCalledTimes(1)
    const call = (createPoll as jest.Mock).mock.calls[0][0]
    expect(call.question).toBe("Best IDE?")
    expect(call.is_anonymous).toBe(true)
    expect(call.expires_at).not.toBeNull()
    expect(new Date(call.expires_at).getTime()).toBeGreaterThan(before)
  })

  it("defaults is_anonymous to false and expires_at to null when omitted", async () => {
    const res = await pollsRoute(postReq("http://localhost/api/polls", { question: "Q?", options: ["A", "B"] }))
    expect(res.status).toBe(201)
    const call = (createPoll as jest.Mock).mock.calls[0][0]
    expect(call.is_anonymous).toBe(false)
    expect(call.expires_at).toBeNull()
  })
})
