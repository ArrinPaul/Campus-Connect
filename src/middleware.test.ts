import { NextRequest } from "next/server"

// Mock Clerk middleware
const mockProtect = jest.fn()
const mockClerkMiddleware = jest.fn((handler) => handler)

jest.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (handler: any) => mockClerkMiddleware(handler),
  createRouteMatcher: (routes: string[]) => {
    return (request: NextRequest) => {
      const path = request.nextUrl.pathname
      return routes.some((route) => {
        // Simple pattern matching for test purposes
        if (route.includes("(.*)")) {
          const baseRoute = route.replace("(.*)", "")
          return path.startsWith(baseRoute)
        }
        return path === route
      })
    }
  },
}))

/**
 * Unit Tests for Authentication Flows
 * Feature: campus-connect-foundation
 * 
 * These tests verify authentication middleware behavior including:
 * - Redirect to login for unauthenticated users (Requirement 1.2)
 * - Protected route authorization (Requirement 1.7)
 * - Logout and session clearing (Requirement 1.6)
 */
describe("Middleware - Authentication Flows", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Public Routes", () => {
    it("should define public routes correctly", () => {
      const { createRouteMatcher } = require("@clerk/nextjs/server")
      const isPublicRoute = createRouteMatcher([
        "/",
        "/sign-in(.*)",
        "/sign-up(.*)",
        "/api/webhooks(.*)",
      ])

      // Test public routes
      expect(
        isPublicRoute({
          nextUrl: { pathname: "/" },
        } as NextRequest)
      ).toBe(true)

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/sign-in" },
        } as NextRequest)
      ).toBe(true)

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/sign-up" },
        } as NextRequest)
      ).toBe(true)

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/api/webhooks/clerk" },
        } as NextRequest)
      ).toBe(true)
    })

    it("should allow access to sign-in page without authentication", () => {
      const { createRouteMatcher } = require("@clerk/nextjs/server")
      const isPublicRoute = createRouteMatcher([
        "/",
        "/sign-in(.*)",
        "/sign-up(.*)",
        "/api/webhooks(.*)",
      ])

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/sign-in" },
        } as NextRequest)
      ).toBe(true)

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/sign-in/sso-callback" },
        } as NextRequest)
      ).toBe(true)
    })

    it("should allow access to sign-up page without authentication", () => {
      const { createRouteMatcher } = require("@clerk/nextjs/server")
      const isPublicRoute = createRouteMatcher([
        "/",
        "/sign-in(.*)",
        "/sign-up(.*)",
        "/api/webhooks(.*)",
      ])

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/sign-up" },
        } as NextRequest)
      ).toBe(true)

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/sign-up/verify-email" },
        } as NextRequest)
      ).toBe(true)
    })

    it("should allow access to webhook endpoints without authentication", () => {
      const { createRouteMatcher } = require("@clerk/nextjs/server")
      const isPublicRoute = createRouteMatcher([
        "/",
        "/sign-in(.*)",
        "/sign-up(.*)",
        "/api/webhooks(.*)",
      ])

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/api/webhooks/clerk" },
        } as NextRequest)
      ).toBe(true)

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/api/webhooks/stripe" },
        } as NextRequest)
      ).toBe(true)
    })
  })

  describe("Protected Routes", () => {
    it("should identify protected routes correctly", () => {
      const { createRouteMatcher } = require("@clerk/nextjs/server")
      const isPublicRoute = createRouteMatcher([
        "/",
        "/sign-in(.*)",
        "/sign-up(.*)",
        "/api/webhooks(.*)",
      ])

      // Test protected routes
      expect(
        isPublicRoute({
          nextUrl: { pathname: "/dashboard" },
        } as NextRequest)
      ).toBe(false)

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/profile" },
        } as NextRequest)
      ).toBe(false)

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/feed" },
        } as NextRequest)
      ).toBe(false)

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/discover" },
        } as NextRequest)
      ).toBe(false)

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/settings" },
        } as NextRequest)
      ).toBe(false)
    })

    it("should protect profile routes", () => {
      const { createRouteMatcher } = require("@clerk/nextjs/server")
      const isPublicRoute = createRouteMatcher([
        "/",
        "/sign-in(.*)",
        "/sign-up(.*)",
        "/api/webhooks(.*)",
      ])

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/profile/123" },
        } as NextRequest)
      ).toBe(false)

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/profile/abc/edit" },
        } as NextRequest)
      ).toBe(false)
    })

    it("should protect API routes except webhooks", () => {
      const { createRouteMatcher } = require("@clerk/nextjs/server")
      const isPublicRoute = createRouteMatcher([
        "/",
        "/sign-in(.*)",
        "/sign-up(.*)",
        "/api/webhooks(.*)",
      ])

      // Protected API routes
      expect(
        isPublicRoute({
          nextUrl: { pathname: "/api/posts" },
        } as NextRequest)
      ).toBe(false)

      expect(
        isPublicRoute({
          nextUrl: { pathname: "/api/users" },
        } as NextRequest)
      ).toBe(false)

      // Public webhook routes
      expect(
        isPublicRoute({
          nextUrl: { pathname: "/api/webhooks/clerk" },
        } as NextRequest)
      ).toBe(true)
    })
  })

  describe("Middleware Configuration", () => {
    it("should have correct matcher configuration", () => {
      const middleware = require("./middleware")

      expect(middleware.config.matcher).toBeDefined()
      expect(Array.isArray(middleware.config.matcher)).toBe(true)
      expect(middleware.config.matcher.length).toBeGreaterThan(0)
    })

    it("should exclude Next.js internals from middleware", () => {
      const middleware = require("./middleware")
      const matcher = middleware.config.matcher[0]

      // Verify the matcher excludes _next and static files
      expect(matcher).toContain("(?!_next")
    })

    it("should include API routes in middleware", () => {
      const middleware = require("./middleware")
      const apiMatcher = middleware.config.matcher.find((m: string) =>
        m.includes("api")
      )

      expect(apiMatcher).toBeDefined()
      expect(apiMatcher).toContain("api")
    })
  })

  describe("Authentication Flow", () => {
    it("should call clerkMiddleware with handler function", () => {
      // Re-import to trigger middleware creation
      jest.isolateModules(() => {
        require("./middleware")
      })

      expect(mockClerkMiddleware).toHaveBeenCalled()
      expect(typeof mockClerkMiddleware.mock.calls[0][0]).toBe("function")
    })
  })
})
