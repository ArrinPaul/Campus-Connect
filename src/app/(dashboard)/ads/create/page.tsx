"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useState } from "react"
import { useRouter } from "next/navigation"

const EMPTY_FORM = {
  title: "",
  content: "",
  linkUrl: "",
  imageUrl: "",
  targetUniversity: "",
  targetRole: "",
  targetSkills: "",
  budget: "",
  durationDays: "30",
}

export default function CreateAdPage() {
  const router = useRouter()
  const createAd = useMutation(api.ads.createAd)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (key: keyof typeof EMPTY_FORM) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const budget = Math.round(parseFloat(form.budget) * 100) // convert to cents
      const durationMs = parseInt(form.durationDays) * 24 * 60 * 60 * 1000
      const expiresAt = Date.now() + durationMs
      const skills = form.targetSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      await createAd({
        title: form.title,
        content: form.content,
        linkUrl: form.linkUrl,
        imageUrl: form.imageUrl || undefined,
        targetUniversity: form.targetUniversity || undefined,
        targetRole: form.targetRole || undefined,
        targetSkills: skills.length > 0 ? skills : undefined,
        budget,
        expiresAt,
      })
      router.push("/ads/dashboard")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create ad.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Ad</h1>
        <p className="text-muted-foreground text-sm mt-1">Reach students at their campus.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Title *</label>
          <input
            required
            maxLength={200}
            value={form.title}
            onChange={update("title")}
            placeholder="Short, attention-grabbing headline"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground text-right">{form.title.length}/200</p>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Ad Content *</label>
          <textarea
            required
            maxLength={2000}
            rows={4}
            value={form.content}
            onChange={update("content")}
            placeholder="Describe your offer or promotion"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{form.content.length}/2000</p>
        </div>

        {/* Link */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Destination URL *</label>
          <input
            required
            type="url"
            value={form.linkUrl}
            onChange={update("linkUrl")}
            placeholder="https://yoursite.com"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Image */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Image URL <span className="text-muted-foreground">(optional)</span></label>
          <input
            type="url"
            value={form.imageUrl}
            onChange={update("imageUrl")}
            placeholder="https://..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Targeting */}
        <fieldset className="space-y-3 rounded-xl border p-4">
          <legend className="text-sm font-semibold px-1">Targeting <span className="text-muted-foreground font-normal">(all optional)</span></legend>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">University</label>
              <input
                value={form.targetUniversity}
                onChange={update("targetUniversity")}
                placeholder="e.g. MIT"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Role</label>
              <input
                value={form.targetRole}
                onChange={update("targetRole")}
                placeholder="e.g. student"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Skills (comma-separated)</label>
            <input
              value={form.targetSkills}
              onChange={update("targetSkills")}
              placeholder="e.g. Python, React, Machine Learning"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </fieldset>

        {/* Budget & Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Budget ($) *</label>
            <input
              required
              type="number"
              min="1"
              step="0.01"
              value={form.budget}
              onChange={update("budget")}
              placeholder="50.00"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Duration</label>
            <select
              value={form.durationDays}
              onChange={update("durationDays")}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        {(form.title || form.content) && (
          <div className="rounded-xl border border-dashed p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Preview</p>
            <div className="text-xs text-muted-foreground">Sponsored</div>
            {form.title && <p className="font-semibold">{form.title}</p>}
            {form.content && <p className="text-sm text-muted-foreground">{form.content}</p>}
            {form.linkUrl && (
              <p className="text-xs text-primary truncate">{form.linkUrl}</p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating…" : "Launch Ad"}
          </button>
        </div>
      </form>
    </div>
  )
}
