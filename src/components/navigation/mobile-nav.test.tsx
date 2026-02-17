import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MobileNav } from "./mobile-nav"

// Mock Clerk's UserButton
jest.mock("@clerk/nextjs", () => ({
  UserButton: () => <div data-testid="user-button">User Button</div>,
}))

// Mock ThemeToggle
jest.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}))

// Mock Next.js Link
jest.mock("next/link", () => {
  const MockLink = ({ children, ...props }: any) => (
    <a {...props}>{children}</a>
  )
  MockLink.displayName = "MockLink"
  return MockLink
})

describe("MobileNav", () => {
  it("should render the mobile menu button", () => {
    render(<MobileNav />)
    
    const menuButton = screen.getByLabelText("Toggle navigation menu")
    expect(menuButton).toBeInTheDocument()
  })

  it("should have minimum touch target size of 44x44px", () => {
    render(<MobileNav />)
    
    const menuButton = screen.getByLabelText("Toggle navigation menu")
    const styles = window.getComputedStyle(menuButton)
    
    expect(styles.minWidth).toBe("44px")
    expect(styles.minHeight).toBe("44px")
  })

  it("should open menu when button is clicked", async () => {
    const { container } = render(<MobileNav />)
    
    const menuButton = screen.getByLabelText("Toggle navigation menu")
    
    // Menu panel should have translate-x-full class initially (hidden)
    const menuPanel = container.querySelector(".fixed.right-0.top-0")
    expect(menuPanel?.className).toContain("translate-x-full")
    
    // Click to open
    fireEvent.click(menuButton)
    
    // Menu should be visible (translate-x-0)
    await waitFor(() => {
      expect(menuPanel?.className).toContain("translate-x-0")
    })
  })

  it("should close menu when close button is clicked", async () => {
    const { container } = render(<MobileNav />)
    
    const menuButton = screen.getByLabelText("Toggle navigation menu")
    const menuPanel = container.querySelector(".fixed.right-0.top-0")
    
    // Open menu
    fireEvent.click(menuButton)
    
    await waitFor(() => {
      expect(menuPanel?.className).toContain("translate-x-0")
    })
    
    // Click close button
    const closeButton = screen.getByLabelText("Close menu")
    fireEvent.click(closeButton)
    
    // Menu should be closed (translate-x-full)
    await waitFor(() => {
      expect(menuPanel?.className).toContain("translate-x-full")
    })
  })

  it("should close menu when overlay is clicked", async () => {
    const { container } = render(<MobileNav />)
    
    const menuButton = screen.getByLabelText("Toggle navigation menu")
    const menuPanel = container.querySelector(".fixed.right-0.top-0")
    
    // Open menu
    fireEvent.click(menuButton)
    
    await waitFor(() => {
      expect(menuPanel?.className).toContain("translate-x-0")
    })
    
    // Click overlay
    const overlay = container.querySelector(".fixed.inset-0.bg-black")
    expect(overlay).toBeInTheDocument()
    fireEvent.click(overlay!)
    
    // Menu should be closed (translate-x-full)
    await waitFor(() => {
      expect(menuPanel?.className).toContain("translate-x-full")
    })
  })

  it("should display all navigation links", async () => {
    render(<MobileNav currentUserId="test-user-id" />)
    
    const menuButton = screen.getByLabelText("Toggle navigation menu")
    fireEvent.click(menuButton)
    
    await waitFor(() => {
      expect(screen.getByText("Feed")).toBeInTheDocument()
      expect(screen.getByText("Discover")).toBeInTheDocument()
      expect(screen.getByText("Profile")).toBeInTheDocument()
      expect(screen.getByText("Settings")).toBeInTheDocument()
    })
  })

  it("should close menu when a navigation link is clicked", async () => {
    const { container } = render(<MobileNav />)
    
    const menuButton = screen.getByLabelText("Toggle navigation menu")
    const menuPanel = container.querySelector(".fixed.right-0.top-0")
    
    fireEvent.click(menuButton)
    
    await waitFor(() => {
      expect(menuPanel?.className).toContain("translate-x-0")
    })
    
    // Click a navigation link - it should have onClick handler
    const feedLink = screen.getByText("Feed").closest("a")
    expect(feedLink).toBeInTheDocument()
    
    // Verify the link has the closeMenu handler by checking it's clickable
    fireEvent.click(feedLink!)
    
    // Menu should be closed (translate-x-full) after clicking
    await waitFor(() => {
      expect(menuPanel?.className).toContain("translate-x-full")
    }, { timeout: 100 })
  })

  it("should display theme toggle and user button in menu", async () => {
    render(<MobileNav />)
    
    const menuButton = screen.getByLabelText("Toggle navigation menu")
    fireEvent.click(menuButton)
    
    await waitFor(() => {
      expect(screen.getByTestId("theme-toggle")).toBeInTheDocument()
      expect(screen.getByTestId("user-button")).toBeInTheDocument()
    })
  })

  it("should have proper aria attributes", () => {
    render(<MobileNav />)
    
    const menuButton = screen.getByLabelText("Toggle navigation menu")
    
    // Initially closed
    expect(menuButton).toHaveAttribute("aria-expanded", "false")
    
    // Open menu
    fireEvent.click(menuButton)
    
    // Should be expanded
    expect(menuButton).toHaveAttribute("aria-expanded", "true")
  })

  it("should have minimum touch target size for all interactive elements", async () => {
    const { container } = render(<MobileNav currentUserId="test-user-id" />)
    
    const menuButton = screen.getByLabelText("Toggle navigation menu")
    fireEvent.click(menuButton)
    
    // Wait for menu to open
    await waitFor(() => {
      const menuPanel = container.querySelector(".translate-x-0")
      expect(menuPanel).toBeInTheDocument()
    })
    
    // Verify navigation links exist and have proper padding classes
    const feedLink = screen.getByText("Feed").closest("a")
    const discoverLink = screen.getByText("Discover").closest("a")
    const profileLink = screen.getByText("Profile").closest("a")
    const settingsLink = screen.getByText("Settings").closest("a")
    
    // Check that links have proper padding for touch targets (py-3 provides vertical padding)
    expect(feedLink?.className).toContain("py-3")
    expect(discoverLink?.className).toContain("py-3")
    expect(profileLink?.className).toContain("py-3")
    expect(settingsLink?.className).toContain("py-3")
  })
})
