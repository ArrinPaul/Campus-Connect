import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getCommunityBySlug, createCommunity, joinCommunity } from "@/server/db/communities"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { courseCode } = await req.json()
    if (!courseCode || typeof courseCode !== "string") {
      return NextResponse.json({ error: "Course code is required" }, { status: 400 })
    }

    const cleanCode = courseCode.trim().toUpperCase()
    const slug = cleanCode.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    let community = await getCommunityBySlug(slug)

    if (!community) {
      // Create it
      community = await createCommunity({
        name: cleanCode,
        slug,
        description: `Official group for ${cleanCode} students.`,
        category: "Course",
        created_by: userId
      })

      if (!community) {
        return NextResponse.json({ error: "Failed to create course community" }, { status: 500 })
      }
    } else {
      // It exists, so we just join it. Note: createCommunity already joins the creator as admin.
      await joinCommunity(community.id, userId)
    }

    return NextResponse.json({ success: true, community })
  } catch (err) {
    return internalError(err)
  }
}
