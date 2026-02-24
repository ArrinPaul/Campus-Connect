import { render, screen } from "@testing-library/react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Home from "./page"

// Mock Clerk
jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(),
}))

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

// Mock framer-motion (we use LazyMotion + m components)
jest.mock("framer-motion", () => {
  // eslint-disable-next-line react/display-name
  const element = (tag: string) => ({ children, className, style, ...rest }: any) => {
    const Tag = tag as any
    return <Tag className={className} style={style}>{children}</Tag>
  }
  const m = {
    div: element("div"),
    h1: element("h1"),
    h2: element("h2"),
    p: element("p"),
    span: element("span"),
    button: element("button"),
    a: element("a"),
    section: element("section"),
  }
  return {
    motion: m,
    m,
    LazyMotion: ({ children }: any) => children,
    domAnimation: {},
    AnimatePresence: ({ children }: any) => children,
  }
})

// Mock Next.js Link
jest.mock("next/link", () => {
  const MockLink = ({ children, ...props }: any) => <a {...props}>{children}</a>
  MockLink.displayName = "MockLink"
  return MockLink
})

// Mock Button component
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild, variant, size, className, ...props }: any) => {
    if (asChild) return children
    return <button className={className} {...props}>{children}</button>
  },
}))

describe("Landing Page", () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it("should redirect authenticated users to feed", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    })

    render(<Home />)

    expect(mockPush).toHaveBeenCalledWith("/feed")
  })

  it("should not redirect unauthenticated users", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(<Home />)

    expect(mockPush).not.toHaveBeenCalled()
  })

  it("should display loading state while auth is loading", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
    })

    render(<Home />)

    // Check for loading spinner
    const spinner = document.querySelector(".animate-spin")
    expect(spinner).toBeInTheDocument()
  })

  it("should display hero section with title and description", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(<Home />)

    expect(
      screen.getByText(/Your Academic Journey/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Connect with peers, collaborate on research/)
    ).toBeInTheDocument()
  })

  it("should display Sign Up CTA button with correct link", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(<Home />)

    const signUpLink = screen.getByRole("link", { name: /get started/i })
    expect(signUpLink).toBeInTheDocument()
    expect(signUpLink).toHaveAttribute("href", "/sign-up")
  })

  it("should display Sign In CTA button with correct link", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(<Home />)

    const signInLink = screen.getByRole("link", { name: /sign in/i })
    expect(signInLink).toBeInTheDocument()
    expect(signInLink).toHaveAttribute("href", "/sign-in")
  })

  it("should display features section", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(<Home />)

    expect(screen.getByText("Built for Academic Excellence")).toBeInTheDocument()
    expect(screen.getByText("Smart Networking")).toBeInTheDocument()
    expect(screen.getByText("Research Collaboration")).toBeInTheDocument()
    expect(screen.getByText("Hackathons & Events")).toBeInTheDocument()
  })
})
