/**
 * @jest-environment node
 *
 * The marketplace detail page called purchase/complete/cancel/transactions
 * routes that didn't exist, and every list/detail component read camelCase
 * fields (createdAt, _id, sellerId) that the real rows don't have
 * (docs/TASKS.md §7).
 */
import { POST as purchase } from "@/app/api/marketplace/purchase/route"
import { POST as complete } from "@/app/api/marketplace/complete/route"
import { POST as cancel } from "@/app/api/marketplace/cancel/route"
import { GET as transactions } from "@/app/api/marketplace/transactions/route"

const mockGetUser = jest.fn()
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}))
jest.mock("@/server/db/misc", () => ({
  purchaseListing: jest.fn(),
  completeTransaction: jest.fn(),
  cancelTransaction: jest.fn(),
  getListingTransactions: jest.fn(),
}))
import { purchaseListing, completeTransaction, cancelTransaction, getListingTransactions } from "@/server/db/misc"

const post = (b: unknown) => new Request("http://x", { method: "POST", body: JSON.stringify(b) })
beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: "me" } } })
})

describe("marketplace purchase requests", () => {
  it("purchase requires auth and a listingId", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    expect((await purchase(post({ listingId: "l1" }))).status).toBe(401)
    expect((await purchase(post({}))).status).toBe(400)
  })
  it("purchase returns 201 and passes a trimmed message", async () => {
    ;(purchaseListing as jest.Mock).mockResolvedValue({ data: { id: "t1" } })
    const res = await purchase(post({ listingId: "l1", message: "  hi  " }))
    expect(res.status).toBe(201)
    expect(purchaseListing).toHaveBeenCalledWith("l1", "me", "hi")
  })
  it("purchase surfaces db errors (own listing / duplicate)", async () => {
    ;(purchaseListing as jest.Mock).mockResolvedValue({ error: "You already have a pending request for this listing", status: 409 })
    expect((await purchase(post({ listingId: "l1" }))).status).toBe(409)
  })
  it("complete is scoped to the caller as seller", async () => {
    ;(completeTransaction as jest.Mock).mockResolvedValue({ error: "Transaction not found", status: 404 })
    expect((await complete(post({ transactionId: "t1" }))).status).toBe(404)
    expect(completeTransaction).toHaveBeenCalledWith("t1", "me")
  })
  it("cancel works for a participant", async () => {
    ;(cancelTransaction as jest.Mock).mockResolvedValue({ data: { id: "t1", status: "cancelled" } })
    expect((await cancel(post({ transactionId: "t1" }))).status).toBe(200)
  })
  it("transactions lists only for the signed-in seller", async () => {
    ;(getListingTransactions as jest.Mock).mockResolvedValue([{ id: "t1" }])
    const res = await transactions(new Request("http://x/api/marketplace/transactions?listingId=l1"))
    expect(await res.json()).toEqual([{ id: "t1" }])
    expect(getListingTransactions).toHaveBeenCalledWith("l1", "me")
    expect((await transactions(new Request("http://x/api/marketplace/transactions"))).status).toBe(400)
  })
})
