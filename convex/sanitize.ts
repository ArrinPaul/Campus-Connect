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
  
  // Remove img tags (can trigger onerror XSS)
  sanitized = sanitized.replace(/<img\b[^>]*\/?>/gi, '');
  
  // Remove svg tags and their content (can contain scripts)
  sanitized = sanitized.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  sanitized = sanitized.replace(/<svg\b[^>]*\/?>/gi, '');
  
  // Remove form tags (phishing vector)
  sanitized = sanitized.replace(/<\/?form\b[^>]*>/gi, '');
  sanitized = sanitized.replace(/<(input|button|textarea|select)\b[^>]*\/?>/gi, '');
  
  // Remove base tags (can redirect all relative URLs)
  sanitized = sanitized.replace(/<base\b[^>]*\/?>/gi, '');
  
  // HTML-encode remaining special characters to prevent injection
  sanitized = sanitized.replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, '&amp;');
  sanitized = sanitized.replace(/</g, '&lt;');
  sanitized = sanitized.replace(/>/g, '&gt;');
  sanitized = sanitized.replace(/"/g, '&quot;');
  sanitized = sanitized.replace(/'/g, '&#39;');
  
  return sanitized;
}
/**
 * Sanitizes markdown content stored as rich text.
 *
 * Unlike `sanitizeText`, this function preserves markdown syntax characters
 * (*, _, #, >, `, ~, [, ], etc.) so they can be rendered later by a
 * markdown renderer like react-markdown.  It still strips XSS injection
 * vectors: <script>, <iframe>, event handlers, and javascript: protocols.
 *
 * @param input - Markdown string to sanitize
 * @returns Sanitized markdown string safe for database storage and react-markdown rendering
 */
export function sanitizeMarkdown(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handler attributes
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: and vbscript: protocols (used in markdown links)
  sanitized = sanitized.replace(/\[([^\]]*)\]\(javascript:[^)]*\)/gi, '[$1](#)');
  sanitized = sanitized.replace(/\[([^\]]*)\]\(vbscript:[^)]*\)/gi, '[$1](#)');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');

  // Remove data: protocol HTML injections
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove object and embed tags
  sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');
  sanitized = sanitized.replace(/<(object|embed)\b[^>]*\/?>/gi, '');

  // Remove style and link tags (external stylesheet injection)
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  sanitized = sanitized.replace(/<link\b[^>]*>/gi, '');

  // Remove meta and base tags
  sanitized = sanitized.replace(/<meta\b[^>]*>/gi, '');
  sanitized = sanitized.replace(/<base\b[^>]*\/?>/gi, '');

  // Preserve markdown — do NOT HTML-encode remaining characters so that
  // markdown syntax (* _ # > ` - [ ] etc.) is stored and rendered intact.
  return sanitized;
}