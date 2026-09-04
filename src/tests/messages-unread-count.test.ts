/**
 * @jest-environment node
 *
 * Regression coverage for a real bug: getConversations() computed
 * unreadCount as a 0/1 boolean ("is there anything new") instead of the
 * actual count of unread messages, even though the frontend
 * (ConversationList.tsx) already renders it as a real number badge
 * ("99+" cap included) — so a conversation with 5 unread messages showed
 * a badge of "1". Fixed to count every message from someone else newer
 * than the current user's last_read_at for that conversation.
 */
import { getConversations } from "@/server/db/messages"

function chain(data: any) {
  const c: any = {
    select: jest.fn(() => c),
    eq: jest.fn(() => c),
    in: jest.fn(() => c),
    order: jest.fn(() => c),
    is: jest.fn(() => c),
    then: (resolve: any) => resolve({ data }),
  }
  return c
}

describe("getConversations — unread counts", () => {
  it("counts every unread message from the other user, not just whether any exist", async () => {
    const now = Date.now()
    const lastReadAt = new Date(now - 100000).toISOString()

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === "conversation_participants") {
          return chain([{ conversation_id: "conv-1", user_id: "me", last_read_at: lastReadAt, muted: false }])
        }
        if (table === "conversations") {
          return chain([{ id: "conv-1", type: "direct", created_by: "me", created_at: lastReadAt, updated_at: lastReadAt, name: null }])
        }
        if (table === "messages") {
          return chain([
            { conversation_id: "conv-1", content: "msg3", created_at: new Date(now).toISOString(), sender_id: "other" },
            { conversation_id: "conv-1", content: "msg2", created_at: new Date(now - 1000).toISOString(), sender_id: "other" },
            { conversation_id: "conv-1", content: "msg1", created_at: new Date(now - 2000).toISOString(), sender_id: "other" },
          ])
        }
        if (table === "users") {
          return chain([{ id: "other", name: "Other", username: "other", profile_picture: null }])
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }
    jest.doMock("@/lib/supabase/server", () => ({ createClient: jest.fn(() => Promise.resolve(supabase)) }))
    jest.resetModules()
    const { getConversations: getConversationsFresh } = await import("@/server/db/messages")

    const result = await getConversationsFresh("me")

    expect(result).toHaveLength(1)
    expect((result[0] as any).unreadCount).toBe(3)
  })
})
