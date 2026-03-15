import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

export interface DbBookmark {
  id: string
  userId: string
  postId: string
  collectionName: string
  createdAt: number
  post?: Record<string, unknown>
}

export async function addBookmark(
  clerkId: string,
  postId: string,
  collectionName = "Saved"
): Promise<{ action: string }> {
  return runWrite(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       MATCH (p:Post {id: $postId})
       MERGE (u)-[b:BOOKMARKED]->(p)
       ON CREATE SET b.id = $id, b.collectionName = $collectionName, b.createdAt = $now
         RETURN 'created' AS action
       ON MATCH SET b.collectionName = CASE WHEN $collectionName <> b.collectionName THEN $collectionName ELSE b.collectionName END
       RETURN 'updated' AS action`,
      { clerkId, postId, id: randomUUID(), collectionName, now: Date.now() }
    )
    return { action: result.records[0]?.get("action") ?? "created" }
  })
}

export async function removeBookmark(clerkId: string, postId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[b:BOOKMARKED]->(p:Post {id: $postId})
       DELETE b`,
      { clerkId, postId }
    )
  })
}

export async function isBookmarked(clerkId: string, postId: string): Promise<boolean> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[b:BOOKMARKED]->(p:Post {id: $postId})
       RETURN count(b) AS n`,
      { clerkId, postId }
    )
    return ((result.records[0]?.get("n") as { low: number })?.low ?? 0) > 0
  })
}

export async function getBookmarks(
  clerkId: string,
  collectionName?: string,
  limit = 20,
  cursor?: string
): Promise<{ bookmarks: DbBookmark[]; hasMore: boolean; nextCursor: string | null }> {
  return runRead(async (session) => {
    const cursorTs = cursor ? parseInt(cursor, 10) : Date.now() + 1
    const collectionFilter = collectionName ? `AND b.collectionName = '${collectionName}'` : ""

    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[b:BOOKMARKED]->(p:Post)<-[:AUTHORED]-(author:User)
       WHERE b.createdAt < $cursorTs ${collectionFilter}
       RETURN b, p, author
       ORDER BY b.createdAt DESC
       LIMIT $limit`,
      { clerkId, cursorTs, limit: limit + 1 }
    )

    const all = result.records.map((r) => ({
      ...toPlain(r.get("b").properties),
      post: { ...toPlain(r.get("p").properties), author: toPlain(r.get("author").properties) },
    })) as unknown as DbBookmark[]

    const hasMore = all.length > limit
    const bookmarks = hasMore ? all.slice(0, limit) : all
    const nextCursor =
      hasMore && bookmarks.length > 0
        ? String(bookmarks[bookmarks.length - 1].createdAt)
        : null

    return { bookmarks, hasMore, nextCursor }
  })
}

export async function getBookmarkCollections(clerkId: string): Promise<string[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[b:BOOKMARKED]->(:Post)
       RETURN DISTINCT b.collectionName AS name
       ORDER BY name`,
      { clerkId }
    )
    return result.records.map((r) => r.get("name") as string)
  })
}
