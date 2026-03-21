import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { dismissSuggestion } from "@/server/graph/graph-service"

export const runtime = "nodejs"

interface DismissBody {
  targetauthId?: string
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as DismissBody
  if (!body.targetauthId) {
    return NextResponse.json({ error: "targetauthId is required" }, { status: 400 })
  }

  try {
    await dismissSuggestion(userId, body.targetauthId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to dismiss suggestion"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

