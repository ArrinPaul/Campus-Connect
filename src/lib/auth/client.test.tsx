import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { SignIn, SignUp } from "./client"

// Unmock this module so we test the actual implementation of components
jest.unmock("./client")
jest.unmock("@/lib/auth/client")

const mockSignUp = jest.fn()
const mockSignInWithPassword = jest.fn()
const mockPush = jest.fn()

// Mock next/navigation locally to capture router pushes
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/",
    query: {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
    },
  })),
}))

describe("Auth Component Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("SignIn", () => {
    it("should toggle password visibility", () => {
      render(<SignIn />)
      
      const passwordInput = screen.getByPlaceholderText("Password") as HTMLInputElement
      expect(passwordInput.type).toBe("password")
      
      // Click show password button
      const toggleButton = screen.getByRole("button", { name: /show password/i })
      fireEvent.click(toggleButton)
      
      expect(passwordInput.type).toBe("text")
      expect(toggleButton.getAttribute("aria-label")).toBe("Hide password")
      
      // Click hide password button
      fireEvent.click(toggleButton)
      expect(passwordInput.type).toBe("password")
      expect(toggleButton.getAttribute("aria-label")).toBe("Show password")
    })
  })

  describe("SignUp", () => {
    it("should toggle password visibility", () => {
      render(<SignUp />)
      
      const passwordInput = screen.getByPlaceholderText("Password (min 8 chars)") as HTMLInputElement
      expect(passwordInput.type).toBe("password")
      
      // Click show password button
      const toggleButton = screen.getByRole("button", { name: /show password/i })
      fireEvent.click(toggleButton)
      
      expect(passwordInput.type).toBe("text")
      expect(toggleButton.getAttribute("aria-label")).toBe("Hide password")
      
      // Click hide password button
      fireEvent.click(toggleButton)
      expect(passwordInput.type).toBe("password")
      expect(toggleButton.getAttribute("aria-label")).toBe("Show password")
    })

    it("should display success screen and remove form fields when sign up succeeds with email verification required", async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })

      render(<SignUp />)

      // Enter signup details
      fireEvent.change(screen.getByPlaceholderText("Full name"), { target: { value: "John Doe" } })
      fireEvent.change(screen.getByPlaceholderText("Email address"), { target: { value: "john@example.com" } })
      fireEvent.change(screen.getByPlaceholderText("Password (min 8 chars)"), { target: { value: "password123" } })

      // Submit form
      fireEvent.submit(screen.getByRole("button", { name: /create account/i }).closest("form")!)

      // Wait for success screen
      const successMessage = await screen.findByText(/Account created successfully! Please check your email to verify your account/i)
      expect(successMessage).toBeInTheDocument()

      // The fields should no longer be in the document
      expect(screen.queryByPlaceholderText("Full name")).not.toBeInTheDocument()
      expect(screen.queryByPlaceholderText("Email address")).not.toBeInTheDocument()
      expect(screen.queryByPlaceholderText("Password (min 8 chars)")).not.toBeInTheDocument()

      // Continue button should be present
      const continueButton = screen.getByRole("button", { name: /continue/i })
      expect(continueButton).toBeInTheDocument()

      // Click continue
      fireEvent.click(continueButton)
      
      // Check router pushes to landing page
      expect(mockPush).toHaveBeenCalledWith("/")
    })
  })
})
