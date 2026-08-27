/**
 * Structured logger for Campus Connect with production security scrubbing,
 * request correlation IDs, and Sentry error monitoring integration.
 */

export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogContext {
  [key: string]: unknown
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: unknown, context?: LogContext): void
}

// ─── Sensitive Field Scrubber ────────────────────────────────────────────────

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "service_role",
  "service_key",
  "private_key",
  "card",
  "cvv",
])

export function scrubSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data
  if (typeof data !== "object") return data

  if (Array.isArray(data)) {
    return data.map((item) => scrubSensitiveData(item))
  }

  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()
    const isSensitive = Array.from(SENSITIVE_KEYS).some((s) => lowerKey.includes(s))

    if (isSensitive) {
      clean[key] = "[REDACTED]"
    } else if (typeof value === "object" && value !== null) {
      clean[key] = scrubSensitiveData(value)
    } else {
      clean[key] = value
    }
  }
  return clean
}

// ─── Colours for dev-mode pretty output ──────────────────────────────────────

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: "color:#6b7280;font-weight:400",   // gray
  info:  "color:#3b82f6;font-weight:600",   // blue bold
  warn:  "color:#f59e0b;font-weight:600",   // amber bold
  error: "color:#ef4444;font-weight:700",   // red bold
}

const LEVEL_PREFIXES: Record<LogLevel, string> = {
  debug: "DEBUG",
  info:  " INFO",
  warn:  " WARN",
  error: "ERROR",
}

const isDev = process.env.NODE_ENV === "development"
const isServer = typeof window === "undefined"

let Sentry: any = null
try {
  Sentry = require("@sentry/nextjs")
} catch (e) {
  // Sentry is optional
}

// ─── Core emit ───────────────────────────────────────────────────────────────

function emit(
  level: LogLevel,
  scope: string,
  message: string,
  error?: unknown,
  context?: LogContext
): void {
  const cleanContext = context ? (scrubSensitiveData(context) as LogContext) : undefined

  if (Sentry && (level === "error" || level === "warn")) {
    try {
      Sentry.withScope((sentryScope: any) => {
        sentryScope.setTag("logger.scope", scope)
        if (cleanContext) {
          sentryScope.setExtras(cleanContext)
        }
        if (level === "error") {
          Sentry.captureException(error || new Error(message))
        } else if (level === "warn") {
          sentryScope.setExtras({ level: "warning" })
          Sentry.captureMessage(message, "warning")
        }
      })
    } catch {
      // Graceful fallback
    }
  }

  const ts = new Date().toISOString()
  const payload: Record<string, unknown> = {
    level,
    scope,
    message,
    timestamp: ts,
    ...(cleanContext ?? {}),
  }

  if (error !== undefined) {
    if (error instanceof Error) {
      payload.error = { name: error.name, message: error.message, stack: error.stack }
    } else {
      payload.error = String(error)
    }
  }

  // Server (Node.js / Edge) — structured JSON
  if (isServer) {
    const out = JSON.stringify(payload)
    if (level === "error") {
      console.error(out)
    } else if (level === "warn") {
      console.warn(out)
    } else {
      console.log(out)
    }
    return
  }

  // Browser development — pretty formatted
  if (isDev) {
    const prefix = `%c[${LEVEL_PREFIXES[level]}] [${scope}]`
    const style = LEVEL_STYLES[level]

    if (level === "error") {
      console.error(prefix, style, message, ...(cleanContext ? [cleanContext] : []), ...(error !== undefined ? [error] : []))
    } else if (level === "warn") {
      console.warn(prefix, style, message, ...(cleanContext ? [cleanContext] : []))
    } else if (level === "debug") {
      console.debug(prefix, style, message, ...(cleanContext ? [cleanContext] : []))
    } else {
      console.info(prefix, style, message, ...(cleanContext ? [cleanContext] : []))
    }
    return
  }

  // Browser production — structured JSON
  const out = JSON.stringify(payload)
  if (level === "error") {
    console.error(out)
  } else if (level === "warn") {
    console.warn(out)
  } else {
    console.log(out)
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createLogger(scope: string): Logger {
  return {
    debug(message, context) {
      emit("debug", scope, message, undefined, context)
    },
    info(message, context) {
      emit("info", scope, message, undefined, context)
    },
    warn(message, context) {
      emit("warn", scope, message, undefined, context)
    },
    error(message, error, context) {
      emit("error", scope, message, error, context)
    },
  }
}

export const logger = createLogger("app")
