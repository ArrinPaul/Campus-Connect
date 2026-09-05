/**
 * Single source of truth for "where does clicking/opening this notification
 * go". Previously duplicated three times — the push-notification sender
 * (server/db/notifications.ts), NotificationBell.tsx, and
 * NotificationItem.tsx — each with a slightly different, incomplete
 * mapping, and the two client components additionally referenced
 * camelCase fields (notification.actor, .isRead, .createdAt, .actorId,
 * .referenceId) that don't exist on the real API response (from_user,
 * read, created_at, from_user_id, reference_id) — since the notifications
 * table was always empty before this session, that mismatch never ran in
 * practice and would have thrown on the first real notification
 * (formatDistanceToNow(undefined) is a RangeError).
 */
export interface NotificationForRouting {
  type?: string
  reference_type?: string
  reference_id?: string
  from_user_id?: string
}

export function getNotificationUrl(n: NotificationForRouting): string {
  const { type, reference_type, reference_id, from_user_id } = n

  if (type === "message" || reference_type === "conversation") return "/messages"
  if ((type === "follow" || reference_type === "user") && from_user_id) return `/profile/${from_user_id}`
  if (reference_type === "post" && reference_id) return `/post/${reference_id}`
  if (reference_type === "question" && reference_id) return `/q-and-a/${reference_id}`
  if (reference_type === "research_paper" && reference_id) return `/research/${reference_id}`
  if (reference_type === "marketplace" && reference_id) return `/marketplace/${reference_id}`
  if (reference_type === "event" && reference_id) return `/events/${reference_id}`
  if (reference_type === "community" && reference_id) return `/c/${reference_id}`
  if (reference_id) return `/post/${reference_id}`
  return "/notifications"
}
