import { render, screen } from "@testing-library/react"
import DashboardLayout from "./layout"

// Mock the v2 layout components
jest.mock("../../(components)/layouts/main-layout", () => ({
  MainLayout: ({ children, sidebar, mobileNav }: any) => (
    <div>
      <aside className="hidden md:flex flex-shrink-0">{sidebar}</aside>
      <main role="main">{children}</main>
      <div className="md:hidden">{mobileNav}</div>
    </div>
  ),
}))

jest.mock("../../(components)/navigation/primary-sidebar", () => ({
  PrimarySidebar: () => (
    <nav className="flex-1 overflow-y-auto">
      <header className="px-4 sm:px-6">
        <span className="text-base font-bold">Campus Connect</span>
      </header>
      <a href="/feed">Feed</a>
      <a href="/explore">Discover</a>
      <a href="/profile/me">Profile</a>
      <a href="/settings">Settings</a>
      <div data-testid="user-button">User Button</div>
      <div data-testid="theme-toggle">Theme Toggle</div>
    </nav>
  ),
}))

jest.mock("../../(components)/navigation/mobile-bottom-nav", () => ({
  MobileBottomNav: () => <div data-testid="mobile-nav">Mobile Nav</div>,
}))

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/feed"),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
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

    const links = screen.getAllByText(/Feed|Discover|Profile/)
    expect(links.length).toBeGreaterThan(0)
  })

  it("should display mobile navigation component", () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>)

    expect(screen.getByTestId("mobile-nav")).toBeInTheDocument()
  })

  it("should have responsive classes for desktop navigation", () => {
    const { container } = render(<DashboardLayout>{mockChildren}</DashboardLayout>)

    const sidebar = container.querySelector("aside")
    expect(sidebar?.className).toContain("hidden")
    expect(sidebar?.className).toContain("md:flex")
  })

  it("should have responsive classes for mobile navigation", () => {
    const { container } = render(<DashboardLayout>{mockChildren}</DashboardLayout>)

    const mobileNavWrapper = container.querySelector("div.md\\:hidden")
    expect(mobileNavWrapper).toBeInTheDocument()
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

  it("should have sidebar brand text", () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>)

    const logos = screen.getAllByText("Campus Connect")
    expect(logos.length).toBeGreaterThan(0)
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
    expect(nav?.className).toContain("flex-1")
    expect(nav?.className).toContain("overflow-y-auto")
  })
})
