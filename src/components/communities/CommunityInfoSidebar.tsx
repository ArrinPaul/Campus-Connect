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
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
            <BookOpen className="h-4 w-4 text-blue-500" />
            Community Rules
          </h3>
          <ol className="mt-3 space-y-2">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {i + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300">{rule}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Moderators Section */}
      {mods.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            Moderators
          </h3>
          <ul className="mt-3 space-y-2">
            {mods.slice(0, 5).map((mod) => (
              <li key={mod.userId}>
                <Link
                  href={`/profile/${mod.username ?? mod.userId}`}
                  className="flex items-center gap-2 text-sm hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {mod.name}
                  </span>
                  <span className="text-xs capitalize text-gray-500 dark:text-gray-400">
                    ({mod.role})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Meta */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
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
        <button className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors">
          <Flag className="h-3 w-3" />
          Report Community
        </button>
      </div>
    </div>
  )
}
