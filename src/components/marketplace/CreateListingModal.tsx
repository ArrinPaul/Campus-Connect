"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useState } from "react"

const CATEGORIES = ["books", "electronics", "furniture", "services", "other"] as const
const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
] as const

interface CreateListingModalProps {
  onClose: () => void
}

export function CreateListingModal({ onClose }: CreateListingModalProps) {
  const createListing = useMutation(api.marketplace.createListing)
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "books" as (typeof CATEGORIES)[number],
    price: "",
    condition: "good" as (typeof CONDITIONS)[number]["value"],
    university: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const price = form.price === "" ? 0 : Math.round(parseFloat(form.price) * 100)
      await createListing({
        title: form.title,
        description: form.description,
        category: form.category,
        price,
        condition: form.condition,
        university: form.university || undefined,
      })
      onClose()
    } catch (e: any) {
      setError(e.message ?? "Failed to create listing.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-background shadow-2xl border p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Post a Listing</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Title *</label>
            <input
              required
              maxLength={150}
              value={form.title}
              onChange={update("title")}
              placeholder="What are you selling?"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Description *</label>
            <textarea
              required
              maxLength={3000}
              rows={3}
              value={form.description}
              onChange={update("description")}
              placeholder="Describe your item, include any relevant details"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Category + Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Category *</label>
              <select
                value={form.category}
                onChange={update("category")}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Condition *</label>
              <select
                value={form.condition}
                onChange={update("condition")}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price + University */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={update("price")}
                placeholder="0.00 for free"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">University</label>
              <input
                value={form.university}
                onChange={update("university")}
                placeholder="e.g. MIT"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Posting…" : "Post Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
