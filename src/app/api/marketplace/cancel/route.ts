import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { cancelTransaction } from "@/server/db/misc"

// POST /api/marketplace/cancel  body: { transactionId }  (seller declines / buyer withdraws)
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const transactionId = body.transactionId || body.id
    if (!transactionId) return NextResponse.json({ error: "transactionId required" }, { status: 400 })

    const result = await cancelTransaction(transactionId, user.id)
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json(result.data)
  } catch (err) {
    return internalError(err)
  }
}
