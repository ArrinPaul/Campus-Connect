import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { clearSuggestionCache, getSuggestions } from "@/server/graph/graph-service"

export const runtime = "nodejs"

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await clearSuggestionCache(userId)
    const suggestions = await getSuggestions(userId, 5)
    return NextResponse.json({ suggestions })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh suggestions"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
