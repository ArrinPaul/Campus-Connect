import { render, screen, waitFor } from "@testing-library/react"
import { FeedContainer } from "./FeedContainer"
import { useQuery } from "convex/react"
import { Id } from "@/convex/_generated/dataModel"

// Mock Convex hooks
const mockGetCurrentUser = jest.fn()
const mockHasUserLikedPost = jest.fn()
let queryCallCount = 0
let mockQueryResults: any[] = []

jest.mock("convex/react", () => ({
  useQuery: jest.fn((fn: any, args?: any) => {
    if (fn === "users:getCurrentUser") return mockGetCurrentUser()
    if (fn === "posts:hasUserLikedPost") return mockHasUserLikedPost()
    if (fn.toString().includes("getFeedPosts")) {
      // Handle multiple queries for pagination
      const result = mockQueryResults[queryCallCount] || mockQueryResults[0]
      if (args !== "skip") {
        queryCallCount++
      }
      return result
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

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
const mockObserve = jest.fn()
const mockUnobserve = jest.fn()

beforeAll(() => {
  mockIntersectionObserver.mockImplementation((callback) => {
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: jest.fn(),
      root: null,
      rootMargin: "",
      thresholds: [],
      takeRecords: () => [],
    }
  })
  global.IntersectionObserver = mockIntersectionObserver as any
})

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe("FeedContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    queryCallCount = 0
    mockQueryResults = []
    mockGetCurrentUser.mockReturnValue(null)
    mockHasUserLikedPost.mockReturnValue(false)
  })

  it("should display loading state while fetching posts", () => {
    // Return undefined to simulate loading
    mockQueryResults = [undefined]

    render(<FeedContainer />)

    // Check for loading skeletons
    const skeletons = screen.getAllByRole("generic").filter((el) =>
      el.className.includes("animate-pulse")
    )
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("should display empty state when no posts exist", () => {
    mockQueryResults = [
      {
        posts: [],
        nextCursor: null,
        hasMore: false,
      },
    ]

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

    mockQueryResults = [
      {
        posts: mockPosts,
        nextCursor: null,
        hasMore: false,
      },
    ]

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

    mockQueryResults = [
      {
        posts: mockPosts,
        nextCursor: null,
        hasMore: false,
      },
    ]

    render(<FeedContainer />)

    // Should display post with author
    expect(screen.getByText("Test post with author")).toBeInTheDocument()
    expect(screen.getByText("User One")).toBeInTheDocument()

    // Should not display post without author
    expect(screen.queryByText("Test post without author")).not.toBeInTheDocument()
  })

  it("should handle empty posts array", () => {
    mockQueryResults = [
      {
        posts: [],
        nextCursor: null,
        hasMore: false,
      },
    ]

    render(<FeedContainer />)

    expect(screen.getByText("No posts yet")).toBeInTheDocument()
  })

  it("should display infinite scroll trigger when hasMore is true", () => {
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
    ]

    mockQueryResults = [
      {
        posts: mockPosts,
        nextCursor: "cursor123",
        hasMore: true,
      },
    ]

    render(<FeedContainer />)

    expect(screen.getByText("Scroll for more")).toBeInTheDocument()
  })

  it("should not display infinite scroll trigger when hasMore is false", () => {
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
    ]

    mockQueryResults = [
      {
        posts: mockPosts,
        nextCursor: null,
        hasMore: false,
      },
    ]

    render(<FeedContainer />)

    expect(screen.queryByText("Scroll for more")).not.toBeInTheDocument()
  })

  it("should handle real-time post updates", async () => {
    const initialPost = {
      _id: "post1" as Id<"posts">,
      _creationTime: Date.now(),
      authorId: "user1" as Id<"users">,
      content: "Initial post",
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
    }

    const newPost = {
      _id: "post2" as Id<"posts">,
      _creationTime: Date.now(),
      authorId: "user2" as Id<"users">,
      content: "New real-time post",
      likeCount: 0,
      commentCount: 0,
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
    }

    // Initial data
    mockQueryResults = [
      {
        posts: [initialPost],
        nextCursor: null,
        hasMore: false,
      },
    ]

    const { rerender } = render(<FeedContainer />)

    // Verify initial post is displayed
    expect(screen.getByText("Initial post")).toBeInTheDocument()
    expect(screen.queryByText("New real-time post")).not.toBeInTheDocument()

    // Simulate real-time update with new post
    mockQueryResults = [
      {
        posts: [newPost, initialPost],
        nextCursor: null,
        hasMore: false,
      },
    ]

    // Force re-render to simulate Convex real-time update
    rerender(<FeedContainer />)

    // Wait for the new post to appear
    await waitFor(() => {
      expect(screen.getByText("New real-time post")).toBeInTheDocument()
    })

    // Verify both posts are displayed
    expect(screen.getByText("Initial post")).toBeInTheDocument()
    expect(screen.getByText("New real-time post")).toBeInTheDocument()
  })
})
