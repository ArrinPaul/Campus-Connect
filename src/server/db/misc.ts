import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

// ─── Marketplace ──────────────────────────────────────────────────────────────

export interface DbListing {
  id: string
  title: string
  description?: string
  price: number
  condition?: string
  category?: string
  images?: string[]
  sellerId: string
  isSold: boolean
  createdAt: number
  seller?: Record<string, unknown>
}

export async function createListing(
  clerkId: string,
  data: Omit<DbListing, "id" | "sellerId" | "isSold" | "createdAt" | "seller">
): Promise<DbListing> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       CREATE (l:MarketplaceListing {
         id: $id, title: $title, description: $description,
         price: $price, condition: $condition, category: $category,
         images: $images, sellerId: u.id, isSold: false, createdAt: $now
       })
       CREATE (u)-[:LISTED]->(l)
       RETURN l, u`,
      { clerkId, id, ...data, description: data.description ?? "", condition: data.condition ?? "Good", category: data.category ?? "", images: data.images ?? [], now }
    )
    return { ...toPlain(result.records[0].get("l").properties), seller: toPlain(result.records[0].get("u").properties) } as unknown as DbListing
  })
}

export async function getListings(filter?: { category?: string; search?: string }, limit = 20): Promise<DbListing[]> {
  return runRead(async (session) => {
    const whereClause = filter?.search
      ? "WHERE l.isSold = false AND (toLower(l.title) CONTAINS toLower($search) OR toLower(l.description) CONTAINS toLower($search))"
      : "WHERE l.isSold = false"
    const result = await session.run(
      `MATCH (l:MarketplaceListing)<-[:LISTED]-(u:User) ${whereClause}
       RETURN l, u ORDER BY l.createdAt DESC LIMIT $limit`,
      { search: filter?.search ?? "", limit }
    )
    return result.records.map((r) => ({ ...toPlain(r.get("l").properties), seller: toPlain(r.get("u").properties) }) as unknown as DbListing)
  })
}

export async function getListingById(id: string): Promise<DbListing | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (l:MarketplaceListing {id: $id})<-[:LISTED]-(u:User) RETURN l, u`,
      { id }
    )
    if (!result.records.length) return null
    return { ...toPlain(result.records[0].get("l").properties), seller: toPlain(result.records[0].get("u").properties) } as unknown as DbListing
  })
}

export async function updateListing(id: string, clerkId: string, data: Partial<Omit<DbListing, "id" | "sellerId" | "createdAt">>): Promise<DbListing> {
  return runWrite(async (session) => {
    const sets = Object.entries(data).filter(([, v]) => v !== undefined).map(([k]) => `l.${k} = $${k}`).join(", ")
    const params: Record<string, unknown> = { id, clerkId, now: Date.now(), ...data }
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:LISTED]->(l:MarketplaceListing {id: $id})
       SET ${sets}, l.updatedAt = $now
       RETURN l, u`,
      params
    )
    if (!result.records.length) throw new Error("Listing not found or unauthorized")
    return { ...toPlain(result.records[0].get("l").properties), seller: toPlain(result.records[0].get("u").properties) } as unknown as DbListing
  })
}

export async function deleteListing(id: string, clerkId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:LISTED]->(l:MarketplaceListing {id: $id}) DETACH DELETE l`,
      { id, clerkId }
    )
  })
}

export async function markAsSold(id: string, clerkId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:LISTED]->(l:MarketplaceListing {id: $id})
       SET l.isSold = true`,
      { id, clerkId }
    )
  })
}

// ─── Polls ────────────────────────────────────────────────────────────────────

export interface DbPoll {
  id: string
  question: string
  options: { id: string; text: string; voteCount: number }[]
  totalVotes: number
  expiresAt?: number
  createdAt: number
}

export async function createPoll(
  clerkId: string,
  data: { question: string; options: string[]; expiresAt?: number }
): Promise<DbPoll> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const options = data.options.map((text) => ({ id: randomUUID(), text, voteCount: 0 }))
    const result = await session.run(
      `CREATE (p:Poll { id: $id, question: $question, options: $options, totalVotes: 0, expiresAt: $expiresAt, createdAt: $now }) RETURN p`,
      { id, question: data.question, options: JSON.stringify(options), expiresAt: data.expiresAt ?? null, now }
    )
    return { ...toPlain(result.records[0].get("p").properties), options } as unknown as DbPoll
  })
}

export async function votePoll(clerkId: string, pollId: string, optionId: string): Promise<DbPoll> {
  return runWrite(async (session) => {
    const result = await session.run(
      `MATCH (p:Poll {id: $pollId})
       MATCH (u:User {clerkId: $clerkId})
       MERGE (u)-[v:VOTED_ON]->(p)
       ON CREATE SET v.optionId = $optionId, v.createdAt = $now,
         p.totalVotes = coalesce(p.totalVotes, 0) + 1
       RETURN p`,
      { clerkId, pollId, optionId, now: Date.now() }
    )
    return toPlain(result.records[0].get("p").properties) as unknown as DbPoll
  })
}

// ─── Reposts ──────────────────────────────────────────────────────────────────

export async function repost(clerkId: string, postId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId}), (p:Post {id: $postId})
       MERGE (u)-[r:REPOSTED]->(p)
       ON CREATE SET r.createdAt = $now, p.shareCount = coalesce(p.shareCount, 0) + 1`,
      { clerkId, postId, now: Date.now() }
    )
  })
}

export async function undoRepost(clerkId: string, postId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[r:REPOSTED]->(p:Post {id: $postId})
       DELETE r
       SET p.shareCount = CASE WHEN p.shareCount > 0 THEN p.shareCount - 1 ELSE 0 END`,
      { clerkId, postId }
    )
  })
}

export async function isReposted(clerkId: string, postId: string): Promise<boolean> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:REPOSTED]->(p:Post {id: $postId}) RETURN count(*) AS n`,
      { clerkId, postId }
    )
    return ((result.records[0]?.get("n") as { low: number })?.low ?? 0) > 0
  })
}

// ─── Presence ─────────────────────────────────────────────────────────────────

export async function updatePresence(clerkId: string, status: string, statusText?: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       SET u.onlineStatus = $status, u.statusText = $statusText, u.lastSeenAt = $now`,
      { clerkId, status, statusText: statusText ?? null, now: Date.now() }
    )
  })
}

export async function getUserStatuses(userIds: string[]): Promise<Record<string, string>> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User) WHERE u.id IN $userIds OR u.clerkId IN $userIds
       RETURN u.id AS id, coalesce(u.onlineStatus, 'offline') AS status`,
      { userIds }
    )
    const statuses: Record<string, string> = {}
    for (const r of result.records) {
      statuses[r.get("id") as string] = r.get("status") as string
    }
    return statuses
  })
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface DbProject {
  id: string
  title: string
  description?: string
  url?: string
  imageUrl?: string
  tags?: string[]
  startDate?: number
  endDate?: number
  createdAt: number
}

export interface DbPortfolio {
  userId: string
  projects: DbProject[]
  certifications: { id: string; name: string; issuer: string; date?: number; url?: string }[]
  updatedAt: number
}

export async function getPortfolio(userId: string): Promise<DbPortfolio | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User) WHERE u.id = $userId OR u.clerkId = $userId
       OPTIONAL MATCH (u)-[:HAS_PROJECT]->(proj:Project)
       OPTIONAL MATCH (u)-[:HAS_CERT]->(cert:Certification)
       RETURN u, collect(DISTINCT proj) AS projects, collect(DISTINCT cert) AS certs`,
      { userId }
    )
    if (!result.records.length) return null
    const user = toPlain(result.records[0].get("u").properties)
    const projects = (result.records[0].get("projects") as unknown[]).map((p) =>
      toPlain((p as { properties: Record<string, unknown> }).properties)
    ) as unknown as DbProject[]
    const certifications = (result.records[0].get("certs") as unknown[]).map((c) =>
      toPlain((c as { properties: Record<string, unknown> }).properties)
    ) as unknown as DbPortfolio["certifications"]
    return { userId: user.id as string, projects, certifications, updatedAt: Date.now() }
  })
}

export async function addProject(
  clerkId: string,
  data: Omit<DbProject, "id" | "createdAt">
): Promise<DbProject> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       CREATE (p:Project { id: $id, title: $title, description: $description, url: $url, imageUrl: $imageUrl, tags: $tags, startDate: $startDate, endDate: $endDate, createdAt: $now })
       CREATE (u)-[:HAS_PROJECT]->(p)
       RETURN p`,
      { clerkId, id, ...data, description: data.description ?? "", url: data.url ?? null, imageUrl: data.imageUrl ?? null, tags: data.tags ?? [], startDate: data.startDate ?? null, endDate: data.endDate ?? null, now }
    )
    return toPlain(result.records[0].get("p").properties) as unknown as DbProject
  })
}

// ─── Skill Endorsements ───────────────────────────────────────────────────────

export interface DbEndorsement {
  id: string
  skill: string
  endorseeId: string
  endorserId: string
  createdAt: number
  endorser?: Record<string, unknown>
}

export async function endorseSkill(clerkId: string, targetUserId: string, skill: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (endorser:User {clerkId: $clerkId})
       MATCH (endorsee:User) WHERE endorsee.id = $targetUserId OR endorsee.clerkId = $targetUserId
       MERGE (endorser)-[e:ENDORSED_SKILL {skill: $skill}]->(endorsee)
       ON CREATE SET e.id = $id, e.createdAt = $now`,
      { clerkId, targetUserId, skill, id: randomUUID(), now: Date.now() }
    )
  })
}

export async function getEndorsements(userId: string): Promise<DbEndorsement[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (endorser:User)-[e:ENDORSED_SKILL]->(endorsee:User)
       WHERE endorsee.id = $userId OR endorsee.clerkId = $userId
       RETURN e, endorser ORDER BY e.createdAt DESC`,
      { userId }
    )
    return result.records.map((r) => ({
      ...toPlain(r.get("e").properties),
      endorser: toPlain(r.get("endorser").properties),
    })) as unknown as DbEndorsement[]
  })
}

// ─── Ads ──────────────────────────────────────────────────────────────────────

export interface DbAd {
  id: string
  title: string
  body?: string
  imageUrl?: string
  ctaUrl?: string
  ctaText?: string
  advertiserId: string
  status: string
  impressionCount: number
  clickCount: number
  budget?: number
  spent?: number
  createdAt: number
  advertiser?: Record<string, unknown>
}

export async function createAd(
  clerkId: string,
  data: Omit<DbAd, "id" | "advertiserId" | "status" | "impressionCount" | "clickCount" | "spent" | "createdAt" | "advertiser">
): Promise<DbAd> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       CREATE (a:Ad {
         id: $id, title: $title, body: $body, imageUrl: $imageUrl,
         ctaUrl: $ctaUrl, ctaText: $ctaText, advertiserId: u.id,
         status: 'active', impressionCount: 0, clickCount: 0,
         budget: $budget, spent: 0, createdAt: $now
       })
       CREATE (u)-[:CREATED_AD]->(a)
       RETURN a, u`,
      { clerkId, id, ...data, body: data.body ?? "", imageUrl: data.imageUrl ?? null, ctaUrl: data.ctaUrl ?? null, ctaText: data.ctaText ?? "Learn More", budget: data.budget ?? 0, now }
    )
    return { ...toPlain(result.records[0].get("a").properties), advertiser: toPlain(result.records[0].get("u").properties) } as unknown as DbAd
  })
}

export async function getActiveAds(limit = 3): Promise<DbAd[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (a:Ad {status: 'active'})<-[:CREATED_AD]-(u:User)
       RETURN a, u ORDER BY rand() LIMIT $limit`,
      { limit }
    )
    return result.records.map((r) => ({ ...toPlain(r.get("a").properties), advertiser: toPlain(r.get("u").properties) }) as unknown as DbAd)
  })
}

export async function trackAdImpression(adId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (a:Ad {id: $adId}) SET a.impressionCount = coalesce(a.impressionCount, 0) + 1`,
      { adId }
    )
  })
}

export async function trackAdClick(adId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (a:Ad {id: $adId}) SET a.clickCount = coalesce(a.clickCount, 0) + 1`,
      { adId }
    )
  })
}

export async function getAdDashboard(clerkId: string): Promise<DbAd[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[:CREATED_AD]->(a:Ad) RETURN a, u ORDER BY a.createdAt DESC`,
      { clerkId }
    )
    return result.records.map((r) => ({ ...toPlain(r.get("a").properties), advertiser: toPlain(r.get("u").properties) }) as unknown as DbAd)
  })
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export interface DbUserStats {
  userId: string
  reputationPoints: number
  level: number
  badges: string[]
  streak: number
  postsCount: number
  answersCount: number
  followersCount: number
}

export async function getUserStats(userId: string): Promise<DbUserStats | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User) WHERE u.id = $userId OR u.clerkId = $userId
       RETURN u`,
      { userId }
    )
    if (!result.records.length) return null
    const u = toPlain(result.records[0].get("u").properties)
    return {
      userId: u.id as string,
      reputationPoints: (u.reputationPoints as number) ?? 0,
      level: (u.level as number) ?? 1,
      badges: (u.badges as string[]) ?? [],
      streak: (u.streak as number) ?? 0,
      postsCount: (u.postsCount as number) ?? 0,
      answersCount: (u.answersCount as number) ?? 0,
      followersCount: (u.followerCount as number) ?? 0,
    }
  })
}

export async function getLeaderboard(limit = 10): Promise<DbUserStats[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User) RETURN u ORDER BY coalesce(u.reputationPoints, 0) DESC LIMIT $limit`,
      { limit }
    )
    return result.records.map((r) => {
      const u = toPlain(r.get("u").properties)
      return { userId: u.id as string, reputationPoints: (u.reputationPoints as number) ?? 0, level: (u.level as number) ?? 1, badges: (u.badges as string[]) ?? [], streak: (u.streak as number) ?? 0, postsCount: 0, answersCount: 0, followersCount: (u.followerCount as number) ?? 0 }
    })
  })
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function universalSearch(query: string, limit = 10): Promise<{
  users: Record<string, unknown>[]
  posts: Record<string, unknown>[]
  communities: Record<string, unknown>[]
  jobs: Record<string, unknown>[]
  events: Record<string, unknown>[]
}> {
  return runRead(async (session) => {
    const [usersResult, postsResult, commResult, jobsResult, eventsResult] = await Promise.all([
      session.run(
        `MATCH (u:User) WHERE toLower(u.name) CONTAINS toLower($q) OR toLower(u.username) CONTAINS toLower($q) RETURN u LIMIT $limit`,
        { q: query, limit }
      ),
      session.run(
        `MATCH (p:Post)<-[:AUTHORED]-(u:User) WHERE toLower(p.content) CONTAINS toLower($q) RETURN p, u LIMIT $limit`,
        { q: query, limit }
      ),
      session.run(
        `MATCH (c:Community) WHERE toLower(c.name) CONTAINS toLower($q) RETURN c LIMIT $limit`,
        { q: query, limit }
      ),
      session.run(
        `MATCH (j:Job)<-[:POSTED_JOB]-(u:User) WHERE toLower(j.title) CONTAINS toLower($q) OR toLower(j.company) CONTAINS toLower($q) RETURN j, u LIMIT $limit`,
        { q: query, limit }
      ),
      session.run(
        `MATCH (e:Event)<-[:ORGANIZED]-(u:User) WHERE toLower(e.title) CONTAINS toLower($q) RETURN e, u LIMIT $limit`,
        { q: query, limit }
      ),
    ])

    return {
      users: usersResult.records.map((r) => toPlain(r.get("u").properties)),
      posts: postsResult.records.map((r) => ({ ...toPlain(r.get("p").properties), author: toPlain(r.get("u").properties) })),
      communities: commResult.records.map((r) => toPlain(r.get("c").properties)),
      jobs: jobsResult.records.map((r) => ({ ...toPlain(r.get("j").properties), poster: toPlain(r.get("u").properties) })),
      events: eventsResult.records.map((r) => ({ ...toPlain(r.get("e").properties), organizer: toPlain(r.get("u").properties) })),
    }
  })
}

// ─── Calls ────────────────────────────────────────────────────────────────────

export async function initiateCall(callerClerkId: string, calleeUserId: string, type: "video" | "audio"): Promise<{ id: string }> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    await session.run(
      `MATCH (caller:User {clerkId: $callerClerkId})
       MATCH (callee:User) WHERE callee.id = $calleeUserId OR callee.clerkId = $calleeUserId
       CREATE (c:Call { id: $id, callerId: caller.id, calleeId: callee.id, type: $type, status: 'ringing', createdAt: $now })`,
      { callerClerkId, calleeUserId, type, id, now }
    )
    return { id }
  })
}

export async function updateCallStatus(callId: string, status: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (c:Call {id: $callId}) SET c.status = $status, c.updatedAt = $now`,
      { callId, status, now: Date.now() }
    )
  })
}

export async function getIncomingCall(clerkId: string): Promise<Record<string, unknown> | null> {
  return runRead(async (session) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const result = await session.run(
      `MATCH (callee:User {clerkId: $clerkId})<-[:CALLED]-(caller:User)
       MATCH (c:Call {calleeId: callee.id, status: 'ringing'})
       WHERE c.createdAt > $since
       RETURN c, caller LIMIT 1`,
      { clerkId, since: fiveMinutesAgo }
    )
    if (!result.records.length) return null
    return { ...toPlain(result.records[0].get("c").properties), caller: toPlain(result.records[0].get("caller").properties) }
  })
}
