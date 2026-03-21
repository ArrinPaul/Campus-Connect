import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { completeOnboarding } from "@/server/db/users"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const user = await completeOnboarding(userId, body)
    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
