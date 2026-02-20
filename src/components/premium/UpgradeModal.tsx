"use client"

import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { useState } from "react"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  featureName?: string
}

export function UpgradeModal({ isOpen, onClose, featureName }: UpgradeModalProps) {
  const upgradeToPro = useMutation(api.subscriptions.upgradeToPro)
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      await upgradeToPro({ plan })
      onClose()
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl border p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">Unlock with Pro</h2>
            {featureName && (
              <p className="text-sm text-muted-foreground mt-1">
                <strong>{featureName}</strong> is a Pro feature.
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Feature highlights */}
        <ul className="space-y-1.5 text-sm">
          {[
            "Advanced search & filters",
            "Profile analytics",
            "Unlimited DMs",
            "Pro badge",
            "Priority support",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              {f}
            </li>
          ))}
        </ul>

        {/* Plan selector */}
        <div className="flex gap-2">
          {(["monthly", "yearly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                plan === p
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {p === "monthly" ? "$9.99/mo" : "$79.99/yr"}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Processing…" : "Upgrade to Pro"}
        </button>

        <p className="text-xs text-center text-muted-foreground">
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  )
}
