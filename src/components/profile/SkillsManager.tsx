"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { validateSkill } from "../../../lib/validations"

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
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={isAdding || !newSkill.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isAdding ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Skills Display */}
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <div
              key={skill}
              className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              <span>{skill}</span>
              <button
                onClick={() => handleRemoveSkill(skill)}
                className="text-blue-600 hover:text-blue-800 focus:outline-none"
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
        <p className="text-sm text-gray-500">
          No skills added yet. Add your first skill above!
        </p>
      )}
    </div>
  )
}
