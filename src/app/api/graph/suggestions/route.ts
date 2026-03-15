import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getSuggestions } from "@/server/graph/graph-service"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limitRaw = Number(searchParams.get("limit") ?? "5")
  const limit = Number.isFinite(limitRaw) ? limitRaw : 5

  try {
    const suggestions = await getSuggestions(userId, limit)
    return NextResponse.json({ suggestions })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch suggestions"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
