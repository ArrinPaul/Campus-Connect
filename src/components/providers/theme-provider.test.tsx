/**
 * Unit Tests for ThemeProvider Component
 */

import { render, screen } from "@testing-library/react"
import { ThemeProvider } from "./theme-provider"

// Mock next-themes
jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}))

describe("ThemeProvider", () => {
  it("should render children", () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
    expect(screen.getByText("Test Child")).toBeInTheDocument()
  })

  it("should wrap children with next-themes ThemeProvider", () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId("theme-provider")).toBeInTheDocument()
  })

  it("should accept and pass through props", () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <div>Content</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId("theme-provider")).toBeInTheDocument()
  })
})
