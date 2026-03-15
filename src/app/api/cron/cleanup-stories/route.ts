import { NextResponse } from "next/server"
import { runWrite } from "@/server/graph/neo4j"
import { authorizeCron } from "@/app/api/cron/_lib"

// POST /api/cron/cleanup-stories
export async function POST(req: Request) {
  const authError = authorizeCron(req)
  if (authError) return authError

  try {
    const now = Date.now()
    const result = await runWrite(
      `MATCH (s:Story)
       WHERE coalesce(s.expiresAt, 0) > 0 AND s.expiresAt < $now
       WITH s LIMIT 500
       DETACH DELETE s
       RETURN count(*) AS deleted`,
      { now }
    )

    const deleted = Number(result.records[0]?.get("deleted") ?? 0)
    return NextResponse.json({ success: true, deleted })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
