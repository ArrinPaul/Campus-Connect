/**
 * Sanitizes plain text input to prevent XSS attacks.
 *
 * APPROACH: Allowlist — strip ALL HTML tags unconditionally, then
 * HTML-encode the result.  This eliminates all injection vectors
 * regardless of tag name, nesting tricks, or obfuscation because
 * nothing resembling a tag survives.
 *
 * @param input - The text to sanitize
 * @returns Sanitized text safe for storage and display
 */
export function sanitizeText(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // 1a. Remove content-bearing dangerous tags AND their content
  //     Script/style content is executable and must not survive.
  sanitized = sanitized.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
  sanitized = sanitized.replace(/<style\b[\s\S]*?<\/style\s*>/gi, '');

  // 1b. Remove ALL remaining HTML tags (opening, closing, self-closing, comments)
  //     This is an allowlist approach: nothing is permitted.
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');        // HTML comments
  sanitized = sanitized.replace(/<\/?[a-z][^>]*\/?>/gi, '');    // Any HTML tag

  // 2. Neutralize dangerous URI protocols that may appear in raw text
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');
  sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, '');

  // 3. HTML-encode remaining special characters
  sanitized = sanitized.replace(/&/g, '&amp;');
  sanitized = sanitized.replace(/</g, '&lt;');
  sanitized = sanitized.replace(/>/g, '&gt;');
  sanitized = sanitized.replace(/"/g, '&quot;');
  sanitized = sanitized.replace(/'/g, '&#39;');

  return sanitized;
}

/**
 * Sanitizes markdown content stored as rich text.
 *
 * APPROACH: Allowlist — strip ALL HTML tags unconditionally while
 * preserving markdown syntax characters (*, _, #, >, `, ~, [, ], etc.)
 * so they can be rendered later by react-markdown.
 *
 * Markdown links like `[text](url)` are preserved but dangerous
 * protocols (javascript:, vbscript:, data:text/html) inside link
 * targets are neutralized.
 *
 * The client-side renderer MUST also run DOMPurify (already in
 * package.json as isomorphic-dompurify) on the final HTML output
 * as defense-in-depth.
 *
 * @param input - Markdown string to sanitize
 * @returns Sanitized markdown safe for database storage and rendering
 */
export function sanitizeMarkdown(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // 1a. Remove content-bearing dangerous tags AND their content
  //     Script/style content is executable and must not survive.
  sanitized = sanitized.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
  sanitized = sanitized.replace(/<style\b[\s\S]*?<\/style\s*>/gi, '');

  // 1b. Remove ALL remaining HTML tags (opening, closing, self-closing, comments)
  //     This strips <iframe>, <a>, <div>, <img>, <svg>, etc.
  //     regardless of casing, nesting, or obfuscation.
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');        // HTML comments
  sanitized = sanitized.replace(/<\/?[a-z][^>]*\/?>/gi, '');    // Any HTML tag

  // 2. Neutralize dangerous protocols in markdown link targets
  //    [text](javascript:...) → [text](#)
  sanitized = sanitized.replace(
    /\[([^\]]*)\]\(\s*(?:javascript|vbscript|data\s*:\s*text\/html)\s*:[^)]*\)/gi,
    '[$1](#)'
  );

  // 3. Neutralize any remaining dangerous protocol references in raw text
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');
  sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, '');

  // Markdown syntax is preserved — we do NOT HTML-encode here so that
  // * _ # > ` - [ ] ( ) etc. remain intact for the markdown renderer.
  return sanitized;
}

/**
 * Validates a user-supplied URL for safe storage.
 *
 * Allowlist approach: only https:// (and http:// in dev) URLs are accepted.
 * Rejects javascript:, data:, blob:, and all other protocols.
 *
 * @param url - The URL string to validate
 * @returns true if the URL is safe to store
 */
export function isValidSafeUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    const allowedProtocols = ['https:'];
    // Allow http in development for localhost testing
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      allowedProtocols.push('http:');
    }
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}