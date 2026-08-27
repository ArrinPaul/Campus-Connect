export type SubscriptionPlan = "free" | "pro" | "campus_leader"

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "trialing"

export interface CheckoutSessionParams {
  userId: string
  userEmail?: string
  plan: SubscriptionPlan
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSessionResult {
  sessionId: string
  checkoutUrl: string
  provider: string
}

export interface SubscriptionRecord {
  id?: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  provider: string
  provider_customer_id?: string | null
  provider_subscription_id?: string | null
  current_period_start?: string | null
  current_period_end?: string | null
  cancel_at_period_end?: boolean
  created_at?: string
  updated_at?: string
}

export interface WebhookEventPayload {
  eventId: string
  eventType: string
  provider: string
  data: {
    userId?: string
    plan?: SubscriptionPlan
    status?: SubscriptionStatus
    subscriptionId?: string
    customerId?: string
    periodStart?: string
    periodEnd?: string
    cancelAtPeriodEnd?: boolean
    [key: string]: any
  }
}

export interface PaymentProviderAdapter {
  readonly name: string
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult>
  cancelSubscription(subscriptionId: string): Promise<{ success: boolean; canceledAt?: string }>
  verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean>
  parseWebhookEvent(rawBody: string, signature: string): Promise<WebhookEventPayload>
}
