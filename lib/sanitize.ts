/**
 * Sanitizes text input to prevent XSS attacks
 * Removes script tags, event handlers, and other potentially malicious content
 * This is a simple regex-based approach that works in any JavaScript environment
 * @param input - The text to sanitize
 * @returns Sanitized text safe for storage and display
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  let sanitized = input;
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove object and embed tags
  sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');
  
  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  return sanitized;
}

/**
 * Sanitizes HTML content while allowing safe formatting tags
 * @param input - The HTML to sanitize
 * @returns Sanitized HTML safe for display
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  // First apply text sanitization to remove dangerous content
  let sanitized = sanitizeText(input);
  
  // Remove all HTML tags except safe formatting tags
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br'];
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  
  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // Keep only the tag name, remove all attributes
      return match.replace(/\s+[a-z][a-z0-9-]*\s*=\s*["'][^"']*["']/gi, '');
    }
    return ''; // Remove disallowed tags
  });
  
  return sanitized;
}
