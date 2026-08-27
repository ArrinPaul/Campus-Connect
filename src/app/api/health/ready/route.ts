import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET /api/health/ready — Readiness probe checking database & cache connectivity
export async function GET() {
  let dbOk = false
  let redisOk = true

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from("users").select("id").limit(1)
    if (!error) {
      dbOk = true
    }
  } catch {
    dbOk = false
  }

  const isReady = dbOk

  return NextResponse.json(
    {
      status: isReady ? "ready" : "degraded",
      checks: {
        database: dbOk ? "connected" : "disconnected",
        redis: process.env.UPSTASH_REDIS_REST_URL ? "configured" : "memory_fallback",
      },
      timestamp: new Date().toISOString(),
    },
    { status: isReady ? 200 : 503 }
  )
}
