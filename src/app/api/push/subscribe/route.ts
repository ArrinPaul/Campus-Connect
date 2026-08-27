import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { savePushSubscription, removePushSubscription } from "@/server/push/web-push"

// POST /api/push/subscribe — Register or update browser push subscription
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    
    // Normalize payload format (both flat and nested keys structure)
    const endpoint = body.endpoint
    const p256dh = body.p256dh || body.keys?.p256dh
    const auth = body.auth || body.keys?.auth
    const userAgent = req.headers.get("user-agent") || undefined

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Invalid subscription payload: endpoint, p256dh, and auth are required" },
        { status: 400 }
      )
    }

    const result = await savePushSubscription({
      userId: user.id,
      endpoint,
      p256dh,
      auth,
      userAgent,
    })

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}

// DELETE /api/push/subscribe — Deactivate browser push subscription
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { searchParams } = new URL(req.url)
    const endpoint = body.endpoint || searchParams.get("endpoint")

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
