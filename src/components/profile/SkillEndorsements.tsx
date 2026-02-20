"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ThumbsUp, Award } from "lucide-react"

interface SkillEndorsementsProps {
  userId: Id<"users">
  isOwnProfile: boolean
}

export function SkillEndorsements({
  userId,
  isOwnProfile,
}: SkillEndorsementsProps) {
  const endorsements = useQuery(api.skillEndorsements.getEndorsements, {
    userId,
  })
  const endorseSkill = useMutation(api.skillEndorsements.endorseSkill)
  const removeEndorsement = useMutation(
    api.skillEndorsements.removeEndorsement
  )

  const [loadingSkill, setLoadingSkill] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (endorsements === undefined) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    )
  }

  if (endorsements.skills.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No skills added yet
      </p>
    )
  }

  const handleToggleEndorse = async (skillName: string, isEndorsed: boolean) => {
    setLoadingSkill(skillName)
    setError(null)
    try {
      if (isEndorsed) {
        await removeEndorsement({ userId, skillName })
      } else {
        await endorseSkill({ userId, skillName })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update endorsement")
    } finally {
      setLoadingSkill(null)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-500 mb-2">{error}</p>
      )}
      {endorsements.skills.map((skill) => (
        <div
          key={skill.name}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {skill.name}
            </span>
            {skill.count > 0 && (
              <span
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
                title={
                  skill.topEndorsers.length > 0
                    ? `Endorsed by ${skill.topEndorsers.join(", ")}${skill.count > skill.topEndorsers.length ? ` and ${skill.count - skill.topEndorsers.length} others` : ""}`
                    : undefined
                }
              >
                <Award className="h-3.5 w-3.5 text-amber-500" />
                {skill.count}
                {skill.topEndorsers.length > 0 && (
                  <span className="hidden sm:inline text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
                    by {skill.topEndorsers[0]}
                    {skill.count > 1
                      ? ` +${skill.count - 1}`
                      : ""}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Endorse button — only on other users' profiles */}
          {!isOwnProfile && (
            <button
              onClick={() =>
                handleToggleEndorse(skill.name, skill.endorsedByViewer)
              }
              disabled={loadingSkill === skill.name}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                skill.endorsedByViewer
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              } disabled:opacity-50`}
              title={
                skill.endorsedByViewer
                  ? "Remove endorsement"
                  : `Endorse ${skill.name}`
              }
            >
              <ThumbsUp
                className={`h-3 w-3 ${skill.endorsedByViewer ? "fill-white" : ""}`}
              />
              {loadingSkill === skill.name
                ? "..."
                : skill.endorsedByViewer
                  ? "Endorsed"
                  : "Endorse"}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
