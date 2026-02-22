"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Settings, Trash2, ChevronLeft, Plus, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SettingsPageProps {
  params: { slug: string }
}

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

export default function CommunitySettingsPage({ params }: SettingsPageProps) {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  const community = useQuery(
    api.communities.getCommunity,
    isLoaded ? { slug: params.slug } : "skip"
  )

  const updateCommunity = useMutation(api.communities.updateCommunity)
  const deleteCommunity = useMutation(api.communities.deleteCommunity)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"public" | "private" | "secret">("public")
  const [category, setCategory] = useState("Other")
  const [rules, setRules] = useState<string[]>([])
  const [newRule, setNewRule] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Initialize form when community loads
  useEffect(() => {
    if (community) {
      setName(community.name)
      setDescription(community.description)
      setType(community.type)
      setCategory(community.category)
      setRules([...community.rules])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [community?._id])

  if (!isLoaded || community === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    )
  }

  if (community === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Community not found
      </div>
    )
  }

  // Only owner/admin can access settings
  if (
    community.viewerRole !== "owner" &&
    community.viewerRole !== "admin"
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">
            You don&apos;t have permission to access community settings.
          </p>
          <Link
            href={`/c/${params.slug}`}
            className="mt-3 inline-block text-primary hover:underline"
          >
            Back to community
          </Link>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSaveSuccess(false)
    try {
      await updateCommunity({
        communityId: community._id,
        name: name.trim(),
        description: description.trim(),
        type,
        category,
        rules,
      })
      setSaveSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${community.name}"? This action cannot be undone.`
      )
    )
      return

    setIsDeleting(true)
    try {
      await deleteCommunity({ communityId: community._id })
      router.push("/communities")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete community")
      setIsDeleting(false)
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
        href={`/c/${params.slug}`}
        className="inline-flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {community.name}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-2">
        <Settings className="h-6 w-6" />
        Community Settings
      </h1>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-elevation-1">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            General
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Community Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
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
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
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
                  Community Type
                </label>
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as "public" | "private" | "secret")
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="secret">Secret</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-elevation-1">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Community Rules
          </h2>

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
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <button
              onClick={addRule}
              disabled={!newRule.trim()}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          {saveSuccess && (
            <p className="text-sm text-accent-emerald">
              Settings saved!
            </p>
          )}
          {!saveError && !saveSuccess && <span />}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Danger Zone — owner only */}
        {community.viewerRole === "owner" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
            <h2 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">
              Danger Zone
            </h2>
            <p className="mb-4 text-sm text-destructive dark:text-red-400">
              Deleting a community is permanent and cannot be undone. All
              members will be removed.
            </p>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete Community"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
