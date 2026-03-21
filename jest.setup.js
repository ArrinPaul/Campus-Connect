import '@testing-library/jest-dom'

// Global mock for next/dynamic — resolve eagerly in test environment
jest.mock("next/dynamic", () => {
  return (loader, _opts) => {
    // Eagerly resolve the dynamic import for testing
    let Component = null
    const promise = loader()
    if (promise && typeof promise.then === "function") {
      promise.then((mod) => {
        Component = mod.default || mod
      })
    }
    // Return a wrapper component that renders the resolved module
    const DynamicComponent = (props) => {
      if (!Component) {
        // Try to resolve synchronously (works with jest.mock'd modules)
        try {
          const mod = require(loader._payload || loader)
          Component = mod.default || mod
        } catch {
          return null
        }
      }
      return Component ? <Component {...props} /> : null
    }
    DynamicComponent.displayName = "DynamicComponent"
    return DynamicComponent
  }
})

// Global mock for local auth client to avoid ESM parse errors
// Individual tests can override with jest.mock("@/lib/auth/client", ...) as needed
jest.mock("@/lib/auth/client", () => ({
  useUser: jest.fn(() => ({ isLoaded: true, isSignedIn: true, user: { id: "test-user-id", fullName: "Test User", imageUrl: "/test.jpg" } })),
  useAuth: jest.fn(() => ({ isLoaded: true, isSignedIn: true, userId: "test-user-id" })),
  useAuthActions: jest.fn(() => ({ signOut: jest.fn() })),
  AuthProvider: ({ children }) => children,
  SignIn: () => null,
  SignUp: () => null,
  SignedIn: ({ children }) => children,
  SignedOut: ({ children }) => children,
  UserButton: () => null,
  currentUser: jest.fn(),
  auth: jest.fn(() => ({ userId: "test-user-id" })),
}))

// Global mock for local auth server to avoid ESM parse errors
jest.mock("@/lib/auth/server", () => ({
  auth: jest.fn(() => ({ userId: "test-user-id" })),
  currentUser: jest.fn(),
  authMiddleware: jest.fn(() => (req) => req),
  createRouteMatcher: jest.fn(() => () => false),
}))
