import { getNotificationUrl } from "./url"

describe("getNotificationUrl", () => {
  it("routes messages to /messages", () => {
    expect(getNotificationUrl({ type: "message" })).toBe("/messages")
    expect(getNotificationUrl({ reference_type: "conversation" })).toBe("/messages")
  })

  it("routes follows to the follower's profile", () => {
    expect(getNotificationUrl({ type: "follow", from_user_id: "user-1" })).toBe("/profile/user-1")
  })

  it("routes post-referencing notifications (like, comment, reply, mention) to the post", () => {
    expect(getNotificationUrl({ type: "like", reference_type: "post", reference_id: "post-1" })).toBe("/post/post-1")
    expect(getNotificationUrl({ type: "mention", reference_type: "post", reference_id: "post-2" })).toBe("/post/post-2")
  })

  it("routes question-referencing notifications (answer, answer_accepted) to Q&A", () => {
    expect(getNotificationUrl({ type: "answer", reference_type: "question", reference_id: "q-1" })).toBe("/q-and-a/q-1")
    expect(getNotificationUrl({ type: "answer_accepted", reference_type: "question", reference_id: "q-2" })).toBe("/q-and-a/q-2")
  })

  it("routes event RSVPs to the event", () => {
    expect(getNotificationUrl({ type: "event_rsvp", reference_type: "event", reference_id: "e-1" })).toBe("/events/e-1")
  })

  it("routes community invites/approvals to the community", () => {
    expect(getNotificationUrl({ type: "community_invite", reference_type: "community", reference_id: "c-1" })).toBe("/c/c-1")
  })

  it("falls back to /notifications when nothing matches", () => {
    expect(getNotificationUrl({ type: "unknown" })).toBe("/notifications")
  })
})
