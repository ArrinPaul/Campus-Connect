import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getUserPushSubscriptions } from "@/server/push/web-push"

// GET /api/push/subscriptions
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscriptions = await getUserPushSubscriptions(user.id)
    return NextResponse.json(subscriptions)
  } catch (err) {
    return internalError(err)
  }
}
