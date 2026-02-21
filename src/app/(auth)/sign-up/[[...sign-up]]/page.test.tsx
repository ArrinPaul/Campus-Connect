import { render, screen } from "@testing-library/react"
import SignUpPage from "./page"

// Mock Clerk SignUp component
jest.mock("@clerk/nextjs", () => ({
  SignUp: () => <div data-testid="clerk-signup">Clerk SignUp Component</div>,
}))

describe("SignUpPage", () => {
  it("should render the sign-up page with welcome message", () => {
    render(<SignUpPage />)

    expect(screen.getByText("Join Campus Connect")).toBeInTheDocument()
    expect(
      screen.getByText("Create your account to start connecting with peers")
    ).toBeInTheDocument()
  })

  it("should render the Clerk SignUp component", () => {
    render(<SignUpPage />)

    expect(screen.getByTestId("clerk-signup")).toBeInTheDocument()
  })

  it("should have proper styling classes for layout", () => {
    const { container } = render(<SignUpPage />)

    // Check for background class
    const bgDiv = container.querySelector(".bg-background")
    expect(bgDiv).toBeInTheDocument()

    // Check for centered layout
    const flexContainer = container.querySelector(
      ".flex.min-h-screen.items-center.justify-center"
    )
    expect(flexContainer).toBeInTheDocument()
  })

  it("should display heading with correct styling", () => {
    render(<SignUpPage />)

    const heading = screen.getByRole("heading", { name: "Join Campus Connect" })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe("H1")
  })
})
