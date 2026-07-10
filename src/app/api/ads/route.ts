import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/ads?limit=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "3")
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/ads  body: ad data
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("ads")
      .insert({ ...body, created_by: userId })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
