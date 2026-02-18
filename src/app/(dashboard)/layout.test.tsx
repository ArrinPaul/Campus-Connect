import { render, screen } from "@testing-library/react"
import DashboardLayout from "./layout"

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

// Mock Clerk's UserButton
jest.mock("@clerk/nextjs", () => ({
  UserButton: () => <div data-testid="user-button">UserButton</div>,
}))

// Mock ThemeToggle
jest.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}))

// Mock MobileNav
jest.mock("@/components/navigation/mobile-nav", () => ({
  MobileNav: () => <div data-testid="mobile-nav">MobileNav</div>,
}))

// Mock NotificationBell
jest.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell">NotificationBell</div>,
}))

// Mock useHeartbeat
jest.mock("@/hooks/useHeartbeat", () => ({
  useHeartbeat: jest.fn(),
}))

// Mock IncomingCallNotification
jest.mock("@/components/calls/IncomingCallNotification", () => ({
  IncomingCallNotification: () => null,
}))

// Mock Next.js Link
jest.mock("next/link", () => {
  const MockLink = ({ children, ...props }: any) => (
    <a {...props}>{children}</a>
  )
  MockLink.displayName = "MockLink"
  return MockLink
})

// Mock Convex
jest.mock("convex/react", () => ({
  useQuery: jest.fn(() => ({ _id: "test-user-id" })),
}))

describe("DashboardLayout", () => {
  it("should render navigation bar", () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )
    
    const nav = screen.getByRole("navigation")
    expect(nav).toBeInTheDocument()
  })

  it("should display Campus Connect brand", () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )
    
    const brand = screen.getByText("Campus Connect")
    expect(brand).toBeInTheDocument()
  })

  it("should render navigation links", () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )
    
    expect(screen.getByText("Feed")).toBeInTheDocument()
    expect(screen.getByText("Discover")).toBeInTheDocument()
    expect(screen.getByText("Profile")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("should render UserButton", () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )
    
    const userButton = screen.getByTestId("user-button")
    expect(userButton).toBeInTheDocument()
  })

  it("should render children content", () => {
    render(
      <DashboardLayout>
        <div data-testid="child-content">Test Content</div>
      </DashboardLayout>
    )
    
    const childContent = screen.getByTestId("child-content")
    expect(childContent).toBeInTheDocument()
    expect(childContent).toHaveTextContent("Test Content")
  })

  it("should have proper layout structure with main element", () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )
    
    const main = screen.getByRole("main")
    expect(main).toBeInTheDocument()
  })

  it("should have navigation links with correct hrefs", () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )
    
    const feedLink = screen.getByText("Feed").closest("a")
    const discoverLink = screen.getByText("Discover").closest("a")
    const profileLink = screen.getByText("Profile").closest("a")
    const settingsLink = screen.getByText("Settings").closest("a")
    
    expect(feedLink).toHaveAttribute("href", "/feed")
    expect(discoverLink).toHaveAttribute("href", "/discover")
    expect(profileLink).toHaveAttribute("href", "/profile/test-user-id")
    expect(settingsLink).toHaveAttribute("href", "/settings")
  })
})
