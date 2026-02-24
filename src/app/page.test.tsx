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
  const MockLink = ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>
  MockLink.displayName = "MockLink"
  return MockLink
})

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  LogIn: () => null,
  UserPlus: () => null,
  ArrowRight: () => null,
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

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it("should display hero section with title and description", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(<Home />)

    expect(screen.getByText(/Connect, Collaborate, Conquer/i)).toBeInTheDocument()
    expect(screen.getByText(/academic community/i)).toBeInTheDocument()
  })

  it("should display Get Started CTA button with correct link", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(<Home />)

    const signUpLink = screen.getByRole("link", { name: /get started/i })
    expect(signUpLink).toBeInTheDocument()
    expect(signUpLink).toHaveAttribute("href", "/sign-up")
  })

  it("should display Log In button with correct link", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(<Home />)

    const logInLink = screen.getByRole("link", { name: /log in/i })
    expect(logInLink).toBeInTheDocument()
    expect(logInLink).toHaveAttribute("href", "/sign-in")
  })

  it("should display feed link for existing members", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(<Home />)

    expect(screen.getByText(/already a member/i)).toBeInTheDocument()
  })
})
