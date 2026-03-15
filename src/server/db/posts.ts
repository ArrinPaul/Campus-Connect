import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

export interface DbPost {
  id: string
  authorId: string
  content: string
  mediaUrls?: string[]
  mediaType?: string
  mediaFileNames?: string[]
  linkPreview?: Record<string, unknown>
  pollId?: string
  communityId?: string
  likeCount: number
  commentCount: number
  shareCount: number
  createdAt: number
  updatedAt: number
  author?: Record<string, unknown>
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createPost(
  authorClerkId: string,
  data: {
    content: string
    mediaUrls?: string[]
    mediaType?: string
    mediaFileNames?: string[]
    linkPreview?: Record<string, unknown>
    pollId?: string
    communityId?: string
  }
): Promise<DbPost> {
  return runWrite(async (session) => {
    const now = Date.now()
    const id = randomUUID()

    const result = await session.run(
      `MATCH (u:User {clerkId: $authorClerkId})
       CREATE (p:Post {
         id: $id,
         authorId: u.id,
         authorClerkId: $authorClerkId,
         content: $content,
         mediaUrls: $mediaUrls,
         mediaType: $mediaType,
         mediaFileNames: $mediaFileNames,
         linkPreview: $linkPreview,
         pollId: $pollId,
         communityId: $communityId,
         likeCount: 0,
         commentCount: 0,
         shareCount: 0,
         createdAt: $now,
         updatedAt: $now
       })
       CREATE (u)-[:AUTHORED]->(p)
       RETURN p, u`,
      {
        authorClerkId,
        id,
        content: data.content,
        mediaUrls: data.mediaUrls ?? [],
        mediaType: data.mediaType ?? null,
        mediaFileNames: data.mediaFileNames ?? [],
        linkPreview: data.linkPreview ? JSON.stringify(data.linkPreview) : null,
        pollId: data.pollId ?? null,
        communityId: data.communityId ?? null,
        now,
      }
    )

    // Extract hashtags and create/link them
    await linkHashtagsToPost(session, id, data.content)

    const post = toPlain(result.records[0].get("p").properties)
    const author = toPlain(result.records[0].get("u").properties)
    return { ...post, author } as unknown as DbPost
  })
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getPostById(postId: string): Promise<DbPost | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (p:Post {id: $postId})<-[:AUTHORED]-(u:User)
       RETURN p, u`,
      { postId }
    )
    if (!result.records.length) return null
    const post = toPlain(result.records[0].get("p").properties)
    const author = toPlain(result.records[0].get("u").properties)
    return { ...post, author } as unknown as DbPost
  })
}

export async function getFeedPosts(
  clerkId: string,
  limit = 10,
  cursor?: string
): Promise<{ posts: DbPost[]; hasMore: boolean; nextCursor: string | null }> {
  return runRead(async (session) => {
    const cursorTs = cursor ? parseInt(cursor, 10) : Date.now() + 1
    const result = await session.run(
      `MATCH (me:User {clerkId: $clerkId})
       OPTIONAL MATCH (me)-[:FOLLOWS]->(followed:User)-[:AUTHORED]->(p:Post)
       WITH me, p, followed
       WHERE p IS NOT NULL AND p.createdAt < $cursorTs
         AND (p.communityId IS NULL)
       WITH p, followed AS u
       ORDER BY p.createdAt DESC
       LIMIT $limit
       RETURN p, u`,
      { clerkId, cursorTs, limit: limit + 1 }
    )

    const all = result.records.map((r) => ({
      ...toPlain(r.get("p").properties),
      author: toPlain(r.get("u").properties),
    })) as unknown as DbPost[]

    const hasMore = all.length > limit
    const posts = hasMore ? all.slice(0, limit) : all
    const nextCursor =
      hasMore && posts.length > 0
        ? String((posts[posts.length - 1] as unknown as { createdAt: number }).createdAt)
        : null

    return { posts, hasMore, nextCursor }
  })
}

export async function getExplorePosts(
  limit = 20,
  cursor?: string
): Promise<{ posts: DbPost[]; hasMore: boolean; nextCursor: string | null }> {
  return runRead(async (session) => {
    const cursorTs = cursor ? parseInt(cursor, 10) : Date.now() + 1
    const result = await session.run(
      `MATCH (p:Post)<-[:AUTHORED]-(u:User)
       WHERE p.createdAt < $cursorTs AND p.communityId IS NULL
       RETURN p, u
       ORDER BY p.createdAt DESC
       LIMIT $limit`,
      { cursorTs, limit: limit + 1 }
    )

    const all = result.records.map((r) => ({
      ...toPlain(r.get("p").properties),
      author: toPlain(r.get("u").properties),
    })) as unknown as DbPost[]

    const hasMore = all.length > limit
    const posts = hasMore ? all.slice(0, limit) : all
    const nextCursor =
      hasMore && posts.length > 0
        ? String((posts[posts.length - 1] as unknown as { createdAt: number }).createdAt)
        : null

    return { posts, hasMore, nextCursor }
  })
}

export async function getUserPosts(
  userId: string,
  limit = 20,
  cursor?: string
): Promise<{ posts: DbPost[]; hasMore: boolean; nextCursor: string | null }> {
  return runRead(async (session) => {
    const cursorTs = cursor ? parseInt(cursor, 10) : Date.now() + 1
    const result = await session.run(
      `MATCH (u:User)-[:AUTHORED]->(p:Post)
       WHERE (u.id = $userId OR u.clerkId = $userId)
         AND p.createdAt < $cursorTs
       RETURN p, u
       ORDER BY p.createdAt DESC
       LIMIT $limit`,
      { userId, cursorTs, limit: limit + 1 }
    )

    const all = result.records.map((r) => ({
      ...toPlain(r.get("p").properties),
      author: toPlain(r.get("u").properties),
    })) as unknown as DbPost[]

    const hasMore = all.length > limit
    const posts = hasMore ? all.slice(0, limit) : all
    const nextCursor =
      hasMore && posts.length > 0
        ? String((posts[posts.length - 1] as unknown as { createdAt: number }).createdAt)
        : null

    return { posts, hasMore, nextCursor }
  })
}

export async function getPostsByHashtag(
  tag: string,
  limit = 20,
  cursor?: string
): Promise<{ posts: DbPost[]; hasMore: boolean; nextCursor: string | null }> {
  return runRead(async (session) => {
    const cursorTs = cursor ? parseInt(cursor, 10) : Date.now() + 1
    const normalizedTag = tag.toLowerCase().replace(/^#/, "")
    const result = await session.run(
      `MATCH (p:Post)-[:HAS_HASHTAG]->(h:Hashtag {tag: $tag})
       MATCH (u:User)-[:AUTHORED]->(p)
       WHERE p.createdAt < $cursorTs
       RETURN p, u
       ORDER BY p.createdAt DESC
       LIMIT $limit`,
      { tag: normalizedTag, cursorTs, limit: limit + 1 }
    )

    const all = result.records.map((r) => ({
      ...toPlain(r.get("p").properties),
      author: toPlain(r.get("u").properties),
    })) as unknown as DbPost[]

    const hasMore = all.length > limit
    const posts = hasMore ? all.slice(0, limit) : all
    const nextCursor =
      hasMore && posts.length > 0
        ? String((posts[posts.length - 1] as unknown as { createdAt: number }).createdAt)
        : null

    return { posts, hasMore, nextCursor }
  })
}

// ─── Update / Delete ──────────────────────────────────────────────────────────

export async function updatePost(
  postId: string,
  clerkId: string,
  content: string
): Promise<DbPost> {
  return runWrite(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:AUTHORED]->(p:Post {id: $postId})
       SET p.content = $content, p.updatedAt = $now
       RETURN p, u`,
      { postId, clerkId, content, now: Date.now() }
    )
    if (!result.records.length) throw new Error("Post not found or unauthorized")
    return {
      ...toPlain(result.records[0].get("p").properties),
      author: toPlain(result.records[0].get("u").properties),
    } as unknown as DbPost
  })
}

export async function deletePost(postId: string, clerkId: string): Promise<void> {
  return runWrite(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:AUTHORED]->(p:Post {id: $postId})
       DETACH DELETE p
       RETURN count(p) AS deleted`,
      { postId, clerkId }
    )
    const deleted = result.records[0]?.get("deleted")?.low ?? 0
    if (deleted === 0) throw new Error("Post not found or unauthorized")
  })
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function linkHashtagsToPost(session: unknown, postId: string, content: string): Promise<void> {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g
  const matches = Array.from(content.matchAll(hashtagRegex), (m) => m[1].toLowerCase())
  const tags = Array.from(new Set(matches))
  if (!tags.length) return

  const s = session as { run: (q: string, p: Record<string, unknown>) => Promise<unknown> }
  for (const tag of tags) {
    await s.run(
      `MERGE (h:Hashtag {tag: $tag})
       ON CREATE SET h.id = $id, h.postCount = 1, h.lastUsedAt = $now, h.trendingScore = 0
       ON MATCH SET h.postCount = h.postCount + 1, h.lastUsedAt = $now
       WITH h
       MATCH (p:Post {id: $postId})
       MERGE (p)-[:HAS_HASHTAG]->(h)`,
      { tag, id: randomUUID(), postId, now: Date.now() }
    )
  }
}
