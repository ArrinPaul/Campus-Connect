import { render, screen } from "@testing-library/react"
import { ProfileHeader } from "./ProfileHeader"
import { Id } from "@/convex/_generated/dataModel"

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe("ProfileHeader", () => {
  const mockUser = {
    _id: "user123" as Id<"users">,
    name: "John Doe",
    profilePicture: "https://example.com/avatar.jpg",
    bio: "Software engineer passionate about web development",
    role: "Student" as const,
    university: "MIT",
    experienceLevel: "Intermediate" as const,
    followerCount: 150,
    followingCount: 75,
  }

  it("should render user name", () => {
    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    expect(screen.getByText("John Doe")).toBeInTheDocument()
  })

  it("should render user role and experience level", () => {
    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    expect(screen.getByText("Student")).toBeInTheDocument()
    expect(screen.getByText("Intermediate")).toBeInTheDocument()
  })

  it("should render university when provided", () => {
    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    expect(screen.getByText("MIT")).toBeInTheDocument()
  })

  it("should render bio when provided", () => {
    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    expect(
      screen.getByText("Software engineer passionate about web development")
    ).toBeInTheDocument()
  })

  it("should not render university when not provided", () => {
    const userWithoutUniversity = { ...mockUser, university: undefined }
    render(<ProfileHeader user={userWithoutUniversity} isOwnProfile={false} />)

    expect(screen.queryByText("MIT")).not.toBeInTheDocument()
  })

  it("should not render bio when not provided", () => {
    const userWithoutBio = { ...mockUser, bio: undefined }
    render(<ProfileHeader user={userWithoutBio} isOwnProfile={false} />)

    expect(
      screen.queryByText("Software engineer passionate about web development")
    ).not.toBeInTheDocument()
  })

  it("should display follower count", () => {
    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    expect(screen.getByText("150")).toBeInTheDocument()
    expect(screen.getByText("Followers")).toBeInTheDocument()
  })

  it("should display following count", () => {
    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    expect(screen.getByText("75")).toBeInTheDocument()
    expect(screen.getByText("Following")).toBeInTheDocument()
  })

  it("should show follow button for other users", () => {
    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    expect(screen.getByRole("button", { name: /follow/i })).toBeInTheDocument()
  })

  it("should not show follow button for own profile", () => {
    render(<ProfileHeader user={mockUser} isOwnProfile={true} />)

    expect(
      screen.queryByRole("button", { name: /follow/i })
    ).not.toBeInTheDocument()
  })

  it("should display profile picture when provided", () => {
    render(<ProfileHeader user={mockUser} isOwnProfile={false} />)

    const image = screen.getByAltText("John Doe")
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute("src", "https://example.com/avatar.jpg")
  })

  it("should display initial when no profile picture", () => {
    const userWithoutPicture = { ...mockUser, profilePicture: undefined }
    render(<ProfileHeader user={userWithoutPicture} isOwnProfile={false} />)

    expect(screen.getByText("J")).toBeInTheDocument()
  })

  it("should display correct role badge for Research Scholar", () => {
    const researchScholar = { ...mockUser, role: "Research Scholar" as const }
    render(<ProfileHeader user={researchScholar} isOwnProfile={false} />)

    expect(screen.getByText("Research Scholar")).toBeInTheDocument()
  })

  it("should display correct role badge for Faculty", () => {
    const faculty = { ...mockUser, role: "Faculty" as const }
    render(<ProfileHeader user={faculty} isOwnProfile={false} />)

    expect(screen.getByText("Faculty")).toBeInTheDocument()
  })

  it("should display correct experience level badge for Beginner", () => {
    const beginner = { ...mockUser, experienceLevel: "Beginner" as const }
    render(<ProfileHeader user={beginner} isOwnProfile={false} />)

    expect(screen.getByText("Beginner")).toBeInTheDocument()
  })

  it("should display correct experience level badge for Expert", () => {
    const expert = { ...mockUser, experienceLevel: "Expert" as const }
    render(<ProfileHeader user={expert} isOwnProfile={false} />)

    expect(screen.getByText("Expert")).toBeInTheDocument()
  })
})
