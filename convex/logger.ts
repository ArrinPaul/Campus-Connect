/**
 * Structured logger for Convex backend functions.
 *
 * Convex captures all console.* output in its dashboard logs.
 * This wrapper emits a consistent JSON payload on every log line so logs can
 * be parsed, filtered, and exported to an aggregation service (Datadog,
 * Logtail, etc.) via Convex log streams.
 *
 * Usage:
 *   import { createLogger } from "../convex/logger"
 *   const log = createLogger("users")
 *   log.info("User created", { userId, clerkId })
 *   log.error("User not found", { clerkId })
 */

export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogContext {
  [key: string]: unknown
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
}

// ─── Log Level Filtering ─────────────────────────────────────────────────────

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Get the minimum log level from environment.
 * In production, defaults to "info" (skips debug).
 * In development, defaults to "debug" (shows everything).
 */
function getMinLogLevel(): LogLevel {
  const envLevel = (typeof process !== "undefined" ? process.env.LOG_LEVEL : undefined) as LogLevel | undefined
  if (envLevel && LOG_LEVEL_PRIORITY[envLevel] !== undefined) return envLevel
  // Default: skip debug in production
  const nodeEnv = typeof process !== "undefined" ? process.env.NODE_ENV : undefined
  return nodeEnv === "production" ? "info" : "debug"
}

// ─── Core emit ───────────────────────────────────────────────────────────────

function emit(
  level: LogLevel,
  scope: string,
  message: string,
  context?: LogContext
): void {
  // Skip logs below the configured minimum level
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[getMinLogLevel()]) return

  const payload = JSON.stringify({
    level,
    scope,
    message,
    timestamp: new Date().toISOString(),
    ...(context ?? {}),
  })

  switch (level) {
    case "error":
      console.error(payload)
      break
    case "warn":
      console.warn(payload)
      break
    case "debug":
      // eslint-disable-next-line no-console
      console.log(payload)
      break
    default:
      // eslint-disable-next-line no-console
      console.log(payload)
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a scoped logger for a Convex module.
 *
 * @param scope  Convex module name, e.g. "users", "posts", "http/webhooks"
 */
export function createLogger(scope: string): Logger {
  return {
    debug(message, context) { emit("debug", scope, message, context) },
    info(message, context)  { emit("info",  scope, message, context) },
    warn(message, context)  { emit("warn",  scope, message, context) },
    error(message, context) { emit("error", scope, message, context) },
  }
}
