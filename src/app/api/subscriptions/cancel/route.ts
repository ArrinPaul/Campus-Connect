import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { cancelUserSubscription } from "@/server/subscriptions/service"

// POST or DELETE /api/subscriptions/cancel — Cancel active subscription
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await cancelUserSubscription(user.id)
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to cancel subscription" }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}

export async function DELETE() {
  return POST()
}