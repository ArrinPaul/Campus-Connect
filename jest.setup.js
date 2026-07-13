import '@testing-library/jest-dom'

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key"

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

// Mock Realtime Hooks to prevent QueryClient requirements in un-wrapped tests
jest.mock("@/hooks/useRealtimeNotifications", () => ({
  useRealtimeNotifications: jest.fn(),
}))
jest.mock("@/hooks/useRealtimeFeed", () => ({
  useRealtimeFeed: jest.fn(),
}))
jest.mock("@/hooks/useRealtime", () => ({
  useRealtimeMessages: jest.fn(),
}))
jest.mock("@/hooks/useTypingIndicator", () => ({
  useTypingIndicator: jest.fn(() => ({ typingUsers: [] })),
}))

// Global mock for useRouter to fix "invariant expected app router to be mounted"
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/",
    query: {},
  })),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Global mock for IntersectionObserver (used by framer-motion and others)
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
  takeRecords = () => []
}
global.IntersectionObserver = MockIntersectionObserver;

// Mock next/image
jest.mock("next/image", () => {
  return function MockImage({ src, alt, fill, priority, ...props }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  }
})
