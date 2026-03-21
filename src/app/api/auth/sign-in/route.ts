import { NextResponse } from "next/server"
import { createSessionToken, getSessionCookieName, getSessionTtlSeconds } from "@/lib/auth/session"
import { verifyPassword } from "@/lib/auth/password"
import { getAuthUserByEmail } from "@/server/db/users"

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

    const user = await getAuthUserByEmail(email)
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

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
    const message = error instanceof Error ? error.message : "Failed to sign in"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
