import { NextResponse } from "next/server"
import { authorizeCron } from "@/app/api/cron/_lib"

// POST /api/cron/daily-digest
// Placeholder for email digest logic (Resend/SendGrid/etc.)
export async function POST(req: Request) {
  const authError = authorizeCron(req)
  if (authError) return authError

  return NextResponse.json({ success: true, message: "Daily digest cron placeholder" })
}
