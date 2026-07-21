import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
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
    const normalizedUsers = (users || []).map((u: any) => ({ ...u, _id: u._id || u.id }));
    return NextResponse.json(normalizedUsers)
  } catch (err) {
    return internalError(err)
  }
}
