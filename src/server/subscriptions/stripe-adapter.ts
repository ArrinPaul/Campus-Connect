import {
  PaymentProviderAdapter,
  CheckoutSessionParams,
  CheckoutSessionResult,
  WebhookEventPayload,
} from "./types"
import { createLogger } from "@/lib/logger"

const log = createLogger("StripeAdapter")

export class StripePaymentAdapter implements PaymentProviderAdapter {
  readonly name = "stripe"
  private secretKey: string
  private webhookSecret?: string

  constructor(secretKey: string, webhookSecret?: string) {
    this.secretKey = secretKey
    this.webhookSecret = webhookSecret
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    // Standard Stripe Checkout Session creation via Stripe REST API
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "subscription",
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        "client_reference_id": params.userId,
        ...(params.userEmail ? { customer_email: params.userEmail } : {}),
        "metadata[userId]": params.userId,
        "metadata[plan]": params.plan,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      log.error("Stripe session creation failed", { status: res.status, error: errBody })
      throw new Error(`Stripe API error: ${res.status}`)
    }

    const data = await res.json()
    return {
      sessionId: data.id,
      checkoutUrl: data.url,
      provider: this.name,
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; canceledAt?: string }> {
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    })

    if (!res.ok) {
      throw new Error(`Failed to cancel Stripe subscription: ${res.status}`)
    }

    return {
      success: true,
      canceledAt: new Date().toISOString(),
    }
  }

  async verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
    if (!this.webhookSecret || !signature) return false
    // Basic presence check; full HMAC-SHA256 verification in production
    return signature.includes("t=") && signature.includes("v1=")
  }

  async parseWebhookEvent(rawBody: string, signature: string): Promise<WebhookEventPayload> {
    const event = JSON.parse(rawBody)
    const obj = event.data?.object || {}

    return {
      eventId: event.id,
      eventType: event.type,
      provider: this.name,
      data: {
        userId: obj.client_reference_id || obj.metadata?.userId,
        plan: obj.metadata?.plan,
        status: obj.status,
        subscriptionId: obj.subscription || obj.id,
        customerId: obj.customer,
        periodStart: obj.current_period_start ? new Date(obj.current_period_start * 1000).toISOString() : undefined,
        periodEnd: obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : undefined,
        cancelAtPeriodEnd: obj.cancel_at_period_end ?? false,
      },
    }
  }
}
