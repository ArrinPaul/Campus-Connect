import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { removePushSubscription } from "@/server/push/web-push"

// POST or DELETE /api/push/unsubscribe — Deactivate push subscription
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const endpoint = body.endpoint

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint parameter is required" }, { status: 400 })
    }

    const result = await removePushSubscription({
      userId: user.id,
      endpoint,
    })

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}

export async function DELETE(req: Request) {
  return POST(req)
}