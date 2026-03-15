import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { followUser, unfollowUser } from "@/server/graph/graph-service"

export const runtime = "nodejs"

interface FollowBody {
  targetClerkId?: string
  action?: "follow" | "unfollow"
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as FollowBody
  if (!body.targetClerkId) {
    return NextResponse.json({ error: "targetClerkId is required" }, { status: 400 })
  }

  const action = body.action ?? "follow"

  try {
    if (action === "unfollow") {
      await unfollowUser(userId, body.targetClerkId)
    } else {
      await followUser(userId, body.targetClerkId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update follow relation"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
