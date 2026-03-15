import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

export interface DbConversation {
  id: string
  type: "direct" | "group"
  name?: string
  avatarUrl?: string
  lastMessagePreview?: string
  lastMessageAt?: number
  createdAt: number
  otherUsers?: Record<string, unknown>[]
  unreadCount?: number
  isMuted?: boolean
}

export interface DbMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  messageType: string
  attachmentUrl?: string
  attachmentName?: string
  replyToId?: string
  status: string
  isDeleted: boolean
  createdAt: number
  sender?: Record<string, unknown>
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getOrCreateDMConversation(
  clerkId: string,
  otherUserId: string
): Promise<string> {
  return runWrite(async (session) => {
    // Check for existing DM
    const existing = await session.run(
      `MATCH (u1:User {clerkId: $clerkId})-[:PARTICIPANT_IN]->(c:Conversation {type: 'direct'})<-[:PARTICIPANT_IN]-(u2:User)
       WHERE u2.id = $otherUserId OR u2.clerkId = $otherUserId
       RETURN c.id AS id LIMIT 1`,
      { clerkId, otherUserId }
    )
    if (existing.records.length) return existing.records[0].get("id") as string

    const id = randomUUID()
    await session.run(
      `MATCH (u1:User {clerkId: $clerkId})
       MATCH (u2:User) WHERE u2.id = $otherUserId OR u2.clerkId = $otherUserId
       CREATE (c:Conversation {id: $id, type: 'direct', createdAt: $now})
       CREATE (u1)-[:PARTICIPANT_IN {isMuted: false, joinedAt: $now}]->(c)
       CREATE (u2)-[:PARTICIPANT_IN {isMuted: false, joinedAt: $now}]->(c)
       RETURN c.id AS id`,
      { clerkId, otherUserId, id, now: Date.now() }
    )
    return id
  })
}

export async function createGroupConversation(
  clerkId: string,
  participantUserIds: string[],
  name: string
): Promise<string> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    await session.run(
      `MATCH (creator:User {clerkId: $clerkId})
       CREATE (c:Conversation {id: $id, type: 'group', name: $name, createdAt: $now, createdBy: creator.id})
       CREATE (creator)-[:PARTICIPANT_IN {isMuted: false, joinedAt: $now, role: 'admin'}]->(c)
       RETURN c`,
      { clerkId, id, name, now }
    )

    for (const uid of participantUserIds) {
      await session.run(
        `MATCH (u:User) WHERE u.id = $uid OR u.clerkId = $uid
         MATCH (c:Conversation {id: $id})
         CREATE (u)-[:PARTICIPANT_IN {isMuted: false, joinedAt: $now}]->(c)`,
        { uid, id, now }
      )
    }

    return id
  })
}

export async function getConversations(
  clerkId: string,
  limit = 50
): Promise<DbConversation[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (me:User {clerkId: $clerkId})-[p:PARTICIPANT_IN]->(c:Conversation)
       OPTIONAL MATCH (other:User)-[:PARTICIPANT_IN]->(c)
       WHERE other.clerkId <> $clerkId
       WITH c, p, collect(other) AS others
       ORDER BY coalesce(c.lastMessageAt, c.createdAt) DESC
       LIMIT $limit
       RETURN c, p, others`,
      { clerkId, limit }
    )

    return result.records.map((r) => {
      const conv = toPlain(r.get("c").properties)
      const part = r.get("p").properties
      const others = (r.get("others") as unknown[]).map((o) =>
        toPlain((o as { properties: Record<string, unknown> }).properties)
      )
      return {
        ...conv,
        isMuted: part.isMuted ?? false,
        otherUsers: others,
      } as unknown as DbConversation
    })
  })
}

export async function getConversationById(
  conversationId: string,
  clerkId: string
): Promise<DbConversation | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (me:User {clerkId: $clerkId})-[p:PARTICIPANT_IN]->(c:Conversation {id: $conversationId})
       OPTIONAL MATCH (other:User)-[:PARTICIPANT_IN]->(c)
       WHERE other.clerkId <> $clerkId
       RETURN c, p, collect(other) AS others`,
      { clerkId, conversationId }
    )
    if (!result.records.length) return null
    const conv = toPlain(result.records[0].get("c").properties)
    const part = result.records[0].get("p").properties
    const others = (result.records[0].get("others") as unknown[]).map((o) =>
      toPlain((o as { properties: Record<string, unknown> }).properties)
    )
    return { ...conv, isMuted: part.isMuted ?? false, otherUsers: others } as unknown as DbConversation
  })
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function sendMessage(
  clerkId: string,
  data: {
    conversationId: string
    content: string
    messageType?: string
    attachmentUrl?: string
    attachmentName?: string
    replyToId?: string
  }
): Promise<DbMessage> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()

    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:PARTICIPANT_IN]->(c:Conversation {id: $conversationId})
       CREATE (m:Message {
         id: $id,
         conversationId: $conversationId,
         senderId: u.id,
         content: $content,
         messageType: $messageType,
         attachmentUrl: $attachmentUrl,
         attachmentName: $attachmentName,
         replyToId: $replyToId,
         status: 'sent',
         isDeleted: false,
         createdAt: $now
       })
       CREATE (u)-[:SENT]->(m)
       CREATE (m)-[:IN_CONVERSATION]->(c)
       SET c.lastMessagePreview = $preview,
           c.lastMessageAt = $now
       RETURN m, u`,
      {
        clerkId,
        conversationId: data.conversationId,
        id,
        content: data.content,
        messageType: data.messageType ?? "text",
        attachmentUrl: data.attachmentUrl ?? null,
        attachmentName: data.attachmentName ?? null,
        replyToId: data.replyToId ?? null,
        preview: data.content.slice(0, 100),
        now,
      }
    )

    if (!result.records.length) throw new Error("Conversation not found or not a participant")

    return {
      ...toPlain(result.records[0].get("m").properties),
      sender: toPlain(result.records[0].get("u").properties),
    } as unknown as DbMessage
  })
}

export async function getMessages(
  clerkId: string,
  conversationId: string,
  limit = 50,
  cursor?: string
): Promise<{ messages: DbMessage[]; hasMore: boolean; nextCursor: string | null }> {
  return runRead(async (session) => {
    const cursorTs = cursor ? parseInt(cursor, 10) : Date.now() + 1

    const result = await session.run(
      `MATCH (me:User {clerkId: $clerkId})-[:PARTICIPANT_IN]->(c:Conversation {id: $conversationId})
       MATCH (m:Message {conversationId: $conversationId})<-[:SENT]-(sender:User)
       WHERE m.createdAt < $cursorTs AND m.isDeleted = false
       RETURN m, sender
       ORDER BY m.createdAt DESC
       LIMIT $limit`,
      { clerkId, conversationId, cursorTs, limit: limit + 1 }
    )

    const all = result.records.map((r) => ({
      ...toPlain(r.get("m").properties),
      sender: toPlain(r.get("sender").properties),
    })) as unknown as DbMessage[]

    const hasMore = all.length > limit
    const messages = hasMore ? all.slice(0, limit) : all

    // Return oldest first
    messages.reverse()

    const nextCursor =
      hasMore && messages.length > 0
        ? String(messages[0].createdAt)
        : null

    return { messages, hasMore, nextCursor }
  })
}

export async function deleteMessage(messageId: string, clerkId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:SENT]->(m:Message {id: $messageId})
       SET m.isDeleted = true, m.content = '[Message deleted]'`,
      { messageId, clerkId }
    )
  })
}

export async function leaveConversation(conversationId: string, clerkId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[p:PARTICIPANT_IN]->(c:Conversation {id: $conversationId})
       DELETE p`,
      { conversationId, clerkId }
    )
  })
}
