import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getUserSubscription, cancelUserSubscription } from "@/server/subscriptions/service"

// GET /api/subscriptions — Retrieve current authenticated user's subscription
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ plan: "free", status: "active", provider: "none" })
    }

    const subscription = await getUserSubscription(user.id)
    return NextResponse.json(subscription, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}

// DELETE /api/subscriptions — Cancel user subscription
export async function DELETE() {
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
