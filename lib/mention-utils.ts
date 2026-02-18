/**
 * Mention Utilities
 * Helper functions for extracting and parsing @mentions in posts/comments
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

/**
 * Parse content with mentions, converting them to an array of segments
 * Used for rendering mentions as clickable links in the UI
 * 
 * @param content - The text to parse
 * @returns Array of segments with type and content
 * 
 * @example
 * parseMentions("Hey @john how are you?")
 * // Returns: [
 * //   { type: "text", content: "Hey " },
 * //   { type: "mention", content: "john" },
 * //   { type: "text", content: " how are you?" }
 * // ]
 */
export interface ParsedSegment {
  type: 'text' | 'mention';
  content: string;
}

export function parseMentions(content: string): ParsedSegment[] {
  if (!content || typeof content !== 'string') {
    return [{ type: 'text', content: content || '' }];
  }

  const segments: ParsedSegment[] = [];
  let lastIndex = 0;

  // Create a new regex for each parse to reset lastIndex
  const regex = new RegExp(MENTION_REGEX.source, 'g');
  let match;

  while ((match = regex.exec(content)) !== null) {
    const mentionStart = match.index;
    const username = match[1];

    // Add text before the mention
    if (mentionStart > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, mentionStart)
      });
    }

    // Add the mention
    segments.push({
      type: 'mention',
      content: username
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after last mention
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex)
    });
  }

  // If no mentions found, return the whole content as text
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: content
    });
  }

  return segments;
}

/**
 * Check if a username is valid for mentions
 * @param username - The username to validate (without @ symbol)
 * @returns True if valid, false otherwise
 * 
 * @example
 * isValidMention("john_doe123") // true
 * isValidMention("john doe") // false
 * isValidMention("") // false
 */
export function isValidMention(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }

  // Must be 1-30 characters, alphanumeric and underscores only
  return /^[a-zA-Z0-9_]{1,30}$/.test(username);
}

/**
 * Get the display text for a mention
 * @param username - The username (without @ symbol)
 * @returns The display text with @ symbol
 * 
 * @example
 * getMentionDisplay("john") // "@john"
 */
export function getMentionDisplay(username: string): string {
  return `@${username}`;
}
