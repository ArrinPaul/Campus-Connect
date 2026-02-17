import { render, screen } from "@testing-library/react"
import { UserCard } from "./UserCard"
import { Id } from "@/convex/_generated/dataModel"

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock Next.js Link component
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

describe("UserCard", () => {
  const mockUser = {
    _id: "user123" as Id<"users">,
    name: "Jane Smith",
    profilePicture: "https://example.com/avatar.jpg",
    role: "Student" as const,
    university: "Stanford University",
  }

  it("should render user name", () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText("Jane Smith")).toBeInTheDocument()
  })

  it("should render user role", () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText("Student")).toBeInTheDocument()
  })

  it("should render university when provided", () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText("Stanford University")).toBeInTheDocument()
  })

  it("should not render university when not provided", () => {
    const userWithoutUniversity = { ...mockUser, university: undefined }
    render(<UserCard user={userWithoutUniversity} />)

    expect(screen.queryByText("Stanford University")).not.toBeInTheDocument()
  })

  it("should display profile picture when provided", () => {
    render(<UserCard user={mockUser} />)

    const image = screen.getByAltText("Jane Smith")
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute("src", "https://example.com/avatar.jpg")
  })

  it("should display initial when no profile picture", () => {
    const userWithoutPicture = { ...mockUser, profilePicture: undefined }
    render(<UserCard user={userWithoutPicture} />)

    expect(screen.getByText("J")).toBeInTheDocument()
  })

  it("should link to user profile page", () => {
    render(<UserCard user={mockUser} />)

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/profile/user123")
  })

  it("should render Research Scholar role", () => {
    const researchScholar = { ...mockUser, role: "Research Scholar" as const }
    render(<UserCard user={researchScholar} />)

    expect(screen.getByText("Research Scholar")).toBeInTheDocument()
  })

  it("should render Faculty role", () => {
    const faculty = { ...mockUser, role: "Faculty" as const }
    render(<UserCard user={faculty} />)

    expect(screen.getByText("Faculty")).toBeInTheDocument()
  })
})
