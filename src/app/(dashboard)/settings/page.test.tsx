import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import { useQuery } from "convex/react"
import SettingsPage from "./page"

// Mock Convex
jest.mock("convex/react", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(() => jest.fn()),
}))

// Mock ProfileForm
jest.mock("@/components/profile/ProfileForm", () => ({
  ProfileForm: ({ initialData }: { initialData: unknown }) => (
    <div data-testid="profile-form">ProfileForm: {JSON.stringify(initialData)}</div>
  ),
}))

// Mock ThemeToggle
jest.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}))

// Mock LoadingSpinner
jest.mock("@/components/ui/loading-skeleton", () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}))

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render loading skeleton when user is loading", () => {
    ;(useQuery as jest.Mock).mockReturnValue(undefined)

    const { container } = render(<SettingsPage />)

    // Should show skeleton placeholders (animated bg divs)
    const skeletonDivs = container.querySelectorAll(".bg-gray-200")
    expect(skeletonDivs.length).toBeGreaterThan(0)
  })

  it("should show not authenticated message when user is null", () => {
    ;(useQuery as jest.Mock).mockReturnValue(null)

    render(<SettingsPage />)

    expect(screen.getByText("Not Authenticated")).toBeInTheDocument()
    expect(
      screen.getByText("Please sign in to access settings.")
    ).toBeInTheDocument()
  })

  it("should render settings page with title when user is loaded", () => {
    ;(useQuery as jest.Mock).mockReturnValue({
      _id: "user123",
      name: "Test User",
      role: "Student",
      experienceLevel: "Beginner",
    })

    render(<SettingsPage />)

    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("should render appearance section with theme toggle", () => {
    ;(useQuery as jest.Mock).mockReturnValue({
      _id: "user123",
      name: "Test User",
      role: "Student",
      experienceLevel: "Beginner",
    })

    render(<SettingsPage />)

    expect(screen.getByText("Appearance")).toBeInTheDocument()
    expect(screen.getByText("Theme")).toBeInTheDocument()
    expect(
      screen.getByText("Choose your preferred theme")
    ).toBeInTheDocument()
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument()
  })

  it("should render profile information section with ProfileForm", () => {
    const mockUser = {
      _id: "user123",
      name: "Test User",
      role: "Student",
      experienceLevel: "Beginner",
    }
    ;(useQuery as jest.Mock).mockReturnValue(mockUser)

    render(<SettingsPage />)

    expect(screen.getByText("Profile Information")).toBeInTheDocument()
    expect(screen.getByTestId("profile-form")).toBeInTheDocument()
  })

  it("should pass current user data to ProfileForm", () => {
    const mockUser = {
      _id: "user123",
      name: "Test User",
      role: "Faculty",
      experienceLevel: "Expert",
      bio: "A test bio",
    }
    ;(useQuery as jest.Mock).mockReturnValue(mockUser)

    render(<SettingsPage />)

    const profileForm = screen.getByTestId("profile-form")
    expect(profileForm.textContent).toContain("Test User")
    expect(profileForm.textContent).toContain("Faculty")
  })
})
