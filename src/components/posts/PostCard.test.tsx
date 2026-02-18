import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PostCard } from "./PostCard"
import { Id } from "@/convex/_generated/dataModel"

// Mock Convex hooks
const mockDeletePost = jest.fn()
const mockLikePost = jest.fn()
const mockUnlikePost = jest.fn()
const mockGetCurrentUser = jest.fn()
const mockHasUserLikedPost = jest.fn()

jest.mock("convex/react", () => ({
  useMutation: jest.fn((fn: any) => {
    if (fn === "posts:deletePost") return mockDeletePost
    if (fn === "posts:likePost") return mockLikePost
    if (fn === "posts:unlikePost") return mockUnlikePost
    return jest.fn()
  }),
  useQuery: jest.fn((fn: any, args?: any) => {
    if (fn === "users:getCurrentUser") return mockGetCurrentUser()
    if (fn === "posts:hasUserLikedPost") return mockHasUserLikedPost()
    return null
  }),
}))

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock child components that have complex dependencies
jest.mock("@/components/posts/ReactionPicker", () => ({
  ReactionPicker: () => <div data-testid="reaction-picker">Reactions</div>,
  ReactionSummary: () => <div data-testid="reaction-summary">Summary</div>,
}))

jest.mock("@/components/posts/ReactionModal", () => ({
  ReactionModal: () => null,
}))

jest.mock("@/components/posts/BookmarkButton", () => ({
  BookmarkButton: () => <button data-testid="bookmark-button">Bookmark</button>,
}))

jest.mock("@/components/posts/PostContent", () => ({
  PostContent: ({ content }: any) => <div data-testid="post-content">{content}</div>,
}))

jest.mock("@/components/posts/RepostModal", () => ({
  RepostModal: () => null,
}))

jest.mock("@/components/posts/CommentList", () => ({
  CommentList: () => <div data-testid="comment-list">Comments</div>,
}))

jest.mock("@/components/posts/CommentComposer", () => ({
  CommentComposer: () => <div data-testid="comment-composer">Composer</div>,
}))

jest.mock("lucide-react", () => ({
  Share2: (props: any) => <svg data-testid="share-icon" {...props} />,
  Copy: (props: any) => <svg {...props} />,
  Repeat2: (props: any) => <svg {...props} />,
}))

// Mock window.confirm
global.confirm = jest.fn()

describe("PostCard", () => {
  const mockAuthor = {
    _id: "user123" as Id<"users">,
    name: "John Doe",
    role: "Student" as const,
  }

  const mockPost = {
    _id: "post123" as Id<"posts">,
    authorId: "user123" as Id<"users">,
    content: "This is a test post content",
    likeCount: 5,
    commentCount: 3,
    shareCount: 0,
    createdAt: Date.now() - 3600000, // 1 hour ago
    updatedAt: Date.now() - 3600000,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCurrentUser.mockReturnValue(null)
    mockHasUserLikedPost.mockReturnValue(false)
  })

  it("should display post author info with avatar initial", () => {
    render(<PostCard post={mockPost} author={mockAuthor} />)

    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("J")).toBeInTheDocument() // Avatar initial
  })

  it("should display post author info with profile picture", () => {
    const authorWithPicture = {
      ...mockAuthor,
      profilePicture: "https://example.com/avatar.jpg",
    }

    render(<PostCard post={mockPost} author={authorWithPicture} />)

    const image = screen.getByAltText("John Doe")
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute("src", "https://example.com/avatar.jpg")
  })

  it("should display post content", () => {
    render(<PostCard post={mockPost} author={mockAuthor} />)

    expect(screen.getByText("This is a test post content")).toBeInTheDocument()
  })

  it("should display formatted timestamp", () => {
    render(<PostCard post={mockPost} author={mockAuthor} />)

    expect(screen.getByText("1h ago")).toBeInTheDocument()
  })

  it("should display reaction summary", () => {
    render(<PostCard post={mockPost} author={mockAuthor} />)

    expect(screen.getByTestId("reaction-summary")).toBeInTheDocument()
  })

  it("should display comment count", () => {
    render(<PostCard post={mockPost} author={mockAuthor} />)

    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("should show delete button for own posts", () => {
    mockGetCurrentUser.mockReturnValue({ _id: "user123" as Id<"users"> })

    render(<PostCard post={mockPost} author={mockAuthor} />)

    expect(screen.getByText("Delete")).toBeInTheDocument()
  })

  it("should not show delete button for other users' posts", () => {
    mockGetCurrentUser.mockReturnValue({ _id: "otherUser" as Id<"users"> })

    render(<PostCard post={mockPost} author={mockAuthor} />)

    expect(screen.queryByText("Delete")).not.toBeInTheDocument()
  })

  it("should handle delete post with confirmation", async () => {
    mockGetCurrentUser.mockReturnValue({ _id: "user123" as Id<"users"> })
    ;(global.confirm as jest.Mock).mockReturnValue(true)
    mockDeletePost.mockResolvedValue({ success: true })

    render(<PostCard post={mockPost} author={mockAuthor} />)

    const deleteButton = screen.getByText("Delete")
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this post?"
      )
      expect(mockDeletePost).toHaveBeenCalledWith({ postId: "post123" })
    })
  })

  it("should not delete post if confirmation is cancelled", async () => {
    mockGetCurrentUser.mockReturnValue({ _id: "user123" as Id<"users"> })
    ;(global.confirm as jest.Mock).mockReturnValue(false)

    render(<PostCard post={mockPost} author={mockAuthor} />)

    const deleteButton = screen.getByText("Delete")
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled()
      expect(mockDeletePost).not.toHaveBeenCalled()
    })
  })

  it("should show reaction picker when authenticated", () => {
    mockGetCurrentUser.mockReturnValue({ _id: "currentUser" as Id<"users"> })

    render(<PostCard post={mockPost} author={mockAuthor} />)

    expect(screen.getByTestId("reaction-picker")).toBeInTheDocument()
  })

  it("should not show reaction picker when not authenticated", () => {
    mockGetCurrentUser.mockReturnValue(null)

    render(<PostCard post={mockPost} author={mockAuthor} />)

    expect(screen.queryByTestId("reaction-picker")).not.toBeInTheDocument()
  })

  it("should render reaction summary with click handler", () => {
    render(<PostCard post={mockPost} author={mockAuthor} />)

    const reactionSummary = screen.getByTestId("reaction-summary")
    expect(reactionSummary).toBeInTheDocument()
  })

  it("should format timestamp as 'just now' for recent posts", () => {
    const recentPost = {
      ...mockPost,
      createdAt: Date.now() - 30000, // 30 seconds ago
    }

    render(<PostCard post={recentPost} author={mockAuthor} />)

    expect(screen.getByText("just now")).toBeInTheDocument()
  })

  it("should format timestamp as minutes for posts under 1 hour", () => {
    const recentPost = {
      ...mockPost,
      createdAt: Date.now() - 1800000, // 30 minutes ago
    }

    render(<PostCard post={recentPost} author={mockAuthor} />)

    expect(screen.getByText("30m ago")).toBeInTheDocument()
  })

  it("should format timestamp as days for posts under 1 week", () => {
    const oldPost = {
      ...mockPost,
      createdAt: Date.now() - 172800000, // 2 days ago
    }

    render(<PostCard post={oldPost} author={mockAuthor} />)

    expect(screen.getByText("2d ago")).toBeInTheDocument()
  })

  it("should format timestamp as date for posts over 1 week", () => {
    const oldPost = {
      ...mockPost,
      createdAt: Date.now() - 604800000 - 1000, // Over 1 week ago
    }

    render(<PostCard post={oldPost} author={mockAuthor} />)

    const dateText = screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/)
    expect(dateText).toBeInTheDocument()
  })

  it("should show bookmark button when authenticated", () => {
    mockGetCurrentUser.mockReturnValue({ _id: "currentUser" as Id<"users"> })

    render(<PostCard post={mockPost} author={mockAuthor} />)

    expect(screen.getByTestId("bookmark-button")).toBeInTheDocument()
  })
})
