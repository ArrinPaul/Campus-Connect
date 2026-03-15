import "server-only"

import type { Integer } from "neo4j-driver"
import { delKey, getJson, setJson } from "./redis-cache"
import { runRead, runWrite } from "./neo4j"
import type { GraphPostRecommendation, GraphSuggestion, GraphUser } from "./types"

const SUGGESTIONS_TTL_SECONDS = 5 * 60
const RECOMMENDATIONS_TTL_SECONDS = 2 * 60

function toNumber(value: number | Integer | null | undefined): number {
  if (value == null) return 0
  if (typeof value === "number") return value
  return value.toNumber()
}

function parseCandidateUser(candidate: Record<string, unknown>): GraphUser {
  return {
    clerkId: String(candidate.clerkId),
    convexUserId: (candidate.convexUserId as string | undefined) ?? null,
    name: (candidate.name as string | undefined) ?? null,
    username: (candidate.username as string | undefined) ?? null,
    profilePicture: (candidate.profilePicture as string | undefined) ?? null,
    university: (candidate.university as string | undefined) ?? null,
    role: (candidate.role as string | undefined) ?? null,
    skills: Array.isArray(candidate.skills)
      ? (candidate.skills as string[])
      : [],
  }
}

function buildSuggestionReasons(params: {
  mutualCount: number
  sharedSkillCount: number
  sameUniversity: boolean
  sameRole: boolean
}): string[] {
  const reasons: string[] = []

  if (params.mutualCount > 0) {
    reasons.push(
      `${params.mutualCount} mutual connection${params.mutualCount === 1 ? "" : "s"}`
    )
  }

  if (params.sharedSkillCount > 0) {
    reasons.push(
      `${params.sharedSkillCount} shared skill${params.sharedSkillCount === 1 ? "" : "s"}`
    )
  }

  if (params.sameUniversity) reasons.push("Same university")
  if (params.sameRole) reasons.push("Same role")

  if (reasons.length === 0) reasons.push("Suggested for you")
  return reasons
}

function suggestionsCacheKey(viewerClerkId: string, limit: number): string {
  return `graph:suggestions:${viewerClerkId}:${limit}`
}

function recommendationsCacheKey(viewerClerkId: string, limit: number): string {
  return `graph:recommendations:${viewerClerkId}:${limit}`
}

export async function getSuggestions(viewerClerkId: string, limit = 5): Promise<GraphSuggestion[]> {
  const safeLimit = Math.min(Math.max(1, limit), 20)
  const cacheKey = suggestionsCacheKey(viewerClerkId, safeLimit)

  const cached = await getJson<GraphSuggestion[]>(cacheKey)
  if (cached) return cached

  const suggestions = await runRead(async (session) => {
    const result = await session.run(
      `
      MATCH (me:User {clerkId: $viewerClerkId})
      MATCH (candidate:User)
      WHERE candidate.clerkId <> me.clerkId
        AND NOT (me)-[:FOLLOWS]->(candidate)
        AND NOT (me)-[:DISMISSED_SUGGESTION]->(candidate)
      OPTIONAL MATCH (me)-[:FOLLOWS]->(:User)-[:FOLLOWS]->(candidate)
      WITH me, candidate, count(*) AS mutualCount
      WITH
        candidate,
        mutualCount,
        size([skill IN coalesce(me.skills, []) WHERE skill IN coalesce(candidate.skills, [])]) AS sharedSkillCount,
        CASE
          WHEN me.university IS NOT NULL
            AND candidate.university IS NOT NULL
            AND toLower(me.university) = toLower(candidate.university)
          THEN true
          ELSE false
        END AS sameUniversity,
        CASE
          WHEN me.role IS NOT NULL AND candidate.role IS NOT NULL AND me.role = candidate.role
          THEN true
          ELSE false
        END AS sameRole
      WITH
        candidate,
        mutualCount,
        sharedSkillCount,
        sameUniversity,
        sameRole,
        (mutualCount * 0.45) + (sharedSkillCount * 0.3) + (CASE WHEN sameUniversity THEN 0.15 ELSE 0 END) + (CASE WHEN sameRole THEN 0.1 ELSE 0 END) AS score
      ORDER BY score DESC, candidate.name ASC
      LIMIT $limit
      RETURN
        candidate {
          .clerkId,
          .convexUserId,
          .name,
          .username,
          .profilePicture,
          .university,
          .role,
          .skills
        } AS candidate,
        score,
        mutualCount,
        sharedSkillCount,
        sameUniversity,
        sameRole
      `,
      { viewerClerkId, limit: safeLimit }
    )

    return result.records.map((record) => {
      const candidate = record.get("candidate") as Record<string, unknown>
      const score = toNumber(record.get("score") as Integer | number)
      const mutualCount = toNumber(record.get("mutualCount") as Integer | number)
      const sharedSkillCount = toNumber(record.get("sharedSkillCount") as Integer | number)
      const sameUniversity = Boolean(record.get("sameUniversity"))
      const sameRole = Boolean(record.get("sameRole"))

      const user = parseCandidateUser(candidate)
      const suggestionId = `${viewerClerkId}:${user.clerkId}`

      return {
        _id: suggestionId,
        score,
        reasons: buildSuggestionReasons({
          mutualCount,
          sharedSkillCount,
          sameUniversity,
          sameRole,
        }),
        user,
      } satisfies GraphSuggestion
    })
  })

  await setJson(cacheKey, suggestions, SUGGESTIONS_TTL_SECONDS)
  return suggestions
}

export async function dismissSuggestion(viewerClerkId: string, targetClerkId: string): Promise<void> {
  await runWrite(async (session) => {
    await session.run(
      `
      MATCH (me:User {clerkId: $viewerClerkId})
      MATCH (target:User {clerkId: $targetClerkId})
      MERGE (me)-[:DISMISSED_SUGGESTION]->(target)
      `,
      { viewerClerkId, targetClerkId }
    )
    return undefined
  })

  await clearSuggestionCache(viewerClerkId)
}

export async function followUser(viewerClerkId: string, targetClerkId: string): Promise<void> {
  await runWrite(async (session) => {
    await session.run(
      `
      MATCH (me:User {clerkId: $viewerClerkId})
      MATCH (target:User {clerkId: $targetClerkId})
      MERGE (me)-[:FOLLOWS {createdAt: timestamp()}]->(target)
      `,
      { viewerClerkId, targetClerkId }
    )
    return undefined
  })

  await clearSuggestionCache(viewerClerkId)
}

export async function unfollowUser(viewerClerkId: string, targetClerkId: string): Promise<void> {
  await runWrite(async (session) => {
    await session.run(
      `
      MATCH (me:User {clerkId: $viewerClerkId})-[r:FOLLOWS]->(target:User {clerkId: $targetClerkId})
      DELETE r
      `,
      { viewerClerkId, targetClerkId }
    )
    return undefined
  })

  await clearSuggestionCache(viewerClerkId)
}

export async function clearSuggestionCache(viewerClerkId: string): Promise<void> {
  for (let i = 1; i <= 20; i += 1) {
    await delKey(suggestionsCacheKey(viewerClerkId, i))
  }
}

export async function getPostRecommendations(
  viewerClerkId: string,
  limit = 10
): Promise<GraphPostRecommendation[]> {
  const safeLimit = Math.min(Math.max(1, limit), 50)
  const cacheKey = recommendationsCacheKey(viewerClerkId, safeLimit)

  const cached = await getJson<GraphPostRecommendation[]>(cacheKey)
  if (cached) return cached

  const recommendations = await runRead(async (session) => {
    const result = await session.run(
      `
      MATCH (me:User {clerkId: $viewerClerkId})
      MATCH (post:Post)<-[:AUTHORED]-(author:User)
      WHERE author.clerkId <> me.clerkId
        AND NOT (me)-[:INTERACTED_WITH]->(post)
      OPTIONAL MATCH (me)-[:INTERACTED_WITH]->(:Post)<-[:INTERACTED_WITH]-(peer:User)-[:INTERACTED_WITH]->(post)
      WITH me, post, author, count(DISTINCT peer) AS collaborativeScore
      WITH
        post,
        author,
        collaborativeScore,
        size([skill IN coalesce(me.skills, []) WHERE skill IN coalesce(post.hashtags, [])]) AS topicScore
      WITH
        post,
        author,
        ((collaborativeScore * 0.7) + (topicScore * 0.3) + (coalesce(post.engagementScore, 0) * 0.15)) AS score
      ORDER BY score DESC, post.createdAt DESC
      LIMIT $limit
      RETURN
        post {
          .postId,
          .createdAt,
          .content
        } AS post,
        author {
          .clerkId,
          .convexUserId,
          .name,
          .username,
          .profilePicture,
          .university,
          .role,
          .skills
        } AS author,
        score
      `,
      { viewerClerkId, limit: safeLimit }
    )

    return result.records.map((record) => {
      const post = record.get("post") as Record<string, unknown>
      const author = record.get("author") as Record<string, unknown>
      const score = toNumber(record.get("score") as Integer | number)
      const postId = String(post.postId)

      return {
        _id: postId,
        score,
        postId,
        author: parseCandidateUser(author),
        createdAt: (post.createdAt as number | undefined) ?? null,
        content: (post.content as string | undefined) ?? null,
      } satisfies GraphPostRecommendation
    })
  })

  await setJson(cacheKey, recommendations, RECOMMENDATIONS_TTL_SECONDS)
  return recommendations
}

interface UpsertGraphUserInput {
  clerkId: string
  convexUserId?: string | null
  name?: string | null
  username?: string | null
  profilePicture?: string | null
  university?: string | null
  role?: string | null
  skills?: string[]
}

interface UpsertGraphPostInput {
  postId: string
  authorClerkId: string
  createdAt?: number
  content?: string | null
  hashtags?: string[]
  engagementScore?: number
}

export async function upsertGraphUser(input: UpsertGraphUserInput): Promise<void> {
  await runWrite(async (session) => {
    await session.run(
      `
      MERGE (u:User {clerkId: $clerkId})
      SET
        u.convexUserId = $convexUserId,
        u.name = $name,
        u.username = $username,
        u.profilePicture = $profilePicture,
        u.university = $university,
        u.role = $role,
        u.skills = $skills,
        u.updatedAt = timestamp()
      `,
      {
        clerkId: input.clerkId,
        convexUserId: input.convexUserId ?? null,
        name: input.name ?? null,
        username: input.username ?? null,
        profilePicture: input.profilePicture ?? null,
        university: input.university ?? null,
        role: input.role ?? null,
        skills: input.skills ?? [],
      }
    )
    return undefined
  })
}

export async function syncFollowRelation(
  followerClerkId: string,
  followingClerkId: string,
  action: "follow" | "unfollow"
): Promise<void> {
  await runWrite(async (session) => {
    await session.run(
      `
      MERGE (follower:User {clerkId: $followerClerkId})
      MERGE (following:User {clerkId: $followingClerkId})
      `,
      { followerClerkId, followingClerkId }
    )

    if (action === "unfollow") {
      await session.run(
        `
        MATCH (follower:User {clerkId: $followerClerkId})-[r:FOLLOWS]->(following:User {clerkId: $followingClerkId})
        DELETE r
        `,
        { followerClerkId, followingClerkId }
      )
    } else {
      await session.run(
        `
        MATCH (follower:User {clerkId: $followerClerkId})
        MATCH (following:User {clerkId: $followingClerkId})
        MERGE (follower)-[:FOLLOWS {createdAt: timestamp()}]->(following)
        `,
        { followerClerkId, followingClerkId }
      )
    }
    return undefined
  })

  await clearSuggestionCache(followerClerkId)
}

export async function upsertGraphPost(input: UpsertGraphPostInput): Promise<void> {
  await runWrite(async (session) => {
    await session.run(
      `
      MERGE (author:User {clerkId: $authorClerkId})
      MERGE (post:Post {postId: $postId})
      SET
        post.createdAt = $createdAt,
        post.content = $content,
        post.hashtags = $hashtags,
        post.engagementScore = $engagementScore,
        post.updatedAt = timestamp()
      MERGE (author)-[:AUTHORED]->(post)
      `,
      {
        postId: input.postId,
        authorClerkId: input.authorClerkId,
        createdAt: input.createdAt ?? Date.now(),
        content: input.content ?? null,
        hashtags: input.hashtags ?? [],
        engagementScore: input.engagementScore ?? 0,
      }
    )
    return undefined
  })
}

export async function recordGraphInteraction(params: {
  viewerClerkId: string
  postId: string
  interactionType: "view" | "like" | "comment" | "share"
  weight?: number
}): Promise<void> {
  await runWrite(async (session) => {
    await session.run(
      `
      MERGE (viewer:User {clerkId: $viewerClerkId})
      MERGE (post:Post {postId: $postId})
      MERGE (viewer)-[r:INTERACTED_WITH]->(post)
      SET
        r.type = $interactionType,
        r.weight = $weight,
        r.updatedAt = timestamp()
      `,
      {
        viewerClerkId: params.viewerClerkId,
        postId: params.postId,
        interactionType: params.interactionType,
        weight: params.weight ?? 1,
      }
    )
    return undefined
  })
}
