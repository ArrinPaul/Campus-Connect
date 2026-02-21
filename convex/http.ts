import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { Webhook } from "svix"

const http = httpRouter()

// ── CORS Configuration ──────────────────────────────
// Allowed origins for API requests
const ALLOWED_ORIGINS = [
  "https://campus-connect.vercel.app",
  "https://www.campus-connect.app",
  // Add your production domain(s) above
]

// In development, allow localhost origins
if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.push(
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000"
  )
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, svix-id, svix-timestamp, svix-signature",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  }

  // Only set Allow-Origin if the origin is in our allowlist
  if (origin && ALLOWED_ORIGINS.some(
    (allowed) => origin === allowed || origin.endsWith(".vercel.app")
  )) {
    headers["Access-Control-Allow-Origin"] = origin
  }

  return headers
}

// Handle CORS preflight requests
http.route({
  path: "/clerk-webhook",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    const origin = request.headers.get("Origin")
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    })
  }),
})

/**
 * Clerk webhook handler
 * Handles user.created and user.updated events from Clerk
 * Validates: Requirements 1.5
 */
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("Origin")
    const corsHeaders = getCorsHeaders(origin)

    // Get the webhook secret from environment variables
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET is not set")
      return new Response("Webhook secret not configured", {
        status: 500,
        headers: corsHeaders,
      })
    }

    // Get the headers and body
    const svixId = request.headers.get("svix-id")
    const svixTimestamp = request.headers.get("svix-timestamp")
    const svixSignature = request.headers.get("svix-signature")

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 })
    }

    // Get the raw body
    const body = await request.text()

    // Create a new Svix instance with the webhook secret
    const wh = new Webhook(webhookSecret)

    let evt: any

    // Verify the webhook signature
    try {
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      })
    } catch (err) {
      console.error("Error verifying webhook:", err)
      return new Response("Invalid signature", { status: 400 })
    }

    // Handle the webhook event
    const eventType = evt.type

    if (eventType === "user.created") {
      // Extract user data from the webhook payload
      const { id, email_addresses, first_name, last_name, image_url } = evt.data

      const email = email_addresses[0]?.email_address
      const name = `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous"

      // Create user record in Convex
      await ctx.runMutation(internal.users.createUserFromWebhook, {
        clerkId: id,
        email: email || "",
        name: name,
        profilePicture: image_url || undefined,
      })

      console.log(`User created: ${id}`)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (eventType === "user.updated") {
      // Extract user data from the webhook payload
      const { id, email_addresses, first_name, last_name, image_url } = evt.data

      const email = email_addresses[0]?.email_address
      const name = `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous"

      // Update user record in Convex
      await ctx.runMutation(internal.users.updateUserFromWebhook, {
        clerkId: id,
        email: email || "",
        name: name,
        profilePicture: image_url || undefined,
      })

      console.log(`User updated: ${id}`)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data

      // Delete user and all associated data from Convex
      await ctx.runMutation(internal.users.deleteUserFromWebhook, {
        clerkId: id,
      })

      console.log(`User deleted: ${id}`)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // For other event types, return success
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }),
})

export default http
