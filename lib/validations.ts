/**
 * Validation utilities for Campus Connect
 * Feature: campus-connect-foundation
 * 
 * These functions validate user input according to requirements.
 */

/**
 * Validate bio text length
 * Validates: Requirement 2.5
 */
export function validateBio(bio: string): { valid: boolean; error?: string } {
  if (bio.length > 500) {
    return {
      valid: false,
      error: "Bio must not exceed 500 characters",
    }
  }
  return { valid: true }
}

/**
 * Validate university name length
 * Validates: Requirement 2.6
 */
export function validateUniversity(
  university: string
): { valid: boolean; error?: string } {
  if (university.length > 200) {
    return {
      valid: false,
      error: "University name must not exceed 200 characters",
    }
  }
  return { valid: true }
}

/**
 * Validate role enum value
 * Validates: Requirement 2.7
 */
export function validateRole(
  role: string
): { valid: boolean; error?: string } {
  const validRoles = ["Student", "Research Scholar", "Faculty"]
  if (!validRoles.includes(role)) {
    return {
      valid: false,
      error: `Role must be one of: ${validRoles.join(", ")}`,
    }
  }
  return { valid: true }
}

/**
 * Validate experience level enum value
 * Validates: Requirement 2.8
 */
export function validateExperienceLevel(
  level: string
): { valid: boolean; error?: string } {
  const validLevels = ["Beginner", "Intermediate", "Advanced", "Expert"]
  if (!validLevels.includes(level)) {
    return {
      valid: false,
      error: `Experience level must be one of: ${validLevels.join(", ")}`,
    }
  }
  return { valid: true }
}

/**
 * Validate skill name
 * Validates: Requirements 3.3, 3.4
 */
export function validateSkill(
  skill: string
): { valid: boolean; error?: string } {
  if (!skill || skill.trim().length === 0) {
    return {
      valid: false,
      error: "Skill name cannot be empty",
    }
  }

  if (skill.length > 50) {
    return {
      valid: false,
      error: "Skill name must not exceed 50 characters",
    }
  }

  return { valid: true }
}

/**
 * Validate post content
 * Validates: Requirements 4.2, 4.3
 */
export function validatePostContent(
  content: string
): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return {
      valid: false,
      error: "Post content cannot be empty",
    }
  }

  if (content.length > 5000) {
    return {
      valid: false,
      error: "Post content must not exceed 5000 characters",
    }
  }

  return { valid: true }
}

/**
 * Validate comment content
 * Validates: Requirements 5.6, 5.7
 */
export function validateCommentContent(
  content: string
): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return {
      valid: false,
      error: "Comment content cannot be empty",
    }
  }

  if (content.length > 1000) {
    return {
      valid: false,
      error: "Comment content must not exceed 1000 characters",
    }
  }

  return { valid: true }
}
