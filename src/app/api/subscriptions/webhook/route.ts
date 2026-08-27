import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { processWebhook } from "@/server/subscriptions/service"

// POST /api/subscriptions/webhook — Payment Provider Webhook Handler
export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature =
      req.headers.get("stripe-signature") ||
      req.headers.get("x-webhook-signature") ||
      ""

    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature header" }, { status: 400 })
    }

    const result = await processWebhook(rawBody, signature)

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}
