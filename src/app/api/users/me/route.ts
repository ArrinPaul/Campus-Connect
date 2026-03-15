import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getUserByClerkId, updateUser, updatePrivacySettings, updateNotificationPreferences, deleteUserAccount, completeOnboarding, updateProfilePicture, addSkill, removeSkill } from "@/server/db/users"

// GET /api/users/me
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await getUserByClerkId(userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Parse stored JSON strings back to objects
    if (typeof user.socialLinks === "string") {
      try { user.socialLinks = JSON.parse(user.socialLinks as unknown as string) } catch { user.socialLinks = {} }
    }
    if (typeof user.privacySettings === "string") {
      try { user.privacySettings = JSON.parse(user.privacySettings as unknown as string) } catch { user.privacySettings = {} }
    }
    if (typeof user.notificationPreferences === "string") {
      try { user.notificationPreferences = JSON.parse(user.notificationPreferences as unknown as string) } catch { user.notificationPreferences = {} }
    }

    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// PATCH /api/users/me
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const user = await updateUser(userId, body)
    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// DELETE /api/users/me
export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await deleteUserAccount(userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
