import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function sanitizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function sanitizePassword(value: unknown): string {
  return typeof value === "string" ? value : ""
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = sanitizeEmail(body?.email)
    const password = sanitizePassword(body?.password)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const user = data.user
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sign in"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
