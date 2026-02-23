"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import imageCompression from "browser-image-compression"
import {
  validateBio,
  validateUniversity,
  validateRole,
  validateExperienceLevel,
} from "@/lib/validations"
import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"
import { createLogger } from "@/lib/logger"

const log = createLogger("ProfileForm")

interface ProfileFormProps {
  initialData?: {
    bio?: string
    university?: string
    role?: "Student" | "Research Scholar" | "Faculty"
    experienceLevel?: "Beginner" | "Intermediate" | "Advanced" | "Expert"
    profilePicture?: string
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
  const generateUploadUrl = useMutation(api.users.generateUploadUrl)
  const updateProfilePicture = useMutation(api.users.updateProfilePicture)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.profilePicture || null
  )

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors({ ...errors, image: "Please select an image file" })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: "Image size must be less than 5MB" })
        return
      }

      // Compress image before upload
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 800, // Profile pictures don't need to be huge
          useWebWorker: true,
        })
        setSelectedImage(compressed)
        setErrors({ ...errors, image: "" })

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(compressed)
      } catch (err) {
        log.error("Image compression failed, using original", err instanceof Error ? err : new Error(String(err)))
        // Fallback to original file
        setSelectedImage(file)
        setErrors({ ...errors, image: "" })

        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

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
      // Upload profile picture if a new image is selected
      if (selectedImage) {
        try {
          // Get upload URL from Convex with validation
          const uploadUrl = await generateUploadUrl()

          // Upload the file
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": selectedImage.type },
            body: selectedImage,
          })

          if (!result.ok) {
            throw new Error("Failed to upload image")
          }

          const { storageId } = await result.json()

          // Update profile picture in database
          await updateProfilePicture({ storageId })
        } catch (uploadError) {
          throw new Error(
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload profile picture"
          )
        }
      }

      // Update profile data
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
      setSelectedImage(null)
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
      {/* Profile Picture Upload */}
      <div>
        <label htmlFor="profilePicture" className="block text-sm font-medium text-foreground">
          Profile Picture
        </label>
        <div className="mt-2 flex items-center gap-4">
          {/* Image Preview */}
          <div className="relative h-20 w-20 flex-shrink-0">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Profile preview"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
                ?
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1">
            <input
              id="profilePicture"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Choose Image
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              Max 5MB. Supported formats: JPG, PNG, GIF
            </p>
          </div>
        </div>
        {errors.image && (
          <p className="mt-1 text-sm text-destructive">{errors.image}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-foreground">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={500}
          className="mt-1 block w-full rounded-md border border-border bg-card px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Tell us about yourself..."
        />
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-destructive">{errors.bio}</span>
          <span className="text-muted-foreground">{bio.length}/500</span>
        </div>
      </div>

      {/* University */}
      <div>
        <label
          htmlFor="university"
          className="block text-sm font-medium text-foreground"
        >
          University
        </label>
        <input
          type="text"
          id="university"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          maxLength={200}
          className="mt-1 block w-full rounded-md border border-border bg-card px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Your university name"
        />
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-destructive">{errors.university}</span>
          <span className="text-muted-foreground">{university.length}/200</span>
        </div>
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-foreground">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) =>
            setRole(e.target.value as "Student" | "Research Scholar" | "Faculty")
          }
          className="mt-1 block w-full rounded-md border border-border bg-card px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="Student">Student</option>
          <option value="Research Scholar">Research Scholar</option>
          <option value="Faculty">Faculty</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-destructive">{errors.role}</p>
        )}
      </div>

      {/* Experience Level */}
      <div>
        <label
          htmlFor="experienceLevel"
          className="block text-sm font-medium text-foreground"
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
          className="mt-1 block w-full rounded-md border border-border bg-card px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </select>
        {errors.experienceLevel && (
          <p className="mt-1 text-sm text-destructive">{errors.experienceLevel}</p>
        )}
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Social Links</h3>

        <div>
          <label
            htmlFor="github"
            className="block text-sm font-medium text-muted-foreground"
          >
            GitHub
          </label>
          <input
            type="url"
            id="github"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-card px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="https://github.com/username"
          />
        </div>

        <div>
          <label
            htmlFor="linkedin"
            className="block text-sm font-medium text-muted-foreground"
          >
            LinkedIn
          </label>
          <input
            type="url"
            id="linkedin"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-card px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="https://linkedin.com/in/username"
          />
        </div>

        <div>
          <label
            htmlFor="twitter"
            className="block text-sm font-medium text-muted-foreground"
          >
            Twitter
          </label>
          <input
            type="url"
            id="twitter"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-card px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="https://twitter.com/username"
          />
        </div>

        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-muted-foreground"
          >
            Website
          </label>
          <input
            type="url"
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-card px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div>
        {errors.submit && (
          <p className="mb-2 text-sm text-destructive">{errors.submit}</p>
        )}
        {successMessage && (
          <p className="mb-2 text-sm text-success">{successMessage}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && <ButtonLoadingSpinner />}
          {isSubmitting ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </form>
  )
}
