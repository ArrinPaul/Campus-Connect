import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PostComposer } from "./PostComposer"

// Mock the RichTextEditor to avoid ESM/TipTap dependencies in Jest
jest.mock("browser-image-compression", () => jest.fn((file) => Promise.resolve(file)))

jest.mock("@/components/editor/RichTextEditor", () => ({
  RichTextEditor: ({
    value,
    onChange,
    placeholder,
    maxLength,
    disabled,
  }: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    maxLength?: number
    disabled?: boolean
  }) => (
    <div>
      <textarea
        aria-label="What's on your mind?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {maxLength != null && (
        <span
          className={
            value.length > maxLength
              ? "text-destructive dark:text-red-400"
              : "text-muted-foreground"
          }
        >
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  ),
}))

// Mock @/lib/api
const mockCreatePost = jest.fn()
const mockGenerateUploadUrl = jest.fn()
const mockResolveStorageUrls = jest.fn()
const mockFetchLinkPreview = jest.fn()
const mockUseQuery = jest.fn(() => undefined)
jest.mock("@/lib/api", () => ({
  useMutation: jest.fn((ref: any) => {
    const endpoint = typeof ref === "object" ? ref?.endpoint : ref
    if (endpoint === "posts:createPost" || endpoint === "/api/posts") return mockCreatePost
    if (endpoint === "media:generateUploadUrl" || endpoint === "/api/media/upload-url") return mockGenerateUploadUrl
    if (endpoint === "media:resolveStorageUrls" || endpoint === "/api/media/resolve-urls") return mockResolveStorageUrls
    return jest.fn()
  }),
  useAction: jest.fn((ref: any) => {
    const endpoint = typeof ref === "object" ? ref?.endpoint : ref
    if (endpoint === "media:fetchLinkPreview" || endpoint === "/api/media/preview") return mockFetchLinkPreview
    return jest.fn()
  }),
  useQuery: jest.fn(() => mockUseQuery()),
  useConvexAuth: jest.fn(() => ({ isAuthenticated: true, isLoading: false })),
  api: {
    posts: {
      createPost: "posts:createPost",
    },
    hashtags: {
      searchHashtags: "hashtags:searchHashtags",
    },
    media: {
      generateUploadUrl: "media:generateUploadUrl",
      resolveStorageUrls: "media:resolveStorageUrls",
      fetchLinkPreview: "media:fetchLinkPreview",
    },
    polls: {
      createPoll: "polls:createPoll",
      linkPollToPost: "polls:linkPollToPost",
    },
  },
}))

describe("PostComposer", () => {
  beforeEach(() => {
    mockCreatePost.mockClear()
    mockGenerateUploadUrl.mockClear()
    mockResolveStorageUrls.mockClear()
    mockFetchLinkPreview.mockClear()
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
    expect(counter).toHaveClass("text-destructive")
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

  it("should handle direct binary image upload and create post with mediaUrls", async () => {
    mockGenerateUploadUrl.mockResolvedValueOnce({
      uploadUrl: "https://supabase.example.com/storage/v1/object/upload/sign/media/test.jpg",
      publicUrl: "https://supabase.example.com/storage/v1/object/public/media/test.jpg",
      path: "user-1/test.jpg",
    })
    mockCreatePost.mockResolvedValueOnce("post-123")

    render(<PostComposer />)
    const fileInput = document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    const file = new File(["test-image-binary"], "photo.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTitle("Remove image")).toBeInTheDocument()
    })

    const textarea = screen.getByRole("textbox")
    fireEvent.change(textarea, { target: { value: "Post with uploaded photo" } })

    const submitButton = screen.getByRole("button", { name: /post/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockGenerateUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: "photo.png",
          fileType: "image/png",
          uploadType: "image",
          bucket: "media",
        })
      )
      expect(mockCreatePost).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Post with uploaded photo",
          mediaUrls: ["https://supabase.example.com/storage/v1/object/public/media/test.jpg"],
          mediaType: "image",
        })
      )
    })
  })

  it("should reject image files that exceed max size", async () => {
    render(<PostComposer />)
    const fileInput = document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement

    // 15MB file (exceeds 10MB limit)
    const oversizedFile = new File([new ArrayBuffer(15 * 1024 * 1024)], "large.png", { type: "image/png" })
    Object.defineProperty(oversizedFile, "size", { value: 15 * 1024 * 1024 })

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } })

    await waitFor(() => {
      expect(screen.getByText(/images must be under 10 mb/i)).toBeInTheDocument()
    })
  })
})
