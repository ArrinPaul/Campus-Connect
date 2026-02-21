import { render, screen } from "@testing-library/react"
import DashboardLayout from "./layout"

// Mock Clerk's UserButton
jest.mock("@clerk/nextjs", () => ({
  UserButton: () => <div data-testid="user-button">User Button</div>,
}))

// Mock ThemeToggle
jest.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}))

// Mock MobileNav
jest.mock("@/components/navigation/mobile-nav", () => ({
  MobileNav: () => <div data-testid="mobile-nav">Mobile Nav</div>,
}))

// Mock UniversalSearchBar
jest.mock("@/components/navigation/UniversalSearchBar", () => ({
  UniversalSearchBar: () => <div data-testid="universal-search-bar">SearchBar</div>,
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

// Mock Convex
jest.mock("convex/react", () => ({
  useQuery: jest.fn(() => ({ _id: "test-user-id" })),
}))

// Mock Next.js Link
jest.mock("next/link", () => {
  const MockLink = ({ children, ...props }: any) => (
    <a {...props}>{children}</a>
  )
  MockLink.displayName = "MockLink"
  return MockLink
})

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/feed"),
}))

describe("DashboardLayout - Responsive Design", () => {
  const mockChildren = <div>Test Content</div>

  it("should render the layout with navigation", () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    expect(screen.getAllByText("Campus Connect").length).toBeGreaterThan(0)
    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("should display desktop navigation links", () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    // Desktop navigation should have Feed, Discover, Profile links
    const links = screen.getAllByText(/Feed|Discover|Profile/)
    expect(links.length).toBeGreaterThan(0)
  })

  it("should display mobile navigation component", () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    expect(screen.getByTestId("mobile-nav")).toBeInTheDocument()
  })

  it("should have responsive classes for desktop navigation", () => {
    const { container } = render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    // Find the sidebar (aside element) with hidden md:flex
    const sidebar = container.querySelector("aside")
    
    // Should have hidden class for mobile (md:flex)
    expect(sidebar?.className).toContain("hidden")
    expect(sidebar?.className).toContain("md:flex")
  })

  it("should have responsive classes for mobile navigation", () => {
    const { container } = render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    // Find the mobile navigation container by looking for the div that contains the mobile-nav
    const mobileNavContainer = container.querySelector("div.flex.items-center.md\\:hidden")
    
    // Should have flex on mobile and hidden on desktop (md:hidden)
    expect(mobileNavContainer).toBeInTheDocument()
    expect(mobileNavContainer?.className).toContain("md:hidden")
  })

  it("should display theme toggle in desktop navigation", () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    const themeToggles = screen.getAllByTestId("theme-toggle")
    expect(themeToggles.length).toBeGreaterThan(0)
  })

  it("should display user button in desktop navigation", () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    const userButtons = screen.getAllByTestId("user-button")
    expect(userButtons.length).toBeGreaterThan(0)
  })

  it("should have responsive padding on header", () => {
    const { container } = render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    // Find the header/top bar
    const header = container.querySelector("header")
    
    // Should have responsive padding
    expect(header?.className).toContain("px-4")
    expect(header?.className).toContain("sm:px-6")
  })

  it("should have sidebar brand text", () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    const logos = screen.getAllByText("Campus Connect")
    expect(logos.length).toBeGreaterThan(0)
    // Check sidebar brand uses appropriate text styling
    const sidebarLogo = logos[0]
    expect(sidebarLogo.className).toContain("text-base")
  })

  it("should render children in main element", () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    const main = screen.getByRole("main")
    expect(main).toBeInTheDocument()
    expect(main).toHaveTextContent("Test Content")
  })

  it("should have proper navigation structure", () => {
    const { container } = render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    const nav = container.querySelector("nav")
    expect(nav).toBeInTheDocument()
    // Sidebar nav has overflow-y-auto
    expect(nav?.className).toContain("flex-1")
    expect(nav?.className).toContain("overflow-y-auto")
  })
})
