import { NextResponse } from "next/server"
import {
  recordGraphInteraction,
  syncFollowRelation,
  upsertGraphPost,
  upsertGraphUser,
} from "@/server/graph/graph-service"

export const runtime = "nodejs"

type SyncPayload =
  | {
      type: "user"
      user: {
        clerkId: string
        convexUserId?: string | null
        name?: string | null
        username?: string | null
        profilePicture?: string | null
        university?: string | null
        role?: string | null
        skills?: string[]
      }
    }
  | {
      type: "follow"
      followerClerkId: string
      followingClerkId: string
      action: "follow" | "unfollow"
    }
  | {
      type: "post"
      post: {
        postId: string
        authorClerkId: string
        createdAt?: number
        content?: string | null
        hashtags?: string[]
        engagementScore?: number
      }
    }
  | {
      type: "interaction"
      interaction: {
        viewerClerkId: string
        postId: string
        interactionType: "view" | "like" | "comment" | "share"
        weight?: number
      }
    }

function isAuthorized(request: Request): boolean {
  const expected = process.env.GRAPH_SYNC_TOKEN
  if (!expected) return false

  const authHeader = request.headers.get("authorization")
  if (!authHeader) return false

  return authHeader === `Bearer ${expected}`
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json()) as SyncPayload

  try {
    if (payload.type === "user") {
      await upsertGraphUser(payload.user)
      return NextResponse.json({ ok: true })
    }

    if (payload.type === "follow") {
      await syncFollowRelation(
        payload.followerClerkId,
        payload.followingClerkId,
        payload.action
      )
      return NextResponse.json({ ok: true })
    }

    if (payload.type === "post") {
      await upsertGraphPost(payload.post)
      return NextResponse.json({ ok: true })
    }

    if (payload.type === "interaction") {
      await recordGraphInteraction(payload.interaction)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Invalid sync payload" }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Graph sync failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
