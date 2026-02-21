/**
 * Structured logger for the Next.js frontend.
 *
 * - Development: pretty colour-coded console output
 * - Production:  errors/warns sent to Sentry; all levels emit structured JSON
 *
 * Usage:
 *   import { createLogger } from "@/lib/logger"
 *   const log = createLogger("PostCard")
 *   log.info("Post deleted", { postId })
 *   log.error("Failed to delete post", error, { postId })
 */

import * as Sentry from "@sentry/nextjs"

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

// ─── Core emit ───────────────────────────────────────────────────────────────

function emit(
  level: LogLevel,
  scope: string,
  message: string,
  error?: unknown,
  context?: LogContext
): void {
  const ts = new Date().toISOString()
  const payload: Record<string, unknown> = {
    level,
    scope,
    message,
    timestamp: ts,
    ...(context ?? {}),
  }

  if (error !== undefined) {
    if (error instanceof Error) {
      payload.error = { name: error.name, message: error.message, stack: error.stack }
    } else {
      payload.error = String(error)
    }
  }

  // ── Server (Node.js / Edge) — always structured JSON ──────────────────────
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

  // ── Browser development — pretty formatted ────────────────────────────────
  if (isDev) {
    const prefix = `%c[${LEVEL_PREFIXES[level]}] [${scope}]`
    const style = LEVEL_STYLES[level]

    if (level === "error") {
      console.error(prefix, style, message, ...(context ? [context] : []), ...(error !== undefined ? [error] : []))
    } else if (level === "warn") {
      console.warn(prefix, style, message, ...(context ? [context] : []))
    } else if (level === "debug") {
      console.debug(prefix, style, message, ...(context ? [context] : []))
    } else {
      console.info(prefix, style, message, ...(context ? [context] : []))
    }
    return
  }

  // ── Browser production — structured JSON + Sentry for error/warn ──────────
  const out = JSON.stringify(payload)
  if (level === "error") {
    console.error(out)
    Sentry.withScope((scope_) => {
      scope_.setTag("scope", scope)
      scope_.setExtras(context ?? {})
      if (error instanceof Error) {
        Sentry.captureException(error)
      } else {
        Sentry.captureMessage(message, "error")
      }
    })
  } else if (level === "warn") {
    console.warn(out)
    Sentry.withScope((scope_) => {
      scope_.setTag("scope", scope)
      scope_.setExtras(context ?? {})
      Sentry.captureMessage(message, "warning")
    })
  } else {
    console.log(out)
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a scoped logger. The scope name appears in every log line and as a
 * Sentry tag for easy filtering.
 *
 * @param scope  Module/component name, e.g. "PostCard", "auth/webhook"
 */
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

// ─── Default app-level logger ─────────────────────────────────────────────────

export const logger = createLogger("app")
