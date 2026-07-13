import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"

const log = createLogger("api-error")

/**
 * Returns a safe 500 response that never leaks internal error details.
 * Logs the real error server-side for debugging.
 */
export function internalError(err: unknown, context?: string): NextResponse {
  const message = err instanceof Error ? err.message : "Unknown error"
  if (context) {
    log.error(`${context}: ${message}`, err)
  } else {
    log.error(message, err)
  }
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  )
}
