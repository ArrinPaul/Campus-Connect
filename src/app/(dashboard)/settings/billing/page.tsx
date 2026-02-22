"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useState } from "react"

export default function BillingPage() {
  const proStatus = useQuery(api.subscriptions.checkProStatus)
  const upgradeToPro = useMutation(api.subscriptions.upgradeToPro)
  const cancelPro = useMutation(api.subscriptions.cancelPro)
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setLoading(true)
    setMessage(null)
    try {
      await upgradeToPro({ plan: selectedPlan })
      setMessage("Successfully upgraded to Pro!")
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your Pro subscription?")) return
    setLoading(true)
    setMessage(null)
    try {
      await cancelPro({})
      setMessage("Your subscription has been cancelled.")
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  if (proStatus === undefined) {
    return <div className="p-8 text-center text-muted-foreground">Loading billing info…</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing &amp; Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your Campus Connect Pro subscription.</p>
      </div>

      {/* Current Status */}
      {proStatus?.isPro && proStatus.subscription ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-2 dark:border-emerald-800 dark:bg-emerald-950">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Campus Connect Pro — Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {proStatus.subscription.cancelAtPeriodEnd
              ? `Cancels in ${proStatus.subscription.daysRemaining} days`
              : `Renews in ${proStatus.subscription.daysRemaining} days`}
          </p>
          {!proStatus.subscription.cancelAtPeriodEnd && (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="mt-2 text-sm text-destructive hover:underline disabled:opacity-50"
            >
              {loading ? "Processing…" : "Cancel subscription"}
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
          You are on the <strong>Free</strong> plan. Upgrade to unlock premium features.
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
          {message}
        </div>
      )}

      {/* Pricing Cards */}
      {!proStatus?.isPro && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Choose a plan</h2>

          {/* Plan Toggle */}
          <div className="flex gap-3">
            {(["monthly", "yearly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlan(p)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  selectedPlan === p
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {p === "monthly" ? "Monthly — $9.99/mo" : "Yearly — $79.99/yr"}
                {p === "yearly" && (
                  <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full dark:bg-emerald-900 dark:text-emerald-400">
                    Save 33%
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Feature List */}
          <div className="rounded-xl border bg-card p-6 space-y-3">
            <h3 className="font-semibold text-lg">Campus Connect Pro</h3>
            <ul className="space-y-2">
              {[
                "Advanced search filters",
                "Profile analytics — see who viewed your profile",
                "Larger file uploads (up to 100MB)",
                "Custom profile themes",
                "Priority support",
                "Unlimited direct messages",
                "Data export",
                "Pro badge on your profile",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <svg
                    className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Processing…" : `Upgrade to Pro — ${selectedPlan === "monthly" ? "$9.99/month" : "$79.99/year"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
