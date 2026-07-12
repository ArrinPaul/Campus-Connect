import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { searchUsers } from "@/server/db/users"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    const url = new URL(req.url)
    const query = url.searchParams.get("query") ?? ""
    const limit = parseInt(url.searchParams.get("limit") ?? "10")
    const users = await searchUsers(query, limit, authId ?? undefined)
    return NextResponse.json(users)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

