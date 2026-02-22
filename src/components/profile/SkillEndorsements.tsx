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
  const endorsements = useQuery(api.skill_endorsements.getEndorsements, {
    userId,
  })
  const endorseSkill = useMutation(api.skill_endorsements.endorseSkill)
  const removeEndorsement = useMutation(
    api.skill_endorsements.removeEndorsement
  )

  const [loadingSkill, setLoadingSkill] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (endorsements === undefined) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    )
  }

  if (endorsements.skills.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
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
        <p className="text-xs text-destructive mb-2">{error}</p>
      )}
      {endorsements.skills.map((skill) => (
        <div
          key={skill.name}
          className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 border-border bg-card"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
              {skill.name}
            </span>
            {skill.count > 0 && (
              <span
                className="flex items-center gap-1 text-xs text-muted-foreground"
                title={
                  skill.topEndorsers.length > 0
                    ? `Endorsed by ${skill.topEndorsers.join(", ")}${skill.count > skill.topEndorsers.length ? ` and ${skill.count - skill.topEndorsers.length} others` : ""}`
                    : undefined
                }
              >
                <Award className="h-3.5 w-3.5 text-amber-500" />
                {skill.count}
                {skill.topEndorsers.length > 0 && (
                  <span className="hidden sm:inline text-muted-foreground truncate max-w-[120px]">
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
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border text-muted-foreground hover:bg-muted border-border text-muted-foreground hover:bg-accent"
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
