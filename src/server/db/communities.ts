import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

export interface DbCommunity {
  id: string
  name: string
  slug: string
  description?: string
  type: "public" | "private" | "secret"
  avatarUrl?: string
  bannerUrl?: string
  memberCount: number
  createdBy: string
  createdAt: number
  category?: string
  tags?: string[]
  viewerRole?: string
}

export async function createCommunity(
  authId: string,
  data: {
    name: string
    slug: string
    description?: string
    type: "public" | "private" | "secret"
    category?: string
    tags?: string[]
  }
): Promise<DbCommunity> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const result = await session.run(
      `MATCH (u:User {authId: $authId})
       CREATE (c:Community {
         id: $id, name: $name, slug: $slug,
         description: $description, type: $type,
         category: $category, tags: $tags,
         memberCount: 1, createdBy: u.id, createdAt: $now
       })
       CREATE (u)-[:MEMBER_OF {role: 'admin', joinedAt: $now, status: 'active'}]->(c)
       RETURN c`,
      { authId, id, ...data, description: data.description ?? "", category: data.category ?? "", tags: data.tags ?? [], now }
    )
    return toPlain(result.records[0].get("c").properties) as unknown as DbCommunity
  })
}

export async function getCommunityBySlug(slug: string, viewerAuthId?: string): Promise<DbCommunity | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (c:Community {slug: $slug})
       OPTIONAL MATCH (u:User {authId: $viewerAuthId})-[m:MEMBER_OF]->(c)
       RETURN c, m.role AS viewerRole`,
      { slug, viewerAuthId: viewerAuthId ?? null }
    )
    if (!result.records.length) return null
    return {
      ...toPlain(result.records[0].get("c").properties),
      viewerRole: result.records[0].get("viewerRole"),
    } as unknown as DbCommunity
  })
}

export async function getCommunities(
  limit = 20,
  searchQuery?: string
): Promise<DbCommunity[]> {
  return runRead(async (session) => {
    const whereClause = searchQuery
      ? "WHERE toLower(c.name) CONTAINS toLower($query) OR toLower(c.description) CONTAINS toLower($query)"
      : "WHERE c.type <> 'secret'"
    const result = await session.run(
      `MATCH (c:Community) ${whereClause}
       RETURN c ORDER BY c.memberCount DESC LIMIT $limit`,
      { query: searchQuery ?? "", limit }
    )
    return result.records.map((r) => toPlain(r.get("c").properties) as unknown as DbCommunity)
  })
}

export async function joinCommunity(authId: string, communityId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {authId: $authId}), (c:Community {id: $communityId})
       MERGE (u)-[m:MEMBER_OF]->(c)
       ON CREATE SET m.role = CASE WHEN c.type = 'public' THEN 'member' ELSE 'pending' END,
         m.joinedAt = $now, m.status = CASE WHEN c.type = 'public' THEN 'active' ELSE 'pending' END,
         c.memberCount = CASE WHEN c.type = 'public' THEN c.memberCount + 1 ELSE c.memberCount END`,
      { authId, communityId, now: Date.now() }
    )
  })
}

export async function leaveCommunity(authId: string, communityId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {authId: $authId})-[m:MEMBER_OF]->(c:Community {id: $communityId})
       DELETE m
       SET c.memberCount = CASE WHEN c.memberCount > 0 THEN c.memberCount - 1 ELSE 0 END`,
      { authId, communityId }
    )
  })
}

export async function getCommunityMembers(
  communityId: string,
  limit = 50
): Promise<{ user: Record<string, unknown>; role: string; joinedAt: number }[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User)-[m:MEMBER_OF]->(c:Community {id: $communityId})
       WHERE m.status = 'active'
       RETURN u, m.role AS role, m.joinedAt AS joinedAt
       ORDER BY m.joinedAt ASC LIMIT $limit`,
      { communityId, limit }
    )
    return result.records.map((r) => ({
      user: toPlain(r.get("u").properties),
      role: r.get("role") as string,
      joinedAt: r.get("joinedAt") as number,
    }))
  })
}

export async function getMembership(
  authId: string,
  communityId: string
): Promise<{ role: string; status: string } | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {authId: $authId})-[m:MEMBER_OF]->(c:Community {id: $communityId})
       RETURN m.role AS role, m.status AS status`,
      { authId, communityId }
    )
    if (!result.records.length) return null
    return { role: result.records[0].get("role"), status: result.records[0].get("status") }
  })
}
