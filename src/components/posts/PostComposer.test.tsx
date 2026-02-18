import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PostComposer } from "./PostComposer"

// Mock convex/react
const mockCreatePost = jest.fn()
const mockUseQuery = jest.fn(() => undefined)
jest.mock("convex/react", () => ({
  useMutation: jest.fn(() => mockCreatePost),
  useQuery: jest.fn(() => mockUseQuery()),
}))

// Mock the Convex API
jest.mock("../../../convex/_generated/api", () => ({
  api: {
    posts: {
      createPost: "posts:createPost",
    },
    hashtags: {
      searchHashtags: "hashtags:searchHashtags",
    },
  },
}))

describe("PostComposer", () => {
  beforeEach(() => {
    mockCreatePost.mockClear()
  })

  it("should render textarea and submit button", () => {
    render(<PostComposer />)

    expect(screen.getByLabelText(/what's on your mind/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /post/i })).toBeInTheDocument()
  })

  it("should display character counter", () => {
    render(<PostComposer />)

    expect(screen.getByText("0/5000")).toBeInTheDocument()
  })

  it("should update character counter as user types", () => {
    render(<PostComposer />)
    const textarea = screen.getByRole("textbox")

    fireEvent.change(textarea, { target: { value: "Hello world" } })

    expect(screen.getByText("11/5000")).toBeInTheDocument()
  })

  it("should disable submit button when content is empty", () => {
    render(<PostComposer />)
    const submitButton = screen.getByRole("button", { name: /post/i })

    expect(submitButton).toBeDisabled()
  })

  it("should enable submit button when content is not empty", () => {
    render(<PostComposer />)
    const textarea = screen.getByRole("textbox")
    const submitButton = screen.getByRole("button", { name: /post/i })

    fireEvent.change(textarea, { target: { value: "Test post content" } })

    expect(submitButton).not.toBeDisabled()
  })

  it("should display error when submitting empty content", async () => {
    render(<PostComposer />)
    const textarea = screen.getByRole("textbox")
    const submitButton = screen.getByRole("button", { name: /post/i })

    // Add content then remove it to enable button
    fireEvent.change(textarea, { target: { value: "test" } })
    fireEvent.change(textarea, { target: { value: "" } })
    
    // Force submit by clicking (button should be disabled but test the validation)
    fireEvent.submit(screen.getByRole("textbox").closest("form")!)

    await waitFor(() => {
      expect(screen.getByText(/post content cannot be empty/i)).toBeInTheDocument()
    })
    expect(mockCreatePost).not.toHaveBeenCalled()
  })

  it("should display error when content exceeds 5000 characters", async () => {
    render(<PostComposer />)
    const textarea = screen.getByRole("textbox")
    const longContent = "a".repeat(5001)

    fireEvent.change(textarea, { target: { value: longContent } })
    fireEvent.submit(textarea.closest("form")!)

    await waitFor(() => {
      expect(
        screen.getByText(/post content must not exceed 5000 characters/i)
      ).toBeInTheDocument()
    })
    expect(mockCreatePost).not.toHaveBeenCalled()
  })

  it("should create post with valid content", async () => {
    mockCreatePost.mockResolvedValue({ _id: "post123" })
    render(<PostComposer />)
    const textarea = screen.getByRole("textbox")
    const submitButton = screen.getByRole("button", { name: /post/i })

    fireEvent.change(textarea, { target: { value: "Test post content" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith({ content: "Test post content" })
    })
  })

  it("should clear form after successful post", async () => {
    mockCreatePost.mockResolvedValue({ _id: "post123" })
    render(<PostComposer />)
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement

    fireEvent.change(textarea, { target: { value: "Test post content" } })
    fireEvent.submit(textarea.closest("form")!)

    await waitFor(() => {
      expect(textarea.value).toBe("")
    })
  })

  it("should call onPostCreated callback after successful post", async () => {
    mockCreatePost.mockResolvedValue({ _id: "post123" })
    const onPostCreated = jest.fn()
    render(<PostComposer onPostCreated={onPostCreated} />)
    const textarea = screen.getByRole("textbox")

    fireEvent.change(textarea, { target: { value: "Test post content" } })
    fireEvent.submit(textarea.closest("form")!)

    await waitFor(() => {
      expect(onPostCreated).toHaveBeenCalled()
    })
  })

  it("should display error message when post creation fails", async () => {
    mockCreatePost.mockRejectedValue(new Error("Network error"))
    render(<PostComposer />)
    const textarea = screen.getByRole("textbox")

    fireEvent.change(textarea, { target: { value: "Test post content" } })
    fireEvent.submit(textarea.closest("form")!)

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  it("should show loading state while submitting", async () => {
    mockCreatePost.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )
    render(<PostComposer />)
    const textarea = screen.getByRole("textbox")
    const submitButton = screen.getByRole("button", { name: /post/i })

    fireEvent.change(textarea, { target: { value: "Test post content" } })
    fireEvent.click(submitButton)

    expect(screen.getByRole("button", { name: /posting/i })).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^post$/i })).toBeInTheDocument()
    })
  })

  it("should highlight character counter in red when exceeding limit", () => {
    render(<PostComposer />)
    const textarea = screen.getByRole("textbox")
    const longContent = "a".repeat(5001)

    fireEvent.change(textarea, { target: { value: longContent } })

    const counter = screen.getByText("5001/5000")
    expect(counter).toHaveClass("text-red-600")
  })

  it("should trim whitespace when validating empty content", async () => {
    render(<PostComposer />)
    const textarea = screen.getByRole("textbox")

    fireEvent.change(textarea, { target: { value: "   " } })
    fireEvent.submit(textarea.closest("form")!)

    await waitFor(() => {
      expect(screen.getByText(/post content cannot be empty/i)).toBeInTheDocument()
    })
    expect(mockCreatePost).not.toHaveBeenCalled()
  })
})
