/**
 * Hashtag utility functions for frontend parsing and rendering
 */

/**
 * Normalize hashtag by removing # and converting to lowercase
 */
export function normalizeHashtag(tag: string): string {
  return tag.toLowerCase().trim().replace(/^#/, "")
}

/**
 * Extract hashtags from content
 * Returns normalized hashtags (lowercase, without #)
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g
  const matches = content.matchAll(hashtagRegex)
  const hashtags = Array.from(matches, (match) => match[1].toLowerCase())
  // Remove duplicates
  return Array.from(new Set(hashtags))
}

/**
 * Split content into segments: text and hashtags
 * Returns array of segments with type and content
 */
export function parseHashtags(content: string): Array<{
  type: "text" | "hashtag"
  content: string
  tag?: string // normalized tag for hashtags
}> {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g
  const segments: Array<{
    type: "text" | "hashtag"
    content: string
    tag?: string
  }> = []
  
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = hashtagRegex.exec(content)) !== null) {
    // Add text before the hashtag
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: content.substring(lastIndex, match.index),
      })
    }

    // Add the hashtag
    segments.push({
      type: "hashtag",
      content: match[0], // includes the #
      tag: match[1].toLowerCase(), // normalized tag without #
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      content: content.substring(lastIndex),
    })
  }

  // If no hashtags found, return entire content as text
  if (segments.length === 0) {
    segments.push({
      type: "text",
      content,
    })
  }

  return segments
}

/**
 * Check if a string is a valid hashtag
 */
export function isValidHashtag(tag: string): boolean {
  const hashtagRegex = /^[a-zA-Z0-9_]+$/
  return hashtagRegex.test(tag)
}

/**
 * Get hashtag display text (with #)
 */
export function getHashtagDisplay(tag: string): string {
  return `#${normalizeHashtag(tag)}`
}
