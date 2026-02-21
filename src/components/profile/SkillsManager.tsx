"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { validateSkill } from "../../../lib/validations"
import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"

interface SkillsManagerProps {
  skills: string[]
  onUpdate?: () => void
}

export function SkillsManager({ skills, onUpdate }: SkillsManagerProps) {
  const addSkill = useMutation(api.users.addSkill)
  const removeSkill = useMutation(api.users.removeSkill)

  const [newSkill, setNewSkill] = useState("")
  const [error, setError] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSkill(e.target.value)
    // Clear error when user starts typing
    if (error) {
      setError("")
    }
  }

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate skill
    const validation = validateSkill(newSkill)
    if (!validation.valid) {
      setError(validation.error!)
      return
    }

    // Check for duplicate on client side
    if (skills.includes(newSkill)) {
      setError("Skill already exists")
      return
    }

    // Clear any previous errors
    setError("")

    setIsAdding(true)

    try {
      await addSkill({ skill: newSkill })
      setNewSkill("")
      if (onUpdate) {
        onUpdate()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add skill")
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveSkill = async (skill: string) => {
    try {
      await removeSkill({ skill })
      if (onUpdate) {
        onUpdate()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove skill")
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Skill Form */}
      <form onSubmit={handleAddSkill} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={newSkill}
            onChange={handleInputChange}
            maxLength={50}
            placeholder="Add a skill (e.g., React, Python, Machine Learning)"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {error && <p className="mt-1 text-sm text-destructive dark:text-red-400">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={isAdding || !newSkill.trim()}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
        >
          {isAdding && <ButtonLoadingSpinner />}
          {isAdding ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Skills Display */}
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <div
              key={skill}
              className="flex items-center gap-2 rounded-full bg-primary/10 dark:bg-blue-900 px-3 py-1 text-sm text-primary dark:text-blue-200"
            >
              <span>{skill}</span>
              <button
                onClick={() => handleRemoveSkill(skill)}
                className="text-primary hover:text-primary dark:hover:text-blue-300 focus:outline-none"
                aria-label={`Remove ${skill}`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No skills added yet. Add your first skill above!
        </p>
      )}
    </div>
  )
}
