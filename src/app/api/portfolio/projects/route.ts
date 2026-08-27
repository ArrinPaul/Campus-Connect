import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { addProject, getPortfolio, deleteProject } from "@/server/db/misc"

// GET /api/portfolio/projects — Fetch portfolio projects
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    let userId = searchParams.get("userId") || searchParams.get("user_id")

    if (!userId) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    }

    if (!userId) {
      return NextResponse.json({ error: "userId parameter required" }, { status: 400 })
    }

    const portfolio = await getPortfolio(userId)
    return NextResponse.json(portfolio.projects, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/portfolio/projects — Add portfolio project
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    if (!body.title) {
      return NextResponse.json({ error: "Project title is required" }, { status: 400 })
    }

    const project = await addProject(user.id, {
      title: body.title,
      description: body.description,
      url: body.url,
      image_url: body.image_url,
    })

    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    return internalError(err)
  }
}

// DELETE /api/portfolio/projects — Delete portfolio project
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const body = await req.json().catch(() => ({}))
    const projectId = body.id || searchParams.get("id")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    await deleteProject(projectId, user.id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}