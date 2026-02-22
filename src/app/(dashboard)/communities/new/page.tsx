"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ChevronLeft, Plus, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const CATEGORIES = [
  "Academic",
  "Research",
  "Social",
  "Sports",
  "Clubs",
  "Technology",
  "Arts",
  "Other",
]

export default function CreateCommunityPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  const createCommunity = useMutation(api.communities.createCommunity)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"public" | "private" | "secret">("public")
  const [category, setCategory] = useState("Academic")
  const [rules, setRules] = useState<string[]>([])
  const [newRule, setNewRule] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Please sign in to create a community.</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await createCommunity({
        name: name.trim(),
        description: description.trim(),
        type,
        category,
        rules,
      })
      router.push(`/c/${result.slug}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create community")
    } finally {
      setIsSubmitting(false)
    }
  }

  const addRule = () => {
    const trimmed = newRule.trim()
    if (trimmed && !rules.includes(trimmed)) {
      setRules((prev) => [...prev, trimmed])
      setNewRule("")
    }
  }

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8">
      <Link
        href="/communities"
        className="inline-flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Communities
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Create Community
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Info */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm border-border bg-card">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Community Info
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Computer Science Club"
                maxLength={100}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring border-border bg-muted text-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">{name.length}/100</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this community about?"
                rows={3}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring border-border bg-muted text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none border-border bg-muted text-foreground"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as "public" | "private" | "secret")
                  }
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none border-border bg-muted text-foreground"
                >
                  <option value="public">Public — Anyone can join</option>
                  <option value="private">Private — Requires approval</option>
                  <option value="secret">Secret — Invite only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm border-border bg-card">
          <h2 className="mb-1 text-lg font-semibold text-foreground">
            Rules <span className="text-sm font-normal text-muted-foreground">(optional)</span>
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Add community rules to help members understand expected behavior.
          </p>

          <ol className="mb-3 space-y-2">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-foreground">
                  {rule}
                </span>
                <button
                  type="button"
                  onClick={() => removeRule(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>

          <div className="flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addRule()
                }
              }}
              placeholder="Add a rule..."
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-ring focus:outline-none border-border bg-muted text-foreground"
            />
            <button
              type="button"
              onClick={addRule}
              disabled={!newRule.trim()}
              className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Submit */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !description.trim()}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Creating..." : "Create Community"}
          </button>
        </div>
      </form>
    </div>
  )
}
