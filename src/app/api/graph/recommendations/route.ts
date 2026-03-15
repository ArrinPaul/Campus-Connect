import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getPostRecommendations } from "@/server/graph/graph-service"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limitRaw = Number(searchParams.get("limit") ?? "10")
  const limit = Number.isFinite(limitRaw) ? limitRaw : 10

  try {
    const recommendations = await getPostRecommendations(userId, limit)
    return NextResponse.json({ recommendations })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch recommendations"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
