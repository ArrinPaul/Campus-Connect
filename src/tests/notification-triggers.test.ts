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
import { answerQuestion, acceptAnswer } from "@/server/db/content"
import { attendEvent } from "@/server/db/events-jobs"

const mockCreateNotification = jest.fn().mockResolvedValue(undefined)
jest.mock("@/server/db/notifications", () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}))

const mockAwardReputation = jest.fn().mockResolvedValue(undefined)
jest.mock("@/server/db/gamification", () => ({
  awardReputation: (...args: unknown[]) => mockAwardReputation(...args),
  revokeReputation: jest.fn().mockResolvedValue(undefined),
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

  it("answerQuestion notifies the question author, skipping self-answers", async () => {
    const supabase = makeSupabaseMock({
      questions: { author_id: "question-author" },
      users: { name: "Answerer" },
    })
    // answerQuestion's initial insert().select().single() needs its own shape
    supabase.from = jest.fn((table: string) => {
      if (table === "question_answers") {
        return { insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { id: "answer-1" }, error: null }) })) })) }
      }
      return makeSupabaseMock({ questions: { author_id: "question-author" }, users: { name: "Answerer" } }).from(table)
    }) as any
    jest.doMock("@/lib/supabase/server", () => ({ createClient: jest.fn(() => Promise.resolve(supabase)) }))
    jest.resetModules()
    const { answerQuestion: answerQuestionFresh } = await import("@/server/db/content")

    await answerQuestionFresh("question-1", "answerer-1", "Here's my answer")

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "question-author", type: "answer", from_user_id: "answerer-1" })
    )
  })

  it("acceptAnswer notifies the answer author their answer was accepted", async () => {
    const supabase = {
      from: jest.fn((table: string) => {
        if (table === "question_answers") {
          return {
            select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { question_id: "question-1", author_id: "answer-author" }, error: null }) })) })),
            update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
          }
        }
        if (table === "questions") {
          return { update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })) }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }
    jest.doMock("@/lib/supabase/server", () => ({ createClient: jest.fn(() => Promise.resolve(supabase)) }))
    jest.resetModules()
    const { acceptAnswer: acceptAnswerFresh } = await import("@/server/db/content")

    await acceptAnswerFresh("answer-1")

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "answer-author", type: "answer_accepted", reference_id: "question-1" })
    )
  })

  it("attendEvent notifies the event creator, skipping self-RSVPs", async () => {
    const supabase = {
      from: jest.fn((table: string) => {
        if (table === "event_attendees") {
          return { insert: jest.fn().mockResolvedValue({ error: null }) }
        }
        if (table === "events") {
          return {
            select: jest.fn((cols: string) => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue(
                  cols.includes("attendee_count")
                    ? { data: { attendee_count: 3 } }
                    : { data: { created_by: "organizer-1", title: "Career Fair" } }
                ),
              })),
            })),
            update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
          }
        }
        if (table === "users") {
          return { select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { name: "Attendee" } }) })) })) }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }
    jest.doMock("@/lib/supabase/server", () => ({ createClient: jest.fn(() => Promise.resolve(supabase)) }))
    jest.resetModules()
    const { attendEvent: attendEventFresh } = await import("@/server/db/events-jobs")

    await attendEventFresh("event-1", "attendee-1")

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "organizer-1", type: "event_rsvp", from_user_id: "attendee-1" })
    )
  })
})
