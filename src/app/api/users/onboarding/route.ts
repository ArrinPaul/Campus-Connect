import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { completeOnboarding } from "@/server/db/users"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const payload = {
      username: typeof body?.username === "string" ? body.username : "",
      bio: typeof body?.bio === "string" ? body.bio : "",
      university: typeof body?.university === "string" ? body.university : "",
      role: typeof body?.role === "string" ? body.role : "Student",
      experienceLevel: typeof body?.experienceLevel === "string" ? body.experienceLevel : "Beginner",
      skills: Array.isArray(body?.skills)
        ? body.skills.filter((skill): skill is string => typeof skill === "string")
        : [],
    }

    const user = await completeOnboarding(userId, payload)
    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
