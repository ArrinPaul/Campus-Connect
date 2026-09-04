import { NextResponse } from "next/server"
import type { ZodType } from "zod"

/**
 * Parses and validates a request body against a Zod schema.
 * Returns { data } on success, or { response } — a ready-to-return 400 —
 * on failure, so callers can `if ("response" in result) return result.response`.
 */
export async function parseBody<T>(
  req: Request,
  schema: ZodType<T>
): Promise<{ data: T } | { response: NextResponse }> {
  const raw = await req.json().catch(() => null)
  if (raw === null) {
    return { response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }))
    return { response: NextResponse.json({ error: "Validation failed", issues }, { status: 400 }) }
  }

  return { data: result.data }
}
