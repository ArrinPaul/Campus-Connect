import { NextResponse } from "next/server"

export function authorizeCron(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 })
  }

  const authHeader = req.headers.get("authorization")
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  const cronHeader = req.headers.get("x-cron-secret")
  const token = bearer ?? cronHeader

  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return null
}
