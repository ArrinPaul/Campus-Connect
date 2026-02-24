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
      <div>
        <span className="text-base font-bold">Campus Connect</span>
      </div>
      <a href="/feed">Feed</a>
      <a href="/discover">Discover</a>
      <a href="/profile/test-user-id">Profile</a>
      <a href="/settings">Settings</a>
      <div data-testid="user-button">UserButton</div>
    </nav>
  ),
}))

jest.mock("../../(components)/navigation/mobile-bottom-nav", () => ({
  MobileBottomNav: () => <div data-testid="mobile-nav">MobileNav</div>,
}))

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/feed"),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
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

    const brands = screen.getAllByText("Campus Connect")
    expect(brands.length).toBeGreaterThan(0)
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
