"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  validateBio,
  validateUniversity,
  validateRole,
  validateExperienceLevel,
} from "../../../lib/validations"

interface ProfileFormProps {
  initialData?: {
    bio?: string
    university?: string
    role?: "Student" | "Research Scholar" | "Faculty"
    experienceLevel?: "Beginner" | "Intermediate" | "Advanced" | "Expert"
    socialLinks?: {
      github?: string
      linkedin?: string
      twitter?: string
      website?: string
    }
  }
  onSave?: () => void
}

export function ProfileForm({ initialData, onSave }: ProfileFormProps) {
  const updateProfile = useMutation(api.users.updateProfile)

  const [bio, setBio] = useState(initialData?.bio || "")
  const [university, setUniversity] = useState(initialData?.university || "")
  const [role, setRole] = useState<"Student" | "Research Scholar" | "Faculty">(
    initialData?.role || "Student"
  )
  const [experienceLevel, setExperienceLevel] = useState<
    "Beginner" | "Intermediate" | "Advanced" | "Expert"
  >(initialData?.experienceLevel || "Beginner")
  const [github, setGithub] = useState(initialData?.socialLinks?.github || "")
  const [linkedin, setLinkedin] = useState(
    initialData?.socialLinks?.linkedin || ""
  )
  const [twitter, setTwitter] = useState(initialData?.socialLinks?.twitter || "")
  const [website, setWebsite] = useState(initialData?.socialLinks?.website || "")

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage("")

    // Validate all fields
    const newErrors: Record<string, string> = {}

    const bioValidation = validateBio(bio)
    if (!bioValidation.valid) {
      newErrors.bio = bioValidation.error!
    }

    const universityValidation = validateUniversity(university)
    if (!universityValidation.valid) {
      newErrors.university = universityValidation.error!
    }

    const roleValidation = validateRole(role)
    if (!roleValidation.valid) {
      newErrors.role = roleValidation.error!
    }

    const experienceLevelValidation = validateExperienceLevel(experienceLevel)
    if (!experienceLevelValidation.valid) {
      newErrors.experienceLevel = experienceLevelValidation.error!
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      await updateProfile({
        bio,
        university,
        role,
        experienceLevel,
        socialLinks: {
          github: github || undefined,
          linkedin: linkedin || undefined,
          twitter: twitter || undefined,
          website: website || undefined,
        },
      })

      setSuccessMessage("Profile updated successfully!")
      if (onSave) {
        onSave()
      }
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : "Failed to update profile",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={500}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Tell us about yourself..."
        />
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-red-600">{errors.bio}</span>
          <span className="text-gray-500">{bio.length}/500</span>
        </div>
      </div>

      {/* University */}
      <div>
        <label
          htmlFor="university"
          className="block text-sm font-medium text-gray-700"
        >
          University
        </label>
        <input
          type="text"
          id="university"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          maxLength={200}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Your university name"
        />
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-red-600">{errors.university}</span>
          <span className="text-gray-500">{university.length}/200</span>
        </div>
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) =>
            setRole(e.target.value as "Student" | "Research Scholar" | "Faculty")
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="Student">Student</option>
          <option value="Research Scholar">Research Scholar</option>
          <option value="Faculty">Faculty</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role}</p>
        )}
      </div>

      {/* Experience Level */}
      <div>
        <label
          htmlFor="experienceLevel"
          className="block text-sm font-medium text-gray-700"
        >
          Experience Level
        </label>
        <select
          id="experienceLevel"
          value={experienceLevel}
          onChange={(e) =>
            setExperienceLevel(
              e.target.value as "Beginner" | "Intermediate" | "Advanced" | "Expert"
            )
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </select>
        {errors.experienceLevel && (
          <p className="mt-1 text-sm text-red-600">{errors.experienceLevel}</p>
        )}
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Social Links</h3>

        <div>
          <label
            htmlFor="github"
            className="block text-sm font-medium text-gray-600"
          >
            GitHub
          </label>
          <input
            type="url"
            id="github"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="https://github.com/username"
          />
        </div>

        <div>
          <label
            htmlFor="linkedin"
            className="block text-sm font-medium text-gray-600"
          >
            LinkedIn
          </label>
          <input
            type="url"
            id="linkedin"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="https://linkedin.com/in/username"
          />
        </div>

        <div>
          <label
            htmlFor="twitter"
            className="block text-sm font-medium text-gray-600"
          >
            Twitter
          </label>
          <input
            type="url"
            id="twitter"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="https://twitter.com/username"
          />
        </div>

        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-600"
          >
            Website
          </label>
          <input
            type="url"
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div>
        {errors.submit && (
          <p className="mb-2 text-sm text-red-600">{errors.submit}</p>
        )}
        {successMessage && (
          <p className="mb-2 text-sm text-green-600">{successMessage}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </form>
  )
}
