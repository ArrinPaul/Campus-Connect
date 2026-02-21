/**
 * Shared mathematical utility functions for Convex backend modules.
 */

/**
 * Jaccard similarity coefficient for two string arrays.
 * Returns 0 when both arrays are empty.
 * Comparison is case-insensitive by default.
 *
 * @param a - First set of strings
 * @param b - Second set of strings
 * @param caseSensitive - If true, skips lowercasing (default: false)
 */
export function jaccardSimilarity(
  a: string[],
  b: string[],
  caseSensitive = false,
): number {
  const normalize = caseSensitive ? (s: string) => s : (s: string) => s.toLowerCase()
  const setA = new Set(a.map(normalize))
  const setB = new Set(b.map(normalize))
  if (setA.size === 0 && setB.size === 0) return 0
  const intersection = Array.from(setA).filter((x) => setB.has(x)).length
  const union = new Set(Array.from(setA).concat(Array.from(setB))).size
  return union === 0 ? 0 : intersection / union
}
