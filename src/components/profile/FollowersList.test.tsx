import { render, screen } from "@testing-library/react"
import { FollowersList } from "./FollowersList"
import { Id } from "@/convex/_generated/dataModel"

// Mock Convex hooks
const mockGetFollowers = jest.fn()

jest.mock("convex/react", () => ({
  useQuery: jest.fn((apiFunction) => {
    if (apiFunction === "follows:getFollowers") {
      return mockGetFollowers()
    }
    return null
  }),
}))

// Mock UserCard component
jest.mock("./UserCard", () => ({
  UserCard: ({ user }: any) => (
    <div data-testid={`user-card-${user._id}`}>
      {user.name}
    </div>
  ),
}))

describe("FollowersList", () => {
  const userId = "user123" as Id<"users">

  const mockFollowers = [
    {
      _id: "follower1" as Id<"users">,
      name: "Alice Johnson",
      role: "Student" as const,
      university: "MIT",
    },
    {
      _id: "follower2" as Id<"users">,
      name: "Bob Williams",
      role: "Research Scholar" as const,
      university: "Harvard",
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should display loading state when data is undefined", () => {
    mockGetFollowers.mockReturnValue(undefined)
    render(<FollowersList userId={userId} />)

    expect(screen.getByText("Followers")).toBeInTheDocument()
    // Check for loading skeletons
    const skeletons = document.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("should display empty state when no followers", () => {
    mockGetFollowers.mockReturnValue([])
    render(<FollowersList userId={userId} />)

    expect(screen.getByText("Followers")).toBeInTheDocument()
    expect(screen.getByText("No followers yet")).toBeInTheDocument()
  })

  it("should display list of followers", () => {
    mockGetFollowers.mockReturnValue(mockFollowers)
    render(<FollowersList userId={userId} />)

    expect(screen.getByText("Followers (2)")).toBeInTheDocument()
    expect(screen.getByTestId("user-card-follower1")).toBeInTheDocument()
    expect(screen.getByTestId("user-card-follower2")).toBeInTheDocument()
  })

  it("should display follower names", () => {
    mockGetFollowers.mockReturnValue(mockFollowers)
    render(<FollowersList userId={userId} />)

    expect(screen.getByText("Alice Johnson")).toBeInTheDocument()
    expect(screen.getByText("Bob Williams")).toBeInTheDocument()
  })

  it("should display correct count in header", () => {
    mockGetFollowers.mockReturnValue(mockFollowers)
    render(<FollowersList userId={userId} />)

    expect(screen.getByText("Followers (2)")).toBeInTheDocument()
  })

  it("should handle single follower", () => {
    mockGetFollowers.mockReturnValue([mockFollowers[0]])
    render(<FollowersList userId={userId} />)

    expect(screen.getByText("Followers (1)")).toBeInTheDocument()
    expect(screen.getByTestId("user-card-follower1")).toBeInTheDocument()
  })
})
