/**
 * Sanitizes text input to prevent XSS attacks
 * Removes script tags, event handlers, and other potentially malicious content
 * This is a simple regex-based approach that works in Convex environment
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
  
  // Remove self-closing object and embed tags
  sanitized = sanitized.replace(/<(object|embed)\b[^>]*\/?>/gi, '');
  
  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove link tags (can load external stylesheets with XSS)
  sanitized = sanitized.replace(/<link\b[^>]*>/gi, '');
  
  // Remove meta tags
  sanitized = sanitized.replace(/<meta\b[^>]*>/gi, '');
  
  return sanitized;
}
