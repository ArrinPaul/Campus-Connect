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
    if (fn.toString().includes("getUnifiedFeed") || fn.toString().includes("getFeedPosts")) {
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

// Mock lucide-react
jest.mock("lucide-react", () => ({
  Repeat2: (props: any) => <svg data-testid="repeat-icon" {...props} />,
  Heart: (props: any) => <svg {...props} />,
  MessageCircle: (props: any) => <svg {...props} />,
  Bookmark: (props: any) => <svg {...props} />,
  Share2: (props: any) => <svg {...props} />,
  MoreHorizontal: (props: any) => <svg {...props} />,
  Copy: (props: any) => <svg {...props} />,
  ExternalLink: (props: any) => <svg {...props} />,
}))

// Mock PostCard to avoid deep dependency chain
jest.mock("@/components/posts/PostCard", () => ({
  PostCard: jest.fn(({ post, author }: any) => (
    <div data-testid="post-card">
      <div>{post.content}</div>
      <div>{author?.name}</div>
    </div>
  )),
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

  // Helper to wrap a post in unified feed item format
  const makePostItem = (post: any) => ({
    type: "post" as const,
    _id: post._id,
    sortKey: post.createdAt,
    post,
  })

  const makeAuthor = (overrides: any = {}) => ({
    _id: (overrides._id || "user1") as Id<"users">,
    _creationTime: Date.now(),
    clerkId: overrides.clerkId || "clerk1",
    email: overrides.email || "user1@test.com",
    name: overrides.name || "User One",
    role: overrides.role || ("Student" as const),
    experienceLevel: overrides.experienceLevel || ("Intermediate" as const),
    skills: [],
    socialLinks: {},
    followerCount: 0,
    followingCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  const makePost = (overrides: any = {}) => ({
    _id: (overrides._id || "post1") as Id<"posts">,
    _creationTime: Date.now(),
    authorId: (overrides.authorId || "user1") as Id<"users">,
    content: overrides.content || "Test post",
    likeCount: overrides.likeCount ?? 5,
    commentCount: overrides.commentCount ?? 2,
    shareCount: overrides.shareCount ?? 0,
    createdAt: overrides.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    author: overrides.author !== undefined ? overrides.author : makeAuthor(),
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
        items: [],
        nextCursor: null,
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
    const post1 = makePost({ _id: "post1", content: "Test post 1", authorId: "user1", author: makeAuthor({ _id: "user1", name: "User One" }) })
    const post2 = makePost({ _id: "post2", content: "Test post 2", authorId: "user2", author: makeAuthor({ _id: "user2", clerkId: "clerk2", email: "user2@test.com", name: "User Two", role: "Faculty", experienceLevel: "Expert" }) })

    mockQueryResults = [
      {
        items: [makePostItem(post1), makePostItem(post2)],
        nextCursor: null,
      },
    ]

    render(<FeedContainer />)

    expect(screen.getByText("Test post 1")).toBeInTheDocument()
    expect(screen.getByText("Test post 2")).toBeInTheDocument()
    expect(screen.getByText("User One")).toBeInTheDocument()
    expect(screen.getByText("User Two")).toBeInTheDocument()
  })

  it("should skip posts without author data", () => {
    const postWithAuthor = makePost({ _id: "post1", content: "Test post with author", author: makeAuthor({ name: "User One" }) })
    const postWithoutAuthor = makePost({ _id: "post2", content: "Test post without author", author: null })

    mockQueryResults = [
      {
        items: [makePostItem(postWithAuthor), makePostItem(postWithoutAuthor)],
        nextCursor: null,
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
        items: [],
        nextCursor: null,
      },
    ]

    render(<FeedContainer />)

    expect(screen.getByText("No posts yet")).toBeInTheDocument()
  })

  it("should display infinite scroll trigger when hasMore is true", () => {
    const post1 = makePost({ _id: "post1", content: "Test post 1", author: makeAuthor({ name: "User One" }) })

    mockQueryResults = [
      {
        items: [makePostItem(post1)],
        nextCursor: "cursor123",
      },
    ]

    render(<FeedContainer />)

    expect(screen.getByText("Scroll for more")).toBeInTheDocument()
  })

  it("should not display infinite scroll trigger when hasMore is false", () => {
    const post1 = makePost({ _id: "post1", content: "Test post 1", author: makeAuthor({ name: "User One" }) })

    mockQueryResults = [
      {
        items: [makePostItem(post1)],
        nextCursor: null,
      },
    ]

    render(<FeedContainer />)

    expect(screen.queryByText("Scroll for more")).not.toBeInTheDocument()
  })

  it("should handle real-time post updates", async () => {
    const initialPost = makePost({ _id: "post1", content: "Initial post", author: makeAuthor({ name: "User One" }) })
    const newPost = makePost({ _id: "post2", content: "New real-time post", likeCount: 0, commentCount: 0, authorId: "user2", author: makeAuthor({ _id: "user2", clerkId: "clerk2", email: "user2@test.com", name: "User Two", role: "Faculty", experienceLevel: "Expert" }) })

    // Initial data
    mockQueryResults = [
      {
        items: [makePostItem(initialPost)],
        nextCursor: null,
      },
    ]

    const { rerender } = render(<FeedContainer />)

    // Verify initial post is displayed
    expect(screen.getByText("Initial post")).toBeInTheDocument()
    expect(screen.queryByText("New real-time post")).not.toBeInTheDocument()

    // Simulate real-time update with new post
    mockQueryResults = [
      {
        items: [makePostItem(newPost), makePostItem(initialPost)],
        nextCursor: null,
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
