import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

export interface DbComment {
  id: string
  postId: string
  authorId: string
  content: string
  parentCommentId?: string
  depth: number
  replyCount: number
  reactionCounts?: Record<string, number>
  createdAt: number
  author?: Record<string, unknown>
}

export async function getPostComments(
  postId: string,
  limit = 20,
  cursor?: string
): Promise<{ comments: DbComment[]; hasMore: boolean; nextCursor: string | null }> {
  return runRead(async (session) => {
    const cursorTs = cursor ? parseInt(cursor, 10) : 0
    const result = await session.run(
      `MATCH (p:Post {id: $postId})<-[:ON_POST]-(c:Comment)<-[:AUTHORED]-(u:User)
       WHERE c.createdAt > $cursorTs
       RETURN c, u
       ORDER BY c.createdAt ASC
       LIMIT $limit`,
      { postId, cursorTs, limit: limit + 1 }
    )

    const all = result.records.map((r) => ({
      ...toPlain(r.get("c").properties),
      author: toPlain(r.get("u").properties),
    })) as unknown as DbComment[]

    const hasMore = all.length > limit
    const comments = hasMore ? all.slice(0, limit) : all
    const nextCursor =
      hasMore && comments.length > 0
        ? String(comments[comments.length - 1].createdAt)
        : null

    return { comments, hasMore, nextCursor }
  })
}

export async function addComment(
  authId: string,
  data: {
    postId: string
    content: string
    parentCommentId?: string
  }
): Promise<DbComment> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const depth = data.parentCommentId ? 1 : 0

    const result = await session.run(
      `MATCH (u:User {authId: $authId}), (p:Post {id: $postId})
       CREATE (c:Comment {
         id: $id,
         postId: $postId,
         authorId: u.id,
         content: $content,
         parentCommentId: $parentCommentId,
         depth: $depth,
         replyCount: 0,
         reactionCounts: '{}',
         createdAt: $now,
         updatedAt: $now
       })
       CREATE (u)-[:AUTHORED]->(c)
       CREATE (c)-[:ON_POST]->(p)
       SET p.commentCount = coalesce(p.commentCount, 0) + 1
       RETURN c, u`,
      {
        authId,
        postId: data.postId,
        id,
        content: data.content,
        parentCommentId: data.parentCommentId ?? null,
        depth,
        now,
      }
    )

    if (data.parentCommentId) {
      await session.run(
        `MATCH (parent:Comment {id: $parentId})
         SET parent.replyCount = coalesce(parent.replyCount, 0) + 1`,
        { parentId: data.parentCommentId }
      )
    }

    return {
      ...toPlain(result.records[0].get("c").properties),
      author: toPlain(result.records[0].get("u").properties),
    } as unknown as DbComment
  })
}

export async function deleteComment(commentId: string, authId: string): Promise<void> {
  return runWrite(async (session) => {
    const result = await session.run(
      `MATCH (u:User {authId: $authId})-[:AUTHORED]->(c:Comment {id: $commentId})
       OPTIONAL MATCH (c)-[:ON_POST]->(p:Post)
       SET p.commentCount = CASE WHEN p.commentCount > 0 THEN p.commentCount - 1 ELSE 0 END
       DETACH DELETE c
       RETURN count(c) AS deleted`,
      { commentId, authId }
    )
    const deleted = result.records[0]?.get("deleted")?.low ?? 0
    if (deleted === 0) throw new Error("Comment not found or unauthorized")
  })
}
