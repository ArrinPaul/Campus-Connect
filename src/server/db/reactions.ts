import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

export const REACTION_TYPES = ["like", "love", "laugh", "wow", "sad", "scholarly"] as const
export type ReactionType = (typeof REACTION_TYPES)[number]

export async function addReaction(
  authId: string,
  targetId: string,
  targetType: "post" | "comment",
  type: ReactionType
): Promise<{ action: "created" | "updated" | "no-change" }> {
  return runWrite(async (session) => {
    const now = Date.now()
    const result = await session.run(
      `MATCH (u:User {authId: $authId})
       MATCH (target) WHERE (target:Post OR target:Comment) AND target.id = $targetId
       MERGE (u)-[r:REACTED_TO {targetType: $targetType}]->(target)
       ON CREATE SET r.id = $id, r.type = $type, r.createdAt = $now
         RETURN 'created' AS action, r, u, target
       ON MATCH SET r.type = CASE WHEN r.type = $type THEN r.type ELSE $type END,
                    r.createdAt = $now
       RETURN CASE WHEN r.type = $prevType THEN 'no-change' ELSE 'updated' END AS action, r, u, target`,
      { authId, targetId, targetType, type, id: randomUUID(), now, prevType: type }
    )

    if (!result.records.length) throw new Error("Target not found")
    return { action: result.records[0].get("action") as "created" | "updated" | "no-change" }
  })
}

export async function removeReaction(
  authId: string,
  targetId: string,
  targetType: "post" | "comment"
): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {authId: $authId})-[r:REACTED_TO {targetType: $targetType}]->(target)
       WHERE target.id = $targetId
       DELETE r`,
      { authId, targetId, targetType }
    )
  })
}

export async function getUserReaction(
  authId: string,
  targetId: string,
  targetType: "post" | "comment"
): Promise<{ type: ReactionType } | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {authId: $authId})-[r:REACTED_TO {targetType: $targetType}]->(target)
       WHERE target.id = $targetId
       RETURN r.type AS type`,
      { authId, targetId, targetType }
    )
    if (!result.records.length) return null
    return { type: result.records[0].get("type") as ReactionType }
  })
}

export async function getReactionCounts(
  targetId: string,
  targetType: "post" | "comment"
): Promise<Record<ReactionType, number>> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (:User)-[r:REACTED_TO {targetType: $targetType}]->(target)
       WHERE target.id = $targetId
       RETURN r.type AS type, count(r) AS cnt`,
      { targetId, targetType }
    )
    const counts: Record<string, number> = {}
    for (const row of result.records) {
      counts[row.get("type")] = (row.get("cnt") as { low: number }).low ?? 0
    }
    return counts as Record<ReactionType, number>
  })
}
