/**
 * Shared Neo4j helper — re-exports connection utilities and provides
 * an auth-id-to-user lookup helper used across all service modules.
 */
import "server-only"
import { auth } from "@/lib/auth/server"
import { runRead, runWrite } from "@/server/graph/neo4j"
import { randomUUID } from "crypto"

export { runRead, runWrite, randomUUID }

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function getAuthId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  return userId
}

export async function getDbUser(
  authId: string
): Promise<{ id: string; authId: string; name: string; email: string; username?: string; profilePicture?: string; [key: string]: unknown } | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {authId: $authId}) RETURN u`,
      { authId }
    )
    if (result.records.length === 0) return null
    return result.records[0].get("u").properties
  })
}

export async function requireDbUser(authId: string) {
  const user = await getDbUser(authId)
  if (!user) throw new Error("User not found")
  return user
}

/** Convert Neo4j Integer objects to JS numbers in a record */
export function toPlain(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(record)) {
    if (v !== null && typeof v === "object" && "low" in (v as object)) {
      // Neo4j Integer
      out[k] = (v as { low: number; high: number }).low
    } else if (v !== null && typeof v === "object" && "toNumber" in (v as object)) {
      out[k] = (v as { toNumber: () => number }).toNumber()
    } else {
      out[k] = v
    }
  }
  return out
}

export function nodeProps(result: { records: { get: (k: string) => { properties: Record<string, unknown> } }[] }, key: string) {
  return result.records.map((r) => toPlain(r.get(key).properties))
}
