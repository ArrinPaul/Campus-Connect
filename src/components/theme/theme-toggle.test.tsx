/**
 * Unit Tests for ThemeToggle Component
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ThemeToggle } from "./theme-toggle"
import { useTheme } from "next-themes"

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}))

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

describe("ThemeToggle", () => {
  const mockSetTheme = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render theme toggle button", () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
  })

  it("should show moon icon in light mode", async () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    await waitFor(() => {
      const button = screen.getByRole("button")
      expect(button).toHaveAttribute("aria-label", "Switch to dark mode")
    })
  })

  it("should show sun icon in dark mode", async () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    await waitFor(() => {
      const button = screen.getByRole("button")
      expect(button).toHaveAttribute("aria-label", "Switch to light mode")
    })
  })

  it("should toggle from light to dark when clicked", async () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    await waitFor(() => {
      const button = screen.getByRole("button")
      fireEvent.click(button)
    })

    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })

  it("should toggle from dark to light when clicked", async () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    await waitFor(() => {
      const button = screen.getByRole("button")
      fireEvent.click(button)
    })

    expect(mockSetTheme).toHaveBeenCalledWith("light")
  })

  it("should handle system theme", async () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "system",
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    await waitFor(() => {
      const button = screen.getByRole("button")
      expect(button).toBeInTheDocument()
    })
  })

  it("should show loading state before mount", () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    // The component shows a default sun icon during SSR/initial render
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("aria-label")
  })

  it("should have proper accessibility attributes", async () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    await waitFor(() => {
      const button = screen.getByRole("button")
      expect(button).toHaveAttribute("aria-label")
    })
  })
})
