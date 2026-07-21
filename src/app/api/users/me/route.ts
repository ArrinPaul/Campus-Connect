import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getUserById, updateUser, deleteUserAccount } from "@/server/db/users"

// GET /api/users/me
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const dbUser = await getUserById(userId)
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    return NextResponse.json({ ...dbUser, _id: dbUser.id })
  } catch (err) {
    return internalError(err)
  }
}

// PATCH /api/users/me
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}));

    // Whitelist allowed fields — never allow is_admin, follower_count, post_count, etc.
    const allowedFields = [
      "name",
      "username",
      "bio",
      "university",
      "role",
      "experience_level",
      "profile_picture",
      "social_links",
      "skills",
    ] as const

    const safeUpdate: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) {
        safeUpdate[key] = body[key]
      }
    }

    if (Object.keys(safeUpdate).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const dbUser = await updateUser(userId, safeUpdate)
    if (!dbUser) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }
    return NextResponse.json(dbUser)
  } catch (err) {
    return internalError(err)
  }
}

// DELETE /api/users/me — soft-delete account (30-day grace period)
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    if (!body.confirm) {
      return NextResponse.json(
        { error: "Please confirm account deletion by sending { confirm: true }" },
        { status: 400 }
      )
    }

    await deleteUserAccount(userId)
    return NextResponse.json({
      success: true,
      message: "Account scheduled for deletion. You have 30 days to reactivate by signing in.",
    })
  } catch (err) {
    return internalError(err)
  }
}
