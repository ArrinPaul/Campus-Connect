import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { createCheckout } from "@/server/subscriptions/service"

// POST /api/subscriptions/checkout — Initiate subscription checkout session
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const plan = body.plan

    if (!plan || (plan !== "pro" && plan !== "campus_leader")) {
      return NextResponse.json(
        { error: "Invalid subscription plan. Allowed plans: 'pro', 'campus_leader'" },
        { status: 400 }
      )
    }

    const host = req.headers.get("host") || "localhost:3000"
    const protocol = req.headers.get("x-forwarded-proto") || "http"
    const origin = `${protocol}://${host}`

    const successUrl = body.successUrl || `${origin}/settings/billing?session_id={CHECKOUT_SESSION_ID}&success=true`
    const cancelUrl = body.cancelUrl || `${origin}/settings/billing?canceled=true`

    const session = await createCheckout({
      userId: user.id,
      userEmail: user.email,
      plan,
      successUrl,
      cancelUrl,
    })

    if ("error" in session) {
      return NextResponse.json({ error: session.error }, { status: session.status })
    }

    return NextResponse.json(session, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}