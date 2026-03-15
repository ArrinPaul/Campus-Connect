import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

export interface DbHashtag {
  id: string
  tag: string
  postCount: number
  trendingScore: number
  lastUsedAt: number
}

export async function getTrending(limit = 10): Promise<DbHashtag[]> {
  return runRead(async (session) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const result = await session.run(
      `MATCH (h:Hashtag)
       WHERE h.lastUsedAt >= $since
       RETURN h
       ORDER BY h.postCount DESC
       LIMIT $limit`,
      { since: oneDayAgo, limit }
    )
    return result.records.map((r) => toPlain(r.get("h").properties) as unknown as DbHashtag)
  })
}

export async function getByTag(tag: string): Promise<DbHashtag | null> {
  return runRead(async (session) => {
    const normalized = tag.toLowerCase().replace(/^#/, "")
    const result = await session.run(
      `MATCH (h:Hashtag {tag: $tag}) RETURN h`,
      { tag: normalized }
    )
    if (!result.records.length) return null
    return toPlain(result.records[0].get("h").properties) as unknown as DbHashtag
  })
}

export async function searchHashtags(query: string, limit = 10): Promise<DbHashtag[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (h:Hashtag)
       WHERE h.tag STARTS WITH toLower($query)
       RETURN h
       ORDER BY h.postCount DESC
       LIMIT $limit`,
      { query: query.toLowerCase().replace(/^#/, ""), limit }
    )
    return result.records.map((r) => toPlain(r.get("h").properties) as unknown as DbHashtag)
  })
}

export async function upsertHashtag(tag: string): Promise<string> {
  return runWrite(async (session) => {
    const normalized = tag.toLowerCase()
    const result = await session.run(
      `MERGE (h:Hashtag {tag: $tag})
       ON CREATE SET h.id = $id, h.postCount = 0, h.trendingScore = 0, h.lastUsedAt = $now
       RETURN h.id AS id`,
      { tag: normalized, id: randomUUID(), now: Date.now() }
    )
    return result.records[0].get("id") as string
  })
}
