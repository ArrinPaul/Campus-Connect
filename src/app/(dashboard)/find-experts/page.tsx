"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { UserCard } from "@/components/profile/UserCard"
import { UserCardSkeleton } from "@/components/ui/loading-skeleton"
import { Search, Filter, Award, Star, X } from "lucide-react"

const EXPERIENCE_LEVELS = [
  { value: "", label: "All Levels" },
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Expert", label: "Expert" },
] as const

export default function FindExpertsPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [skillInput, setSkillInput] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [experienceLevel, setExperienceLevel] = useState<string>("")

  const results = useQuery(
    api.matching.findExperts,
    isLoaded && isSignedIn && skills.length > 0
      ? {
          skills,
          experienceLevel: experienceLevel || undefined,
        }
      : "skip"
  )

  const handleAddSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed.toLowerCase())) {
      setSkills((prev) => [...prev, trimmed.toLowerCase()])
      setSkillInput("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddSkill()
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl flex items-center gap-2">
          <Award className="h-7 w-7 text-amber-500" />
          Find Experts
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:mt-2 sm:text-base">
          Search for users with expertise in specific skills
        </p>
      </div>

      {/* Search Controls */}
      <div className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Skill input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Skills to search for
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a skill and press Enter..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleAddSkill}
              disabled={!skillInput.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Selected skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Experience level filter */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-600 dark:bg-gray-800/50">
          <Search className="mb-3 h-10 w-10 text-gray-400" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Add skills to find experts
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter one or more skills above to search for matching experts
          </p>
        </div>
      ) : results === undefined ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-600 dark:bg-gray-800/50">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No experts found
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try different skills or broaden your experience level filter
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Found {results.length} expert{results.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((expert) => (
              <div key={expert._id} className="relative">
                <UserCard user={expert} />
                {/* Overlay with match details */}
                <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                  {expert.matchedSkills.map((skill: string) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      <Star className="h-2.5 w-2.5" />
                      {skill}
                    </span>
                  ))}
                  {expert.endorsementCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      <Award className="h-2.5 w-2.5" />
                      {expert.endorsementCount} endorsement{expert.endorsementCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
