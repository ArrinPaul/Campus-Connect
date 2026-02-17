import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CommentComposer } from "./CommentComposer"
import { Id } from "@/convex/_generated/dataModel"

// Mock convex/react
const mockCreateComment = jest.fn()
jest.mock("convex/react", () => ({
  useMutation: jest.fn(() => mockCreateComment),
}))

// Mock the Convex API
jest.mock("../../../convex/_generated/api", () => ({
  api: {
    comments: {
      createComment: "comments:createComment",
    },
  },
}))

describe("CommentComposer", () => {
  const mockPostId = "test-post-id" as Id<"posts">
  const mockOnCommentAdded = jest.fn()

  beforeEach(() => {
    mockCreateComment.mockClear()
  })

  it("should render comment input and submit button", () => {
    render(<CommentComposer postId={mockPostId} />)

    expect(screen.getByPlaceholderText(/write a comment/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /comment/i })).toBeInTheDocument()
  })

  it("should display character counter", () => {
    render(<CommentComposer postId={mockPostId} />)

    expect(screen.getByText("0/1000")).toBeInTheDocument()
  })

  it("should update character counter as user types", () => {
    render(<CommentComposer postId={mockPostId} />)
    const textarea = screen.getByPlaceholderText(/write a comment/i)

    fireEvent.change(textarea, { target: { value: "Test comment" } })

    expect(screen.getByText("12/1000")).toBeInTheDocument()
  })

  it("should display error when comment is empty", async () => {
    render(<CommentComposer postId={mockPostId} />)
    const textarea = screen.getByPlaceholderText(/write a comment/i)

    // Submit the form directly (button is disabled but we test validation)
    fireEvent.submit(textarea.closest("form")!)

    expect(await screen.findByText(/comment cannot be empty/i)).toBeInTheDocument()
    expect(mockCreateComment).not.toHaveBeenCalled()
  })

  it("should display error when comment exceeds max length", async () => {
    render(<CommentComposer postId={mockPostId} />)
    const textarea = screen.getByPlaceholderText(/write a comment/i)
    const submitButton = screen.getByRole("button", { name: /comment/i })

    // Create a string longer than 1000 characters
    const longComment = "a".repeat(1001)
    fireEvent.change(textarea, { target: { value: longComment } })
    fireEvent.click(submitButton)

    expect(await screen.findByText(/comment must not exceed 1000 characters/i)).toBeInTheDocument()
    expect(mockCreateComment).not.toHaveBeenCalled()
  })

  it("should create comment with valid content", async () => {
    mockCreateComment.mockResolvedValue({ _id: "comment-id" })
    render(<CommentComposer postId={mockPostId} onCommentAdded={mockOnCommentAdded} />)
    const textarea = screen.getByPlaceholderText(/write a comment/i)
    const submitButton = screen.getByRole("button", { name: /comment/i })

    fireEvent.change(textarea, { target: { value: "Test comment content" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalledWith({
        postId: mockPostId,
        content: "Test comment content",
      })
    })
  })

  it("should clear input after successful comment", async () => {
    mockCreateComment.mockResolvedValue({ _id: "comment-id" })
    render(<CommentComposer postId={mockPostId} />)
    const textarea = screen.getByPlaceholderText(/write a comment/i) as HTMLTextAreaElement

    fireEvent.change(textarea, { target: { value: "Test comment" } })
    fireEvent.click(screen.getByRole("button", { name: /comment/i }))

    await waitFor(() => {
      expect(textarea.value).toBe("")
    })
  })

  it("should call onCommentAdded callback after successful comment", async () => {
    mockCreateComment.mockResolvedValue({ _id: "comment-id" })
    render(<CommentComposer postId={mockPostId} onCommentAdded={mockOnCommentAdded} />)
    const textarea = screen.getByPlaceholderText(/write a comment/i)

    fireEvent.change(textarea, { target: { value: "Test comment" } })
    fireEvent.click(screen.getByRole("button", { name: /comment/i }))

    await waitFor(() => {
      expect(mockOnCommentAdded).toHaveBeenCalled()
    })
  })

  it("should display error message when comment creation fails", async () => {
    mockCreateComment.mockRejectedValue(new Error("Failed to create comment"))
    render(<CommentComposer postId={mockPostId} />)
    const textarea = screen.getByPlaceholderText(/write a comment/i)

    fireEvent.change(textarea, { target: { value: "Test comment" } })
    fireEvent.click(screen.getByRole("button", { name: /comment/i }))

    expect(await screen.findByText(/failed to create comment/i)).toBeInTheDocument()
  })

  it("should disable submit button when input is empty", () => {
    render(<CommentComposer postId={mockPostId} />)
    const submitButton = screen.getByRole("button", { name: /comment/i })

    expect(submitButton).toBeDisabled()
  })

  it("should enable submit button when input has content", () => {
    render(<CommentComposer postId={mockPostId} />)
    const textarea = screen.getByPlaceholderText(/write a comment/i)
    const submitButton = screen.getByRole("button", { name: /comment/i })

    fireEvent.change(textarea, { target: { value: "Test" } })

    expect(submitButton).not.toBeDisabled()
  })

  it("should disable submit button while submitting", async () => {
    mockCreateComment.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))
    render(<CommentComposer postId={mockPostId} />)
    const textarea = screen.getByPlaceholderText(/write a comment/i)
    const submitButton = screen.getByRole("button", { name: /comment/i })

    fireEvent.change(textarea, { target: { value: "Test comment" } })
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/posting/i)).toBeInTheDocument()
  })

  it("should show character count in red when exceeding max length", () => {
    render(<CommentComposer postId={mockPostId} />)
    const textarea = screen.getByPlaceholderText(/write a comment/i)

    const longComment = "a".repeat(1001)
    fireEvent.change(textarea, { target: { value: longComment } })

    const counter = screen.getByText("1001/1000")
    expect(counter).toHaveClass("text-red-600")
  })

  it("should not submit when content is only whitespace", async () => {
    render(<CommentComposer postId={mockPostId} />)
    const textarea = screen.getByPlaceholderText(/write a comment/i)

    fireEvent.change(textarea, { target: { value: "   " } })
    fireEvent.submit(textarea.closest("form")!)

    expect(await screen.findByText(/comment cannot be empty/i)).toBeInTheDocument()
    expect(mockCreateComment).not.toHaveBeenCalled()
  })
})
