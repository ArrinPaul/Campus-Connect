import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getUserById, searchUsers } from "@/server/db/users"

// GET /api/users/profile?id=xxx  OR  /api/users/search?query=xxx
export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const query = url.searchParams.get("query")
    const limit = parseInt(url.searchParams.get("limit") ?? "10")

    if (query) {
      const users = await searchUsers(query, limit, clerkId ?? undefined)
      return NextResponse.json(users)
    }

    if (!id) return NextResponse.json({ error: "id or query required" }, { status: 400 })

    const user = await getUserById(id)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
