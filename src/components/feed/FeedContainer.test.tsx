import { render, screen } from "@testing-library/react"
import { FeedContainer } from "./FeedContainer"
import { useQuery } from "convex/react"
import { Id } from "@/convex/_generated/dataModel"

// Mock Convex hooks
const mockGetCurrentUser = jest.fn()
const mockHasUserLikedPost = jest.fn()

jest.mock("convex/react", () => ({
  useQuery: jest.fn((fn: any, args?: any) => {
    if (fn === "users:getCurrentUser") return mockGetCurrentUser()
    if (fn === "posts:hasUserLikedPost") return mockHasUserLikedPost()
    if (fn.toString().includes("getFeedPosts")) {
      return (useQuery as jest.MockedFunction<typeof useQuery>).mock.results[0]?.value
    }
    return null
  }),
  useMutation: jest.fn(() => jest.fn()),
}))

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe("FeedContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCurrentUser.mockReturnValue(null)
    mockHasUserLikedPost.mockReturnValue(false)
  })

  it("should display loading state while fetching posts", () => {
    // Return undefined to simulate loading
    mockUseQuery.mockReturnValue(undefined)

    render(<FeedContainer />)

    // Check for loading skeletons
    const skeletons = screen.getAllByRole("generic").filter((el) =>
      el.className.includes("animate-pulse")
    )
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("should display empty state when no posts exist", () => {
    mockUseQuery.mockReturnValue({
      posts: [],
      nextCursor: null,
      hasMore: false,
    })

    render(<FeedContainer />)

    expect(screen.getByText("No posts yet")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Be the first to share something or follow users to see their posts here."
      )
    ).toBeInTheDocument()
  })

  it("should display posts when data is available", () => {
    const mockPosts = [
      {
        _id: "post1" as Id<"posts">,
        _creationTime: Date.now(),
        authorId: "user1" as Id<"users">,
        content: "Test post 1",
        likeCount: 5,
        commentCount: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        author: {
          _id: "user1" as Id<"users">,
          _creationTime: Date.now(),
          clerkId: "clerk1",
          email: "user1@test.com",
          name: "User One",
          role: "Student" as const,
          experienceLevel: "Intermediate" as const,
          skills: [],
          socialLinks: {},
          followerCount: 0,
          followingCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
      {
        _id: "post2" as Id<"posts">,
        _creationTime: Date.now(),
        authorId: "user2" as Id<"users">,
        content: "Test post 2",
        likeCount: 3,
        commentCount: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        author: {
          _id: "user2" as Id<"users">,
          _creationTime: Date.now(),
          clerkId: "clerk2",
          email: "user2@test.com",
          name: "User Two",
          role: "Faculty" as const,
          experienceLevel: "Expert" as const,
          skills: [],
          socialLinks: {},
          followerCount: 0,
          followingCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    ]

    mockUseQuery.mockReturnValue({
      posts: mockPosts,
      nextCursor: null,
      hasMore: false,
    })

    render(<FeedContainer />)

    expect(screen.getByText("Test post 1")).toBeInTheDocument()
    expect(screen.getByText("Test post 2")).toBeInTheDocument()
    expect(screen.getByText("User One")).toBeInTheDocument()
    expect(screen.getByText("User Two")).toBeInTheDocument()
  })

  it("should skip posts without author data", () => {
    const mockPosts = [
      {
        _id: "post1" as Id<"posts">,
        _creationTime: Date.now(),
        authorId: "user1" as Id<"users">,
        content: "Test post with author",
        likeCount: 5,
        commentCount: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        author: {
          _id: "user1" as Id<"users">,
          _creationTime: Date.now(),
          clerkId: "clerk1",
          email: "user1@test.com",
          name: "User One",
          role: "Student" as const,
          experienceLevel: "Intermediate" as const,
          skills: [],
          socialLinks: {},
          followerCount: 0,
          followingCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
      {
        _id: "post2" as Id<"posts">,
        _creationTime: Date.now(),
        authorId: "user2" as Id<"users">,
        content: "Test post without author",
        likeCount: 3,
        commentCount: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        author: null,
      },
    ]

    mockUseQuery.mockReturnValue({
      posts: mockPosts,
      nextCursor: null,
      hasMore: false,
    })

    render(<FeedContainer />)

    // Should display post with author
    expect(screen.getByText("Test post with author")).toBeInTheDocument()
    expect(screen.getByText("User One")).toBeInTheDocument()

    // Should not display post without author
    expect(screen.queryByText("Test post without author")).not.toBeInTheDocument()
  })

  it("should handle empty posts array", () => {
    mockUseQuery.mockReturnValue({
      posts: [],
      nextCursor: null,
      hasMore: false,
    })

    render(<FeedContainer />)

    expect(screen.getByText("No posts yet")).toBeInTheDocument()
  })
})
