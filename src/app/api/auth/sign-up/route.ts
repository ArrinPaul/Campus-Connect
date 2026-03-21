import { NextResponse } from "next/server"
import { createSessionToken, getSessionCookieName, getSessionTtlSeconds } from "@/lib/auth/session"
import { hashPassword } from "@/lib/auth/password"
import { getAuthUserByEmail, upsertPasswordUser } from "@/server/db/users"

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

    const existing = await getAuthUserByEmail(email)
    if (existing?.passwordHash) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await upsertPasswordUser({ email, name: name || "User", passwordHash })

    const token = createSessionToken(user.authId)
    const response = NextResponse.json({ ok: true, user: { id: user.authId, email: user.email, name: user.name } })

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionTtlSeconds(),
    })

    response.cookies.set("cc_user_id", user.authId, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionTtlSeconds(),
    })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sign up"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
