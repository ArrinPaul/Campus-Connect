import { render, screen } from "@testing-library/react"
import SignInPage from "./page"

// Mock Clerk SignIn component
jest.mock("@clerk/nextjs", () => ({
  SignIn: () => <div data-testid="clerk-signin">Clerk SignIn Component</div>,
}))

describe("SignInPage", () => {
  it("should render the sign-in page with welcome message", () => {
    render(<SignInPage />)

    expect(screen.getByText("Welcome Back")).toBeInTheDocument()
    expect(
      screen.getByText("Sign in to continue to Campus Connect")
    ).toBeInTheDocument()
  })

  it("should render the Clerk SignIn component", () => {
    render(<SignInPage />)

    expect(screen.getByTestId("clerk-signin")).toBeInTheDocument()
  })

  it("should have proper styling classes for layout", () => {
    const { container } = render(<SignInPage />)

    // Check for gradient background
    const gradientDiv = container.querySelector(
      ".bg-gradient-to-br.from-blue-50.to-indigo-100"
    )
    expect(gradientDiv).toBeInTheDocument()

    // Check for centered layout
    const flexContainer = container.querySelector(
      ".flex.min-h-screen.items-center.justify-center"
    )
    expect(flexContainer).toBeInTheDocument()
  })

  it("should display heading with correct styling", () => {
    render(<SignInPage />)

    const heading = screen.getByRole("heading", { name: "Welcome Back" })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe("H1")
  })
})
