/**
 * @jest-environment node
 */
import { scrubSensitiveData, createLogger } from "@/lib/logger"
import { analytics } from "@/lib/analytics"

describe("Phase 7 — P7-01 Production Observability & Scrubbing", () => {
  describe("Sensitive Data Scrubber", () => {
    it("should redact passwords, tokens, API keys, and service secrets recursively", () => {
      const dirtyContext = {
        userId: "user-123",
        email: "student@harvard.edu",
        password: "SuperSecretPassword123!",
        userToken: "jwt.header.payload.signature",
        stripeApiKey: "sk_live_998877",
        nested: {
          apiKey: "sk-proj-xyz",
          service_role: "secret_admin_key",
          regularField: "safe_public_value",
        },
        list: [
          { creditCard: "4111-2222-3333-4444" },
          { safeItem: 123 },
        ],
      }

      const clean: any = scrubSensitiveData(dirtyContext)

      expect(clean.userId).toBe("user-123")
      expect(clean.email).toBe("student@harvard.edu")
      expect(clean.password).toBe("[REDACTED]")
      expect(clean.userToken).toBe("[REDACTED]")
      expect(clean.stripeApiKey).toBe("[REDACTED]")
      expect(clean.nested.apiKey).toBe("[REDACTED]")
      expect(clean.nested.service_role).toBe("[REDACTED]")
      expect(clean.nested.regularField).toBe("safe_public_value")
      expect(clean.list[0].creditCard).toBe("[REDACTED]")
      expect(clean.list[1].safeItem).toBe(123)
    })
  })

  describe("Logger Factory", () => {
    it("should create scoped logger emitting sanitized log payloads", () => {
      const log = createLogger("TestScope")
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {})

      log.info("Student action recorded", {
        studentId: "s-1",
        sessionToken: "secret_session_token",
      })

      expect(consoleSpy).toHaveBeenCalled()
      const loggedJson = JSON.parse(consoleSpy.mock.calls[0][0])
      expect(loggedJson.scope).toBe("TestScope")
      expect(loggedJson.studentId).toBe("s-1")
      expect(loggedJson.sessionToken).toBe("[REDACTED]")

      consoleSpy.mockRestore()
    })
  })

  describe("Analytics Abstraction", () => {
    it("should handle event tracking without throwing in node or browser environments", () => {
      expect(() => {
        analytics.track("post_created", { postId: "p-1", title: "Study group meetup" })
        analytics.identify("u-1", { name: "Alice" })
        analytics.reset()
      }).not.toThrow()
    })
  })
})
