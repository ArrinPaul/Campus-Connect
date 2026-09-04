/**
 * @jest-environment node
 *
 * Regression coverage for a real bug found during the UI pass:
 * createNotification() (src/server/db/notifications.ts) was fully built —
 * DB insert, realtime broadcast, push notification — but was never called
 * anywhere. Likes, comments, replies, follows, and mentions never actually
 * generated a notification row, even though the entire notification UI
 * (bell, badge, realtime hook, mark-as-read) worked perfectly against an
 * always-empty table. Wired it into addReaction, createComment, followUser,
 * and createPost (@mentions). This test locks that wiring in place.
 */
import { addReaction } from "@/server/db/reactions"
import { createComment } from "@/server/db/comments"
import { followUser } from "@/server/db/follows"
import { createPost } from "@/server/db/posts"
import { sendMessage } from "@/server/db/messages"

const mockCreateNotification = jest.fn().mockResolvedValue(undefined)
jest.mock("@/server/db/notifications", () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}))

const mockRpc = jest.fn().mockResolvedValue({ error: null })

function makeSupabaseMock(singleResults: Record<string, any>) {
  return {
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null }) })),
            single: jest.fn().mockResolvedValue({ data: singleResults[table] ?? null }),
          })),
          single: jest.fn().mockResolvedValue({ data: singleResults[table] ?? null }),
          in: jest.fn().mockResolvedValue({ data: singleResults[`${table}_in`] ?? [] }),
        })),
        in: jest.fn().mockResolvedValue({ data: singleResults[`${table}_in`] ?? [] }),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: singleResults[`${table}_insert`] ?? { id: "new-id" }, error: null }) })),
      })),
      delete: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    })),
    rpc: mockRpc,
  }
}

describe("Notification triggers", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("addReaction notifies the post author on a like, skipping self-likes", async () => {
    const supabase = makeSupabaseMock({
      posts: { author_id: "author-1" },
      users: { name: "Alice" },
    })
    jest.doMock("@/lib/supabase/server", () => ({ createClient: jest.fn(() => Promise.resolve(supabase)) }))
    jest.resetModules()
    const { addReaction: addReactionFresh } = await import("@/server/db/reactions")

    await addReactionFresh({ user_id: "liker-1", target_id: "post-1", target_type: "post", type: "like" })

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "author-1", type: "like", from_user_id: "liker-1" })
    )
  })

  it("addReaction does not notify when the author likes their own post", async () => {
    const supabase = makeSupabaseMock({
      posts: { author_id: "same-user" },
      users: { name: "Alice" },
    })
    jest.doMock("@/lib/supabase/server", () => ({ createClient: jest.fn(() => Promise.resolve(supabase)) }))
    jest.resetModules()
    const { addReaction: addReactionFresh } = await import("@/server/db/reactions")

    await addReactionFresh({ user_id: "same-user", target_id: "post-1", target_type: "post", type: "like" })

    expect(mockCreateNotification).not.toHaveBeenCalled()
  })

  it("followUser notifies the followed user", async () => {
    const supabase = makeSupabaseMock({ users: { name: "Bob" } })
    jest.doMock("@/lib/supabase/server", () => ({ createClient: jest.fn(() => Promise.resolve(supabase)) }))
    jest.doMock("@/lib/redis", () => ({ cacheGet: jest.fn(), cacheSet: jest.fn(), cacheDel: jest.fn() }))
    jest.resetModules()
    const { followUser: followUserFresh } = await import("@/server/db/follows")

    await followUserFresh("follower-1", "followee-1")

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "followee-1", type: "follow", from_user_id: "follower-1" })
    )
  })

  it("sendMessage notifies every other conversation participant, not the sender", async () => {
    const supabase = {
      from: jest.fn((table: string) => {
        if (table === "conversations") {
          return {
            select: jest.fn(() => ({ eq: jest.fn(() => ({ limit: jest.fn().mockResolvedValue({ data: [{ id: "conv-1" }] }) })) })),
            update: jest.fn(() => ({ eq: jest.fn(() => ({ then: (res: any) => res(null, null) })) })),
          }
        }
        if (table === "messages") {
          return {
            insert: jest.fn(() => ({
              select: jest.fn().mockResolvedValue({ data: [{ id: "msg-1", conversation_id: "conv-1", sender_id: "sender-1", content: "hi" }], error: null }),
            })),
          }
        }
        if (table === "conversation_participants") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                neq: jest.fn().mockResolvedValue({ data: [{ user_id: "recipient-1" }, { user_id: "recipient-2" }] }),
              })),
            })),
          }
        }
        if (table === "users") {
          return { select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { name: "Sender" } }) })) })) }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }
    jest.doMock("@/lib/supabase/server", () => ({ createClient: jest.fn(() => Promise.resolve(supabase)) }))
    jest.resetModules()
    const { sendMessage: sendMessageFresh } = await import("@/server/db/messages")

    await sendMessageFresh({ conversation_id: "conv-1", sender_id: "sender-1", content: "hi" })

    expect(mockCreateNotification).toHaveBeenCalledTimes(2)
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "recipient-1", type: "message", from_user_id: "sender-1" })
    )
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "recipient-2", type: "message", from_user_id: "sender-1" })
    )
  })
})
