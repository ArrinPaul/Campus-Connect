import {
  PaymentProviderAdapter,
  CheckoutSessionParams,
  CheckoutSessionResult,
  WebhookEventPayload,
} from "./types"

export class MockPaymentAdapter implements PaymentProviderAdapter {
  readonly name = "mock"

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    const sessionId = `mock_sess_${Date.now()}_${params.plan}`
    return {
      sessionId,
      checkoutUrl: `${params.successUrl}?session_id=${sessionId}`,
      provider: this.name,
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; canceledAt?: string }> {
    return {
      success: true,
      canceledAt: new Date().toISOString(),
    }
  }

  async verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
    // In mock mode, valid if signature header is provided or contains 'mock'
    return !!signature && signature.includes("mock")
  }

  async parseWebhookEvent(rawBody: string, signature: string): Promise<WebhookEventPayload> {
    const parsed = JSON.parse(rawBody)
    return {
      eventId: parsed.id || `evt_mock_${Date.now()}`,
      eventType: parsed.type || "checkout.session.completed",
      provider: this.name,
      data: parsed.data || parsed,
    }
  }
}
