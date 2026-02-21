"use client"

import Link from "next/link"
import { BookOpen, Users, ShieldCheck, Flag } from "lucide-react"

interface Moderator {
  userId: string
  name: string
  username: string
  role: string
}

interface CommunityInfoSidebarProps {
  communityId: string
  slug: string
  rules: string[]
  moderators: Moderator[]
  createdAt: number
}

export function CommunityInfoSidebar({
  communityId,
  slug,
  rules,
  moderators,
  createdAt,
}: CommunityInfoSidebarProps) {
  const mods = moderators.filter(
    (m) => m.role === "owner" || m.role === "admin" || m.role === "moderator"
  )

  return (
    <div className="space-y-4">
      {/* Rules Section */}
      {rules.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 border-border bg-card">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            Community Rules
          </h3>
          <ol className="mt-3 space-y-2">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary dark:bg-blue-900 dark:text-blue-300">
                  {i + 1}
                </span>
                <span className="text-foreground">{rule}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Moderators Section */}
      {mods.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 border-border bg-card">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            Moderators
          </h3>
          <ul className="mt-3 space-y-2">
            {mods.slice(0, 5).map((mod) => (
              <li key={mod.userId}>
                <Link
                  href={`/profile/${mod.username ?? mod.userId}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <span className="font-medium text-foreground">
                    {mod.name}
                  </span>
                  <span className="text-xs capitalize text-muted-foreground">
                    ({mod.role})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Meta */}
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground border-border bg-card text-muted-foreground">
        <p>
          Created{" "}
          {new Date(createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Report Link */}
      <div className="text-center">
        <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive dark:text-muted-foreground dark:hover:text-red-400 transition-colors">
          <Flag className="h-3 w-3" />
          Report Community
        </button>
      </div>
    </div>
  )
}
