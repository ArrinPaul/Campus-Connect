import { groupNotifications } from "./group"

function n(overrides: Partial<Parameters<typeof groupNotifications>[0][number]>) {
  return {
    id: "id",
    type: "like",
    reference_type: "post",
    reference_id: "post-1",
    message: "X liked your post",
    read: false,
    created_at: new Date().toISOString(),
    from_user: { id: "u", name: "User" },
    ...overrides,
  }
}

describe("groupNotifications", () => {
  it("collapses multiple likes on the same post into one group", () => {
    const result = groupNotifications([
      n({ id: "1", from_user: { id: "a", name: "Alice" }, created_at: "2026-01-01T00:03:00Z" }),
      n({ id: "2", from_user: { id: "b", name: "Bob" }, created_at: "2026-01-01T00:02:00Z" }),
      n({ id: "3", from_user: { id: "c", name: "Carol" }, created_at: "2026-01-01T00:01:00Z" }),
    ])

    expect(result).toHaveLength(1)
    expect(result[0].ids).toEqual(["1", "2", "3"])
    expect(result[0].message).toBe("Alice and 2 others liked your post")
    // Keeps the most recent notification's actor/timestamp as the display one
    expect(result[0].from_user?.name).toBe("Alice")
    expect(result[0].created_at).toBe("2026-01-01T00:03:00Z")
  })

  it("does not group likes on different posts", () => {
    const result = groupNotifications([
      n({ id: "1", reference_id: "post-1" }),
      n({ id: "2", reference_id: "post-2" }),
    ])
    expect(result).toHaveLength(2)
  })

  it("never groups non-groupable types even with a shared reference_id", () => {
    const result = groupNotifications([
      n({ id: "1", type: "answer", reference_type: "question", reference_id: "q-1", message: "Alice answered your question" }),
      n({ id: "2", type: "answer", reference_type: "question", reference_id: "q-1", message: "Bob answered your question" }),
    ])
    expect(result).toHaveLength(2)
    expect(result[0].message).toBe("Alice answered your question")
    expect(result[1].message).toBe("Bob answered your question")
  })

  it("a group is read only when every notification in it is read", () => {
    const result = groupNotifications([
      n({ id: "1", read: true }),
      n({ id: "2", read: false }),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].read).toBe(false)
  })

  it("passes through a single notification unchanged", () => {
    const single = n({ id: "1", message: "Alice liked your post" })
    const result = groupNotifications([single])
    expect(result).toEqual([{ ...single, ids: ["1"] }])
  })

  it("returns an empty array for empty input", () => {
    expect(groupNotifications([])).toEqual([])
  })
})
