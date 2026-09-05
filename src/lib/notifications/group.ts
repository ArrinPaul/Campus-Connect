// Collapses repeat engagement notifications on the same target ("Alice and 3
// others liked your post") instead of showing one row per like/RSVP. Only
// applied to notification types where every event carries the same meaning
// regardless of who did it — types like "answer" or "message" keep distinct
// content per notification and are never grouped, even when they share a
// reference_id.
const GROUPABLE_TYPES: Record<string, string> = {
  like: "liked your post",
  event_rsvp: "are attending your event",
}

export interface NotificationLike {
  id: string
  user_id?: string
  type: string
  reference_type?: string
  reference_id?: string
  message: string
  read: boolean
  created_at: string
  from_user_id?: string
  from_user: { id: string; name: string; profile_picture?: string } | null
}

export interface GroupedNotification extends NotificationLike {
  // All source notification ids folded into this group, most-recent first.
  // Length 1 for an ungrouped notification.
  ids: string[]
}

function formatActorList(names: string[]): string {
  const unique = Array.from(new Set(names.filter(Boolean)))
  if (unique.length === 0) return "Someone"
  if (unique.length === 1) return unique[0]
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`
  return `${unique[0]} and ${unique.length - 1} others`
}

export function groupNotifications<T extends NotificationLike>(notifications: T[]): GroupedNotification[] {
  if (!notifications || notifications.length === 0) return []

  const groups = new Map<string, GroupedNotification & { actorNames: string[] }>()
  const order: string[] = []

  for (const n of notifications) {
    const canGroup = Boolean(GROUPABLE_TYPES[n.type] && n.reference_id)
    const key = canGroup ? `${n.type}:${n.reference_type ?? ""}:${n.reference_id}` : `single:${n.id}`

    const existing = groups.get(key)
    if (!existing) {
      groups.set(key, { ...n, ids: [n.id], actorNames: n.from_user?.name ? [n.from_user.name] : [] })
      order.push(key)
      continue
    }

    existing.ids.push(n.id)
    existing.read = existing.read && n.read
    if (n.from_user?.name) existing.actorNames.push(n.from_user.name)
    if (new Date(n.created_at).getTime() > new Date(existing.created_at).getTime()) {
      existing.created_at = n.created_at
      existing.from_user = n.from_user
      existing.from_user_id = n.from_user_id
    }
  }

  return order.map((key) => {
    const g = groups.get(key)!
    const { actorNames, ...rest } = g
    if (rest.ids.length > 1) {
      const verb = GROUPABLE_TYPES[rest.type]
      rest.message = `${formatActorList(actorNames)} ${verb}`
    }
    return rest
  })
}
