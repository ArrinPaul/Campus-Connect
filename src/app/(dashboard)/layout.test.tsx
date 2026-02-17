import { render, screen } from "@testing-library/react"
import DashboardLayout from "./layout"

// Mock Clerk's UserButton
jest.mock("@clerk/nextjs", () => ({
  UserButton: () => <div data-testid="user-button">UserButton</div>,
}))

// Mock Next.js Link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

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
    
    expect(feedLink).toHaveAttribute("href", "/feed")
    expect(discoverLink).toHaveAttribute("href", "/discover")
    expect(profileLink).toHaveAttribute("href", "/profile")
  })
})
