import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function sanitizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function sanitizeName(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function sanitizePassword(value: unknown): string {
  return typeof value === "string" ? value : ""
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = sanitizeEmail(body?.email)
    const name = sanitizeName(body?.name)
    const password = sanitizePassword(body?.password)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || "User" },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const user = data.user
    return NextResponse.json({
      ok: true,
      user: user ? {
        id: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.name ?? name ?? "User",
      } : null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sign up"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
