import { z } from "zod"
import {
  BIO_MAX_LENGTH,
  POST_MAX_LENGTH,
  COMMENT_MAX_LENGTH,
  MAX_SKILLS,
  SKILL_MAX_LENGTH,
  NAME_MAX_LENGTH,
} from "../convex/validation_constants"

// User profile validation schema
export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(NAME_MAX_LENGTH, "Name too long"),
  bio: z.string().max(BIO_MAX_LENGTH, `Bio must be ${BIO_MAX_LENGTH} characters or less`).optional(),
  university: z.string().optional(),
  role: z.enum(["Student", "Research Scholar", "Faculty"]),
  experienceLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
  skills: z.array(z.string()).max(MAX_SKILLS, `Maximum ${MAX_SKILLS} skills allowed`),
  socialLinks: z.object({
    github: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
    linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
    twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  }),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// Post validation schema
export const postSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(POST_MAX_LENGTH, `Content must be ${POST_MAX_LENGTH} characters or less`),
})

export type PostFormData = z.infer<typeof postSchema>

// Comment validation schema
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment is required")
    .max(COMMENT_MAX_LENGTH, `Comment must be ${COMMENT_MAX_LENGTH} characters or less`),
})

export type CommentFormData = z.infer<typeof commentSchema>

// Skill validation
export function validateSkill(skill: string): { valid: boolean; error?: string } {
  if (skill.length === 0) {
    return { valid: false, error: "Skill name cannot be empty" }
  }
  if (skill.length > SKILL_MAX_LENGTH) {
    return { valid: false, error: `Skill name must be ${SKILL_MAX_LENGTH} characters or less` }
  }
  if (!/^[a-zA-Z0-9\s\-\+\#\.]+$/.test(skill)) {
    return { valid: false, error: "Skill name contains invalid characters" }
  }
  return { valid: true }
}

// Bio validation
export function validateBio(bio: string | undefined): { valid: boolean; error?: string } {
  if (!bio) return { valid: true }
  if (bio.length > BIO_MAX_LENGTH) {
    return { valid: false, error: `Bio must be ${BIO_MAX_LENGTH} characters or less` }
  }
  return { valid: true }
}

// University validation
export function validateUniversity(university: string | undefined): { valid: boolean; error?: string } {
  if (!university) return { valid: true }
  if (university.length > 100) {
    return { valid: false, error: "University name must be 100 characters or less" }
  }
  return { valid: true }
}

// Role validation
export function validateRole(role: string): { valid: boolean; error?: string } {
  const validRoles = ["Student", "Research Scholar", "Faculty"]
  if (!validRoles.includes(role)) {
    return { valid: false, error: "Invalid role selected" }
  }
  return { valid: true }
}

// Experience level validation
export function validateExperienceLevel(level: string): { valid: boolean; error?: string } {
  const validLevels = ["Beginner", "Intermediate", "Advanced", "Expert"]
  if (!validLevels.includes(level)) {
    return { valid: false, error: "Invalid experience level selected" }
  }
  return { valid: true }
}

// Sanitize string (basic XSS prevention)
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// Validate URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Email validation (basic)
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
