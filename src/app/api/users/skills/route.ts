import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { addSkill, removeSkill } from "@/server/db/users"

// POST /api/users/skills  body: { skill: string }
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { skill } = await req.json()
    if (!skill) return NextResponse.json({ error: "skill required" }, { status: 400 })

    const skills = await addSkill(userId, skill)
    return NextResponse.json({ skills })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// DELETE /api/users/skills  body: { skill: string }
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { skill } = await req.json()
    if (!skill) return NextResponse.json({ error: "skill required" }, { status: 400 })

    const skills = await removeSkill(userId, skill)
    return NextResponse.json({ skills })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
