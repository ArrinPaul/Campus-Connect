/**
 * Shared validation constants (frontend copy).
 * Mirrors convex/validation_constants.ts — kept in sync manually.
 * Do NOT import from @/convex/validation_constants in frontend code;
 * import from this file instead to avoid pulling convex files into the
 * root TypeScript compilation unit.
 *
 * If you update convex/validation_constants.ts, update this file too.
 */

// ── Content length limits ────────────────────────────────────────────────────

export const POST_MAX_LENGTH = 5000
export const COMMENT_MAX_LENGTH = 2000
export const MESSAGE_MAX_LENGTH = 5000
export const BIO_MAX_LENGTH = 500
export const UNIVERSITY_MAX_LENGTH = 200
export const NAME_MAX_LENGTH = 100
export const SKILL_MAX_LENGTH = 50
export const NOTIFICATION_MAX_LENGTH = 500

// ── Search limits ────────────────────────────────────────────────────────────

export const SEARCH_QUERY_MAX_LENGTH = 200
export const SEARCH_RESULTS_MAX = 50      // max per-page
export const SEARCH_CANDIDATES_MAX = 200  // max rows scanned per query

// ── Collection limits ────────────────────────────────────────────────────────

export const MAX_SKILLS = 20
export const MAX_MEDIA_URLS = 10

// ── Feed / pagination ────────────────────────────────────────────────────────

export const FEED_PAGE_SIZE_DEFAULT = 20
export const FEED_PAGE_SIZE_MAX = 100
