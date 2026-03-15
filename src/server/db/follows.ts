import "server-only"
import { runRead, runWrite, toPlain } from "./client"
import type { DbUser } from "./users"

export async function followUser(
  followerClerkId: string,
  targetUserId: string
): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (follower:User {clerkId: $followerClerkId})
       MATCH (target:User) WHERE target.id = $targetUserId OR target.clerkId = $targetUserId
       MERGE (follower)-[f:FOLLOWS]->(target)
       ON CREATE SET f.createdAt = $now,
         follower.followingCount = coalesce(follower.followingCount, 0) + 1,
         target.followerCount = coalesce(target.followerCount, 0) + 1`,
      { followerClerkId, targetUserId, now: Date.now() }
    )
  })
}

export async function unfollowUser(
  followerClerkId: string,
  targetUserId: string
): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (follower:User {clerkId: $followerClerkId})-[f:FOLLOWS]->(target:User)
       WHERE target.id = $targetUserId OR target.clerkId = $targetUserId
       DELETE f
       SET follower.followingCount = CASE WHEN follower.followingCount > 0 THEN follower.followingCount - 1 ELSE 0 END,
           target.followerCount = CASE WHEN target.followerCount > 0 THEN target.followerCount - 1 ELSE 0 END`,
      { followerClerkId, targetUserId }
    )
  })
}

export async function isFollowing(
  followerClerkId: string,
  targetUserId: string
): Promise<boolean> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (follower:User {clerkId: $followerClerkId})-[:FOLLOWS]->(target:User)
       WHERE target.id = $targetUserId OR target.clerkId = $targetUserId
       RETURN count(target) AS n`,
      { followerClerkId, targetUserId }
    )
    return ((result.records[0]?.get("n") as { low: number })?.low ?? 0) > 0
  })
}

export async function getFollowers(
  userId: string,
  limit = 50
): Promise<DbUser[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (follower:User)-[:FOLLOWS]->(u:User)
       WHERE u.id = $userId OR u.clerkId = $userId
       RETURN follower
       ORDER BY follower.name
       LIMIT $limit`,
      { userId, limit }
    )
    return result.records.map((r) => toPlain(r.get("follower").properties) as unknown as DbUser)
  })
}

export async function getFollowing(
  userId: string,
  limit = 50
): Promise<DbUser[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User)-[:FOLLOWS]->(following:User)
       WHERE u.id = $userId OR u.clerkId = $userId
       RETURN following
       ORDER BY following.name
       LIMIT $limit`,
      { userId, limit }
    )
    return result.records.map((r) => toPlain(r.get("following").properties) as unknown as DbUser)
  })
}
