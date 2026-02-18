/**
 * Mention Utilities for Convex Backend
 * Helper functions for extracting @mentions in posts/comments
 */

/**
 * Regular expression to match @username mentions
 * Matches: @username, @user_name, @user123
 * Must start with @ and contain alphanumeric characters, underscores
 * Must be at least 1 character after the @
 */
export const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

/**
 * Extract all unique mentions from text content
 * @param content - The text to extract mentions from
 * @returns Array of unique usernames (without @ symbol)
 * 
 * @example
 * extractMentions("Hey @john and @jane!")
 * // Returns: ["john", "jane"]
 */
export function extractMentions(content: string): string[] {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const mentions: string[] = [];
  const matches = Array.from(content.matchAll(MENTION_REGEX));

  for (const match of matches) {
    const username = match[1];
    // Add only unique mentions
    if (username && !mentions.includes(username)) {
      mentions.push(username);
    }
  }

  return mentions;
}
