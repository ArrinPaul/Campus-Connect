import { NextResponse } from "next/server"
import { Webhook } from "svix"
import { upsertUser } from "@/server/db/users"
import { runWrite } from "@/server/graph/neo4j"

// POST /api/webhooks/clerk
// Handles user.created, user.updated, and user.deleted events from Clerk
export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  // Read raw body for signature verification
  const body = await req.text()

  const svixId = req.headers.get("svix-id")
  const svixTimestamp = req.headers.get("svix-timestamp")
  const svixSignature = req.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 })
  }

  let evt: { type: string; data: Record<string, unknown> }
  try {
    const wh = new Webhook(webhookSecret)
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof evt
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const eventType = evt.type
  const data = evt.data as {
    id: string
    email_addresses?: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
    image_url?: string
    username?: string
  }

  try {
    if (eventType === "user.created") {
      const email = data.email_addresses?.[0]?.email_address ?? ""
      const name = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "Anonymous"

      await upsertUser({
        clerkId: data.id,
        email,
        name,
        profilePicture: data.image_url,
      })

      console.log("Webhook: user created", { clerkId: data.id })
    } else if (eventType === "user.updated") {
      const email = data.email_addresses?.[0]?.email_address ?? ""
      const name = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "Anonymous"

      await upsertUser({
        clerkId: data.id,
        email,
        name,
        profilePicture: data.image_url,
      })

      console.log("Webhook: user updated", { clerkId: data.id })
    } else if (eventType === "user.deleted") {
      // Delete all user data associated with this Clerk ID
      await runWrite(async (session) => {
        await session.run(
          `MATCH (u:User {clerkId: $clerkId})
           DETACH DELETE u`,
          { clerkId: data.id }
        )
      })

      console.log("Webhook: user deleted", { clerkId: data.id })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Webhook processing error", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
