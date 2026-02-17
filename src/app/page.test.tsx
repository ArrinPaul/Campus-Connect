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

    expect(screen.getByText("Campus Connect")).toBeInTheDocument()
    expect(
      screen.getByText(/Connect with students, researchers, and academics/)
    ).toBeInTheDocument()
  })

  it("should display Sign Up CTA button with correct link", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(<Home />)

    const signUpButton = screen.getByRole("link", { name: /sign up/i })
    expect(signUpButton).toBeInTheDocument()
    expect(signUpButton).toHaveAttribute("href", "/sign-up")
  })

  it("should display Sign In CTA button with correct link", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(<Home />)

    const signInButton = screen.getByRole("link", { name: /sign in/i })
    expect(signInButton).toBeInTheDocument()
    expect(signInButton).toHaveAttribute("href", "/sign-in")
  })

  it("should display features section", () => {
    ;(useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    })

    render(<Home />)

    expect(screen.getByText("Why Campus Connect?")).toBeInTheDocument()
    expect(screen.getByText("Connect")).toBeInTheDocument()
    expect(screen.getByText("Collaborate")).toBeInTheDocument()
    expect(screen.getByText("Create")).toBeInTheDocument()
  })
})
