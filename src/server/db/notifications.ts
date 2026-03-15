import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

export interface DbNotification {
  id: string
  recipientId: string
  actorId: string
  type: string
  referenceId?: string
  message: string
  isRead: boolean
  createdAt: number
  actor?: Record<string, unknown>
}

export async function createNotification(data: {
  recipientClerkId: string
  actorClerkId: string
  type: string
  referenceId?: string
  message: string
}): Promise<void> {
  return runWrite(async (session) => {
    // Don't notify self
    if (data.recipientClerkId === data.actorClerkId) return

    await session.run(
      `MATCH (recipient:User {clerkId: $recipientClerkId})
       MATCH (actor:User {clerkId: $actorClerkId})
       CREATE (n:Notification {
         id: $id,
         recipientId: recipient.id,
         actorId: actor.id,
         type: $type,
         referenceId: $referenceId,
         message: $message,
         isRead: false,
         createdAt: $now
       })
       CREATE (recipient)-[:HAS_NOTIFICATION]->(n)
       CREATE (actor)-[:TRIGGERED]->(n)`,
      {
        recipientClerkId: data.recipientClerkId,
        actorClerkId: data.actorClerkId,
        id: randomUUID(),
        type: data.type,
        referenceId: data.referenceId ?? null,
        message: data.message,
        now: Date.now(),
      }
    )
  })
}

export async function getNotifications(
  clerkId: string,
  filter?: string,
  limit = 20,
  cursor?: string
): Promise<{ notifications: DbNotification[]; hasMore: boolean; nextCursor: string | null }> {
  return runRead(async (session) => {
    const cursorTs = cursor ? parseInt(cursor, 10) : Date.now() + 1
    const typeFilter = filter && filter !== "all" ? `AND n.type = '${filter}'` : ""

    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:HAS_NOTIFICATION]->(n:Notification)
       OPTIONAL MATCH (actor:User)-[:TRIGGERED]->(n)
       WHERE n.createdAt < $cursorTs ${typeFilter}
       RETURN n, actor
       ORDER BY n.createdAt DESC
       LIMIT $limit`,
      { clerkId, cursorTs, limit: limit + 1 }
    )

    const all = result.records.map((r) => ({
      ...toPlain(r.get("n").properties),
      actor: r.get("actor") ? toPlain(r.get("actor").properties) : null,
    })) as unknown as DbNotification[]

    const hasMore = all.length > limit
    const notifications = hasMore ? all.slice(0, limit) : all
    const nextCursor =
      hasMore && notifications.length > 0
        ? String(notifications[notifications.length - 1].createdAt)
        : null

    return { notifications, hasMore, nextCursor }
  })
}

export async function markAsRead(notificationId: string, clerkId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:HAS_NOTIFICATION]->(n:Notification {id: $notificationId})
       SET n.isRead = true`,
      { notificationId, clerkId }
    )
  })
}

export async function markAllAsRead(clerkId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:HAS_NOTIFICATION]->(n:Notification)
       WHERE n.isRead = false
       SET n.isRead = true`,
      { clerkId }
    )
  })
}

export async function getUnreadCount(clerkId: string): Promise<number> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:HAS_NOTIFICATION]->(n:Notification {isRead: false})
       RETURN count(n) AS cnt`,
      { clerkId }
    )
    return (result.records[0]?.get("cnt") as { low: number })?.low ?? 0
  })
}
