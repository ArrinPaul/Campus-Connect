import "server-only"
import { createAdminClient } from "@/lib/supabase/server"
import { createLogger } from "@/lib/logger"
import {
  PaymentProviderAdapter,
  SubscriptionPlan,
  SubscriptionRecord,
  CheckoutSessionParams,
  CheckoutSessionResult,
} from "./types"
import { MockPaymentAdapter } from "./mock-adapter"
import { StripePaymentAdapter } from "./stripe-adapter"

const log = createLogger("SubscriptionService")

export function getPaymentAdapter(): PaymentProviderAdapter {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (stripeKey && !stripeKey.startsWith("mock_")) {
    return new StripePaymentAdapter(stripeKey, webhookSecret)
  }

  return new MockPaymentAdapter()
}

export async function createCheckout(params: {
  userId: string
  userEmail?: string
  plan: SubscriptionPlan
  successUrl: string
  cancelUrl: string
}): Promise<CheckoutSessionResult | { error: string; status: number }> {
  const { userId, userEmail, plan, successUrl, cancelUrl } = params

  if (plan !== "pro" && plan !== "campus_leader") {
    return { error: "Invalid subscription plan requested", status: 400 }
  }

  const adapter = getPaymentAdapter()
  log.info("Creating checkout session", { userId, plan, provider: adapter.name })

  try {
    const session = await adapter.createCheckoutSession({
      userId,
      userEmail,
      plan,
      successUrl,
      cancelUrl,
    })
    return session
  } catch (err: any) {
    log.error("Failed to create checkout session", { error: err.message, userId })
    return { error: "Checkout session creation failed", status: 500 }
  }
}

export async function getUserSubscription(userId: string): Promise<SubscriptionRecord> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    return {
      user_id: userId,
      plan: "free",
      status: "active",
      provider: "none",
    }
  }

  return data
}

export async function cancelUserSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (!sub || sub.plan === "free" || !sub.provider_subscription_id) {
    return { success: false, error: "No active paid subscription found to cancel" }
  }

  const adapter = getPaymentAdapter()
  try {
    await adapter.cancelSubscription(sub.provider_subscription_id)
    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id)

    log.info("Subscription canceled", { userId, subscriptionId: sub.provider_subscription_id })
    return { success: true }
  } catch (err: any) {
    log.error("Failed to cancel subscription", { error: err.message, userId })
    return { success: false, error: err.message }
  }
}

export async function processWebhook(rawBody: string, signature: string) {
  const adapter = getPaymentAdapter()

  // 1. Verify signature
  const isValid = await adapter.verifyWebhookSignature(rawBody, signature)
  if (!isValid) {
    log.warn("Invalid webhook signature rejected", { provider: adapter.name })
    return { error: "Invalid webhook signature", status: 400 }
  }

  // 2. Parse event payload
  const event = await adapter.parseWebhookEvent(rawBody, signature)
  const supabase = createAdminClient()

  // 3. Idempotency check in subscription_events
  const { data: existingEvent } = await supabase
    .from("subscription_events")
    .select("id")
    .eq("provider_event_id", event.eventId)
    .single()

  if (existingEvent) {
    log.info("Webhook event already processed (idempotency skipped)", { eventId: event.eventId })
    return { success: true, duplicate: true }
  }

  // 4. Log event in subscription_events
  await supabase.from("subscription_events").insert({
    provider_event_id: event.eventId,
    event_type: event.eventType,
    payload: event.data,
    processed: true,
  })

  // 5. Reconcile subscription state
  const userId = event.data.userId
  if (userId) {
    const plan = event.data.plan || "pro"
    const status = event.data.status || "active"
    const subscriptionId = event.data.subscriptionId
    const customerId = event.data.customerId

    await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan,
          status,
          provider: event.provider,
          provider_subscription_id: subscriptionId,
          provider_customer_id: customerId,
          current_period_start: event.data.periodStart,
          current_period_end: event.data.periodEnd,
          cancel_at_period_end: event.data.cancelAtPeriodEnd ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

    log.info("Subscription reconciled from webhook", { userId, plan, status })
  }

  return { success: true, eventId: event.eventId }
}
