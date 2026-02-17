import { render, screen } from "@testing-library/react"
import { FollowingList } from "./FollowingList"
import { Id } from "@/convex/_generated/dataModel"

// Mock Convex hooks
const mockGetFollowing = jest.fn()

jest.mock("convex/react", () => ({
  useQuery: jest.fn((apiFunction) => {
    if (apiFunction === "follows:getFollowing") {
      return mockGetFollowing()
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

describe("FollowingList", () => {
  const userId = "user123" as Id<"users">

  const mockFollowing = [
    {
      _id: "following1" as Id<"users">,
      name: "Charlie Brown",
      role: "Faculty" as const,
      university: "Yale",
    },
    {
      _id: "following2" as Id<"users">,
      name: "Diana Prince",
      role: "Student" as const,
      university: "Princeton",
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should display loading state when data is undefined", () => {
    mockGetFollowing.mockReturnValue(undefined)
    render(<FollowingList userId={userId} />)

    expect(screen.getByText("Following")).toBeInTheDocument()
    // Check for loading skeletons
    const skeletons = document.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("should display empty state when not following anyone", () => {
    mockGetFollowing.mockReturnValue([])
    render(<FollowingList userId={userId} />)

    expect(screen.getByText("Following")).toBeInTheDocument()
    expect(screen.getByText("Not following anyone yet")).toBeInTheDocument()
  })

  it("should display list of following users", () => {
    mockGetFollowing.mockReturnValue(mockFollowing)
    render(<FollowingList userId={userId} />)

    expect(screen.getByText("Following (2)")).toBeInTheDocument()
    expect(screen.getByTestId("user-card-following1")).toBeInTheDocument()
    expect(screen.getByTestId("user-card-following2")).toBeInTheDocument()
  })

  it("should display following user names", () => {
    mockGetFollowing.mockReturnValue(mockFollowing)
    render(<FollowingList userId={userId} />)

    expect(screen.getByText("Charlie Brown")).toBeInTheDocument()
    expect(screen.getByText("Diana Prince")).toBeInTheDocument()
  })

  it("should display correct count in header", () => {
    mockGetFollowing.mockReturnValue(mockFollowing)
    render(<FollowingList userId={userId} />)

    expect(screen.getByText("Following (2)")).toBeInTheDocument()
  })

  it("should handle single following user", () => {
    mockGetFollowing.mockReturnValue([mockFollowing[0]])
    render(<FollowingList userId={userId} />)

    expect(screen.getByText("Following (1)")).toBeInTheDocument()
    expect(screen.getByTestId("user-card-following1")).toBeInTheDocument()
  })
})
