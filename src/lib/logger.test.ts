/**
 * Tests for src/lib/logger.ts
 * Verifies structured output, log levels, scoping, and Sentry integration.
 */

// Mock Sentry before importing logger
const mockCaptureException = jest.fn()
const mockCaptureMessage = jest.fn()
const mockWithScope = jest.fn((cb: (scope: any) => void) => {
  cb({ setTag: jest.fn(), setExtras: jest.fn() })
})

jest.mock("@sentry/nextjs", () => ({
  withScope: (cb: (scope: any) => void) => mockWithScope(cb),
  captureException: (e: unknown) => mockCaptureException(e),
  captureMessage: (m: string, l: string) => mockCaptureMessage(m, l),
}))

import { createLogger, logger } from "@/lib/logger"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const spyConsoleLog   = jest.spyOn(console, "log").mockImplementation(() => {})
const spyConsoleInfo  = jest.spyOn(console, "info").mockImplementation(() => {})
const spyConsoleWarn  = jest.spyOn(console, "warn").mockImplementation(() => {})
const spyConsoleError = jest.spyOn(console, "error").mockImplementation(() => {})

afterEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  spyConsoleLog.mockRestore()
  spyConsoleInfo.mockRestore()
  spyConsoleWarn.mockRestore()
  spyConsoleError.mockRestore()
})

// ─── Server-side behaviour (NODE_ENV=test → isServer may be false in jsdom) ──
// Jest runs with NODE_ENV=test (not "development"), and jsdom has a window object.
// So the logger takes the "browser production" code path:
//   info/debug → console.log(JSON string)
//   warn       → console.warn(JSON string)
//   error      → console.error(JSON string) + Sentry

describe("createLogger", () => {
  it("returns a logger with debug/info/warn/error methods", () => {
    const log = createLogger("test")
    expect(typeof log.debug).toBe("function")
    expect(typeof log.info).toBe("function")
    expect(typeof log.warn).toBe("function")
    expect(typeof log.error).toBe("function")
  })

  it("different scopes produce independent loggers", () => {
    const a = createLogger("ModuleA")
    const b = createLogger("ModuleB")
    expect(a).not.toBe(b)
  })
})

describe("logger output — production browser path (NODE_ENV=test)", () => {
  it("debug calls console.log with JSON", () => {
    const log = createLogger("Dev")
    log.debug("hello debug")
    expect(spyConsoleLog).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(spyConsoleLog.mock.calls[0][0])
    expect(parsed.level).toBe("debug")
    expect(parsed.message).toBe("hello debug")
  })

  it("info calls console.log with JSON", () => {
    const log = createLogger("Dev")
    log.info("hello info")
    expect(spyConsoleLog).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(spyConsoleLog.mock.calls[0][0])
    expect(parsed.level).toBe("info")
    expect(parsed.message).toBe("hello info")
  })

  it("warn calls console.warn with JSON", () => {
    const log = createLogger("Dev")
    log.warn("something suspicious", { key: "val" })
    expect(spyConsoleWarn).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(spyConsoleWarn.mock.calls[0][0])
    expect(parsed.level).toBe("warn")
    expect(parsed.key).toBe("val")
  })

  it("error calls console.error with JSON", () => {
    const log = createLogger("Dev")
    log.error("boom", new Error("test"), { extra: 1 })
    expect(spyConsoleError).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(spyConsoleError.mock.calls[0][0])
    expect(parsed.level).toBe("error")
    expect(parsed.message).toBe("boom")
  })

  it("embeds scope in the JSON payload", () => {
    const log = createLogger("MyScope")
    log.info("msg")
    const parsed = JSON.parse(spyConsoleLog.mock.calls[0][0])
    expect(parsed.scope).toBe("MyScope")
  })

  it("embeds context fields in the JSON payload", () => {
    const log = createLogger("Ctx")
    log.info("with context", { userId: "abc123" })
    const parsed = JSON.parse(spyConsoleLog.mock.calls[0][0])
    expect(parsed.userId).toBe("abc123")
  })

  it("serialises Error instances into error.message and error.stack", () => {
    const log = createLogger("Err")
    const err = new Error("oops")
    log.error("failed", err)
    const parsed = JSON.parse(spyConsoleError.mock.calls[0][0])
    expect(parsed.error.message).toBe("oops")
    expect(typeof parsed.error.stack).toBe("string")
  })

  it("serialises non-Error values as a string", () => {
    const log = createLogger("Err")
    log.error("failed", "string error")
    const parsed = JSON.parse(spyConsoleError.mock.calls[0][0])
    expect(parsed.error).toBe("string error")
  })

  it("error triggers Sentry.withScope", () => {
    const log = createLogger("Sentry")
    log.error("sentry test", new Error("sentry"))
    expect(mockWithScope).toHaveBeenCalledTimes(1)
  })

  it("warn triggers Sentry.captureMessage", () => {
    const log = createLogger("Sentry")
    log.warn("warn test")
    expect(mockWithScope).toHaveBeenCalledTimes(1)
    expect(mockCaptureMessage).toHaveBeenCalledWith("warn test", "warning")
  })

  it("includes a timestamp string in payload", () => {
    const log = createLogger("Ts")
    log.info("has timestamp")
    const parsed = JSON.parse(spyConsoleLog.mock.calls[0][0])
    expect(typeof parsed.timestamp).toBe("string")
    expect(new Date(parsed.timestamp).getTime()).toBeGreaterThan(0)
  })
})

describe("default logger export", () => {
  it("has scope 'app'", () => {
    logger.info("default logger works")
    const parsed = JSON.parse(spyConsoleLog.mock.calls[0][0])
    expect(parsed.scope).toBe("app")
  })
})

describe("convex logger (server-side style)", () => {
  // We test the Convex logger separately — it always emits JSON
  it("emits JSON to console.log for info", () => {
    const { createLogger: createConvexLogger } = require("../../convex/logger")
    const log = createConvexLogger("users")

    log.info("User created", { userId: "u1", clerkId: "clerk123" })

    expect(spyConsoleLog).toHaveBeenCalledTimes(1)
    const raw = spyConsoleLog.mock.calls[0][0]
    const parsed = JSON.parse(raw)
    expect(parsed.level).toBe("info")
    expect(parsed.scope).toBe("users")
    expect(parsed.message).toBe("User created")
    expect(parsed.userId).toBe("u1")
    expect(parsed.timestamp).toBeDefined()
  })

  it("emits JSON to console.error for error level", () => {
    const { createLogger: createConvexLogger } = require("../../convex/logger")
    const log = createConvexLogger("http/webhooks")

    log.error("Webhook failed", { reason: "bad sig" })

    expect(spyConsoleError).toHaveBeenCalledTimes(1)
    const raw = spyConsoleError.mock.calls[0][0]
    const parsed = JSON.parse(raw)
    expect(parsed.level).toBe("error")
    expect(parsed.reason).toBe("bad sig")
  })

  it("emits JSON to console.warn for warn level", () => {
    const { createLogger: createConvexLogger } = require("../../convex/logger")
    const log = createConvexLogger("users")

    log.warn("Missing optional field", { field: "bio" })

    expect(spyConsoleWarn).toHaveBeenCalledTimes(1)
    const raw = spyConsoleWarn.mock.calls[0][0]
    const parsed = JSON.parse(raw)
    expect(parsed.level).toBe("warn")
  })

  it("includes all context fields in the JSON payload", () => {
    const { createLogger: createConvexLogger } = require("../../convex/logger")
    const log = createConvexLogger("posts")

    log.info("Post created", { postId: "p1", authorId: "u2", topic: "AI" })

    const parsed = JSON.parse(spyConsoleLog.mock.calls[0][0])
    expect(parsed.postId).toBe("p1")
    expect(parsed.authorId).toBe("u2")
    expect(parsed.topic).toBe("AI")
  })
})
