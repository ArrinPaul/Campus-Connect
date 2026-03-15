import { render } from "@testing-library/react"
import RootLayout from "./layout"

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Clerk
jest.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-provider">{children}</div>
  ),
}))

// Mock query provider
jest.mock("@/components/providers/query-provider", () => ({
  AppQueryProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}))

// Mock ThemeProvider
jest.mock("@/components/providers/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}))



// Mock PostHog
jest.mock("@/components/providers/posthog-provider", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="posthog-provider">{children}</div>
  ),
}))
jest.mock("@/components/analytics/posthog-pageview", () => ({
  PostHogPageView: () => <div data-testid="posthog-pageview" />,
}))

describe("RootLayout", () => {
  it("should wrap app with ClerkProvider", () => {
    const { getByTestId } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(getByTestId("clerk-provider")).toBeInTheDocument()
  })

  it("should wrap app with AppQueryProvider", () => {
    const { getByTestId } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(getByTestId("query-provider")).toBeInTheDocument()
  })

  it("should render children", () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(getByText("Test Content")).toBeInTheDocument()
  })
})
