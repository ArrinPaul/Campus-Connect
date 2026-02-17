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

// Mock Next.js Link
jest.mock("next/link", () => {
  return ({ children, ...props }: any) => (
    <a {...props}>{children}</a>
  )
})

describe("DashboardLayout - Responsive Design", () => {
  const mockChildren = <div>Test Content</div>

  it("should render the layout with navigation", () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    expect(screen.getByText("Campus Connect")).toBeInTheDocument()
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
    render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    // Find the desktop navigation container
    const desktopNav = screen.getByText("Feed").closest("div")
    
    // Should have hidden class for mobile (md:flex)
    expect(desktopNav?.className).toContain("hidden")
    expect(desktopNav?.className).toContain("md:flex")
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

  it("should have responsive padding classes", () => {
    const { container } = render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    // Find the navigation container
    const navContainer = container.querySelector(".mx-auto.max-w-7xl")
    
    // Should have responsive padding
    expect(navContainer?.className).toContain("px-4")
    expect(navContainer?.className).toContain("sm:px-6")
    expect(navContainer?.className).toContain("lg:px-8")
  })

  it("should have responsive logo text size", () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>)
    
    const logo = screen.getByText("Campus Connect")
    
    // Should have responsive text size
    expect(logo.className).toContain("text-lg")
    expect(logo.className).toContain("sm:text-xl")
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
    expect(nav?.className).toContain("border-b")
    expect(nav?.className).toContain("bg-white")
    expect(nav?.className).toContain("dark:bg-gray-800")
  })
})
