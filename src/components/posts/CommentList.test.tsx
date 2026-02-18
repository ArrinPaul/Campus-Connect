import { render, screen } from "@testing-library/react"
import { CommentList } from "./CommentList"
import { Id } from "@/convex/_generated/dataModel"

// Mock convex/react
jest.mock("convex/react", () => ({
  useMutation: jest.fn(() => jest.fn()),
  useQuery: jest.fn(() => null),
}))

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

describe("CommentList", () => {
  const mockPostId = "post123" as Id<"posts">
  
  const mockComments = [
    {
      _id: "comment1" as Id<"comments">,
      postId: mockPostId,
      authorId: "user1" as Id<"users">,
      content: "First comment",
      createdAt: Date.now() - 3600000, // 1 hour ago
      author: {
        _id: "user1" as Id<"users">,
        name: "John Doe",
        profilePicture: "https://example.com/avatar1.jpg",
        role: "Student" as const,
      },
    },
    {
      _id: "comment2" as Id<"comments">,
      postId: mockPostId,
      authorId: "user2" as Id<"users">,
      content: "Second comment",
      createdAt: Date.now() - 1800000, // 30 minutes ago
      author: {
        _id: "user2" as Id<"users">,
        name: "Jane Smith",
        role: "Faculty" as const,
      },
    },
  ]

  it("should display all comments", () => {
    render(<CommentList postId={mockPostId} comments={mockComments} />)

    expect(screen.getByText("First comment")).toBeInTheDocument()
    expect(screen.getByText("Second comment")).toBeInTheDocument()
  })

  it("should display comment author names", () => {
    render(<CommentList postId={mockPostId} comments={mockComments} />)

    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("Jane Smith")).toBeInTheDocument()
  })

  it("should display comment timestamps", () => {
    render(<CommentList postId={mockPostId} comments={mockComments} />)

    // Check for relative time format (e.g., "1h ago", "30m ago")
    const timestamps = screen.getAllByText(/ago|just now/)
    expect(timestamps.length).toBeGreaterThan(0)
  })

  it("should display comments in chronological order (oldest first)", () => {
    render(<CommentList postId={mockPostId} comments={mockComments} />)

    const comments = screen.getAllByText(/comment/)
    expect(comments[0]).toHaveTextContent("First comment")
    expect(comments[1]).toHaveTextContent("Second comment")
  })

  it("should handle empty state when no comments", () => {
    render(<CommentList postId={mockPostId} comments={[]} />)

    expect(
      screen.getByText("No comments yet. Be the first to comment!")
    ).toBeInTheDocument()
  })

  it("should display author avatar when profilePicture is provided", () => {
    render(<CommentList postId={mockPostId} comments={[mockComments[0]]} />)

    const avatar = screen.getByAltText("John Doe")
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute("src")
  })

  it("should display author initials when no profilePicture", () => {
    render(<CommentList postId={mockPostId} comments={[mockComments[1]]} />)

    expect(screen.getByText("J")).toBeInTheDocument()
  })

  it("should handle missing author gracefully", () => {
    const commentWithoutAuthor = {
      ...mockComments[0],
      author: null,
    }

    render(<CommentList postId={mockPostId} comments={[commentWithoutAuthor]} />)

    expect(screen.getByText("Unknown User")).toBeInTheDocument()
    expect(screen.getByText("?")).toBeInTheDocument()
  })

  it("should format timestamps correctly for different time ranges", () => {
    const now = Date.now()
    const commentsWithDifferentTimes = [
      {
        ...mockComments[0],
        _id: "c1" as Id<"comments">,
        createdAt: now - 30000, // 30 seconds ago
      },
      {
        ...mockComments[0],
        _id: "c2" as Id<"comments">,
        createdAt: now - 300000, // 5 minutes ago
      },
      {
        ...mockComments[0],
        _id: "c3" as Id<"comments">,
        createdAt: now - 7200000, // 2 hours ago
      },
      {
        ...mockComments[0],
        _id: "c4" as Id<"comments">,
        createdAt: now - 172800000, // 2 days ago
      },
    ]

    render(<CommentList postId={mockPostId} comments={commentsWithDifferentTimes} />)

    // Check that various time formats are present
    expect(screen.getByText("just now")).toBeInTheDocument()
    expect(screen.getByText(/\d+m ago/)).toBeInTheDocument()
    expect(screen.getByText(/\d+h ago/)).toBeInTheDocument()
    expect(screen.getByText(/\d+d ago/)).toBeInTheDocument()
  })

  it("should preserve whitespace in comment content", () => {
    const commentWithWhitespace = {
      ...mockComments[0],
      content: "Line 1\nLine 2\n\nLine 3",
    }

    render(<CommentList postId={mockPostId} comments={[commentWithWhitespace]} />)

    const content = screen.getByText(/Line 1/)
    // The whitespace-pre-wrap class may be on the element itself or its parent
    const hasClass = content.classList.contains("whitespace-pre-wrap") || 
                     content.parentElement?.classList.contains("whitespace-pre-wrap") ||
                     content.closest(".whitespace-pre-wrap") !== null
    expect(hasClass).toBe(true)
  })
})
