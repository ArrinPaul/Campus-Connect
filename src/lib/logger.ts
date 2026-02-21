/**
 * Structured logging utility for server-side and Convex functions.
 *
 * Provides consistent, JSON-formatted log output with:
 * - Log levels (debug, info, warn, error)
 * - Structured metadata (timestamps, context, request IDs)
 * - Environment-aware verbosity (debug only in development)
 * - Safe serialization (no circular references, PII masking)
 */

export type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  /** Unique request/operation identifier for tracing */
  requestId?: string
  /** The user ID performing the action */
  userId?: string
  /** Function or module name */
  source?: string
  /** Additional structured data */
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  environment: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function getMinLogLevel(): LogLevel {
  const env = process.env.NODE_ENV || "development"
  if (env === "production") return "info"
  return "debug"
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = getMinLogLevel()
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel]
}

/**
 * Masks potentially sensitive fields in log context.
 */
function maskSensitiveFields(context?: LogContext): LogContext | undefined {
  if (!context) return undefined

  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "apiKey",
    "authorization",
    "cookie",
    "ssn",
    "creditCard",
  ]

  const masked: LogContext = {}
  for (const [key, value] of Object.entries(context)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
      masked[key] = "[REDACTED]"
    } else {
      masked[key] = value
    }
  }
  return masked
}

function formatLogEntry(entry: LogEntry): string {
  try {
    return JSON.stringify(entry)
  } catch {
    // Fallback for circular references
    return JSON.stringify({
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp,
      error: "Failed to serialize log entry",
    })
  }
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    context: maskSensitiveFields(context),
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }
  }

  return entry
}

function emit(entry: LogEntry) {
  const formatted = formatLogEntry(entry)

  switch (entry.level) {
    case "debug":
      console.debug(formatted)
      break
    case "info":
      console.info(formatted)
      break
    case "warn":
      console.warn(formatted)
      break
    case "error":
      console.error(formatted)
      break
  }
}

// ─── Public Logger API ──────────────────────────────

export const logger = {
  debug(message: string, context?: LogContext) {
    if (!shouldLog("debug")) return
    emit(createLogEntry("debug", message, context))
  },

  info(message: string, context?: LogContext) {
    if (!shouldLog("info")) return
    emit(createLogEntry("info", message, context))
  },

  warn(message: string, context?: LogContext) {
    if (!shouldLog("warn")) return
    emit(createLogEntry("warn", message, context))
  },

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (!shouldLog("error")) return
    const err = error instanceof Error ? error : undefined
    emit(createLogEntry("error", message, context, err))
  },
}

/**
 * Creates a child logger with preset context fields.
 * Useful for module-scoped or request-scoped logging.
 *
 * @example
 * const log = createLogger({ source: "posts", requestId: "abc123" })
 * log.info("Post created", { postId: "xyz" })
 */
export function createLogger(baseContext: LogContext) {
  return {
    debug(message: string, context?: LogContext) {
      logger.debug(message, { ...baseContext, ...context })
    },
    info(message: string, context?: LogContext) {
      logger.info(message, { ...baseContext, ...context })
    },
    warn(message: string, context?: LogContext) {
      logger.warn(message, { ...baseContext, ...context })
    },
    error(message: string, error?: Error | unknown, context?: LogContext) {
      logger.error(message, error, { ...baseContext, ...context })
    },
  }
}

export default logger
