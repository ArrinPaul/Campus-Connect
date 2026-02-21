/**
 * @jest-environment node
 */
import {
  generateCsrfToken,
  validateOrigin,
  validateCsrfToken,
  checkCsrf,
} from "./csrf"
import { NextRequest } from "next/server"

// Helper to create mock NextRequest
function createRequest(
  url: string,
  options?: {
    method?: string
    headers?: Record<string, string>
    cookies?: Record<string, string>
  }
): NextRequest {
  const req = new NextRequest(url, {
    method: options?.method ?? "GET",
    headers: options?.headers,
  })

  // We can't easily set cookies on NextRequest, so we test validateCsrfToken
  // logic separately using the request headers
  return req
}

describe("CSRF Protection", () => {
  describe("generateCsrfToken", () => {
    it("should generate a 64-character hex string", () => {
      const token = generateCsrfToken()
      expect(token).toMatch(/^[0-9a-f]{64}$/)
    })

    it("should generate unique tokens", () => {
      const tokens = new Set(
        Array.from({ length: 100 }, () => generateCsrfToken())
      )
      expect(tokens.size).toBe(100)
    })
  })

  describe("validateOrigin", () => {
    it("should allow same-origin requests (no origin header)", () => {
      const req = createRequest("http://localhost:3000/api/test")
      expect(validateOrigin(req)).toBe(true)
    })

    it("should allow requests from the same origin", () => {
      const req = createRequest("http://localhost:3000/api/test", {
        headers: { origin: "http://localhost:3000" },
      })
      expect(validateOrigin(req)).toBe(true)
    })

    it("should reject requests from unknown origins in production", () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = "production"

      const req = createRequest("https://campus-connect.vercel.app/api/test", {
        headers: { origin: "https://evil.com" },
      })
      const result = validateOrigin(req)

      process.env.NODE_ENV = originalEnv
      expect(result).toBe(false)
    })

    it("should allow production domain", () => {
      const req = createRequest(
        "https://campus-connect.vercel.app/api/test",
        {
          headers: { origin: "https://campus-connect.vercel.app" },
        }
      )
      expect(validateOrigin(req)).toBe(true)
    })
  })

  describe("checkCsrf", () => {
    it("should allow GET requests through", () => {
      const req = createRequest("http://localhost:3000/api/test", {
        method: "GET",
      })
      expect(checkCsrf(req)).toBeNull()
    })

    it("should allow HEAD requests through", () => {
      const req = createRequest("http://localhost:3000/api/test", {
        method: "HEAD",
      })
      expect(checkCsrf(req)).toBeNull()
    })

    it("should allow OPTIONS requests through", () => {
      const req = createRequest("http://localhost:3000/api/test", {
        method: "OPTIONS",
      })
      expect(checkCsrf(req)).toBeNull()
    })

    it("should reject POST from unknown origin", () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = "production"

      const req = createRequest("https://campus-connect.vercel.app/api/test", {
        method: "POST",
        headers: { origin: "https://evil.com" },
      })
      const result = checkCsrf(req)

      process.env.NODE_ENV = originalEnv

      expect(result).not.toBeNull()
      expect(result!.status).toBe(403)
    })

    it("should allow webhook routes without CSRF token", () => {
      const req = createRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          headers: { origin: "http://localhost:3000" },
        }
      )
      // Webhooks have their own signature verification, no CSRF needed.
      // checkCsrf skips api/webhooks paths for token validation.
      const result = checkCsrf(req)
      // This will fail on CSRF token validation since we don't set cookies,
      // but webhook paths skip token validation, so it should pass
      // origin check (localhost is allowed in dev)
      expect(result).toBeNull()
    })
  })
})
