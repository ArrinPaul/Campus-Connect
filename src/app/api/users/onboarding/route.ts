import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { completeOnboarding } from "@/server/db/users"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}));
    const payload = {
      username: typeof body?.username === "string" ? body.username : "",
      bio: typeof body?.bio === "string" ? body.bio : "",
      university: typeof body?.university === "string" ? body.university : "",
      role: typeof body?.role === "string" ? body.role : "Student",
      // No onboarding step actually collects this yet (OnboardingData has
      // no experience-level field) — completeOnboarding reads
      // experience_level (snake_case), so this was silently never forwarded
      // even on the day a step is added, if it sent the same camelCase name
      // every other frontend form in this app uses.
      experience_level: typeof body?.experienceLevel === "string" ? body.experienceLevel : "Beginner",
      skills: Array.isArray(body?.skills)
        ? body.skills.filter((skill: any): skill is string => typeof skill === "string")
        : [],
    }

    const dbUser = await completeOnboarding(userId, payload)
    return NextResponse.json(dbUser)
  } catch (err) {
    return internalError(err)
  }
}
