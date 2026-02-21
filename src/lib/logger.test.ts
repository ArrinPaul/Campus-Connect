import { logger, createLogger } from "./logger"

describe("logger", () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.spyOn(console, "debug").mockImplementation()
    jest.spyOn(console, "info").mockImplementation()
    jest.spyOn(console, "warn").mockImplementation()
    jest.spyOn(console, "error").mockImplementation()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    jest.restoreAllMocks()
  })

  describe("log levels", () => {
    it("should log info messages", () => {
      logger.info("test message")
      expect(console.info).toHaveBeenCalledTimes(1)
      const logged = JSON.parse((console.info as jest.Mock).mock.calls[0][0])
      expect(logged.level).toBe("info")
      expect(logged.message).toBe("test message")
      expect(logged.timestamp).toBeDefined()
    })

    it("should log warn messages", () => {
      logger.warn("warning message")
      expect(console.warn).toHaveBeenCalledTimes(1)
      const logged = JSON.parse((console.warn as jest.Mock).mock.calls[0][0])
      expect(logged.level).toBe("warn")
    })

    it("should log error messages with Error objects", () => {
      const error = new Error("test error")
      logger.error("something failed", error)
      expect(console.error).toHaveBeenCalledTimes(1)
      const logged = JSON.parse((console.error as jest.Mock).mock.calls[0][0])
      expect(logged.level).toBe("error")
      expect(logged.error.name).toBe("Error")
      expect(logged.error.message).toBe("test error")
    })

    it("should log debug messages in development", () => {
      process.env.NODE_ENV = "development"
      logger.debug("debug message")
      expect(console.debug).toHaveBeenCalledTimes(1)
    })

    it("should suppress debug messages in production", () => {
      process.env.NODE_ENV = "production"
      logger.debug("debug message")
      expect(console.debug).not.toHaveBeenCalled()
    })
  })

  describe("context", () => {
    it("should include structured context", () => {
      logger.info("user action", { userId: "user123", source: "posts" })
      const logged = JSON.parse((console.info as jest.Mock).mock.calls[0][0])
      expect(logged.context.userId).toBe("user123")
      expect(logged.context.source).toBe("posts")
    })

    it("should mask sensitive fields", () => {
      logger.info("auth event", {
        userId: "user123",
        password: "secret123",
        apiKey: "sk-12345",
        token: "jwt-token",
      })
      const logged = JSON.parse((console.info as jest.Mock).mock.calls[0][0])
      expect(logged.context.userId).toBe("user123")
      expect(logged.context.password).toBe("[REDACTED]")
      expect(logged.context.apiKey).toBe("[REDACTED]")
      expect(logged.context.token).toBe("[REDACTED]")
    })
  })

  describe("createLogger", () => {
    it("should create child logger with base context", () => {
      const log = createLogger({ source: "test-module", requestId: "req-1" })
      log.info("child message", { extra: "data" })
      const logged = JSON.parse((console.info as jest.Mock).mock.calls[0][0])
      expect(logged.context.source).toBe("test-module")
      expect(logged.context.requestId).toBe("req-1")
      expect(logged.context.extra).toBe("data")
    })

    it("should override base context with call-specific context", () => {
      const log = createLogger({ source: "module-a" })
      log.info("overridden", { source: "module-b" })
      const logged = JSON.parse((console.info as jest.Mock).mock.calls[0][0])
      expect(logged.context.source).toBe("module-b")
    })
  })

  describe("output format", () => {
    it("should output valid JSON", () => {
      logger.info("json test")
      const output = (console.info as jest.Mock).mock.calls[0][0]
      expect(() => JSON.parse(output)).not.toThrow()
    })

    it("should include environment field", () => {
      logger.info("env test")
      const logged = JSON.parse((console.info as jest.Mock).mock.calls[0][0])
      expect(logged.environment).toBeDefined()
    })

    it("should include ISO timestamp", () => {
      logger.info("timestamp test")
      const logged = JSON.parse((console.info as jest.Mock).mock.calls[0][0])
      expect(new Date(logged.timestamp).toISOString()).toBe(logged.timestamp)
    })
  })
})
