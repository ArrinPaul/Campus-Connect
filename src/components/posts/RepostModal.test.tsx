import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { RepostModal } from "./RepostModal"
import { useMutation } from "convex/react"

// Mock dependencies
jest.mock("convex/react")
jest.mock("lucide-react", () => ({
  X: () => <div data-testid="x-icon">X</div>,
}))
jest.mock("../../../../convex/_generated/api", () => ({
  api: {
    reposts: {
      createRepost: {},
    },
  },
}))

const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>
const mockCreateRepost = jest.fn()

const mockPost = {
  _id: "post123" as any,
  content: "This is a test post",
  authorId: "author123" as any,
  createdAt: Date.now(),
  likeCount: 5,
  commentCount: 2,
  shareCount: 1,
  author: {
    _id: "author123" as any,
    name: "Test Author",
    username: "testauthor",
    clerkId: "clerk123",
    imageUrl: "https://example.com/image.jpg",
    bio: "Test bio",
    createdAt: Date.now(),
  },
}

describe("RepostModal", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMutation.mockReturnValue(mockCreateRepost)
  })

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <RepostModal
        post={mockPost}
        isOpen={false}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it("should render modal when isOpen is true", () => {
    render(
      <RepostModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    )
    
    expect(screen.getByRole("heading", { name: "Repost" })).toBeInTheDocument()
    expect(screen.getByText("This is a test post")).toBeInTheDocument()
  })

  it("should show original post author info", () => {
    render(
      <RepostModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    )
    
    expect(screen.getByText("Test Author")).toBeInTheDocument()
  })

  it("should update character count as user types", () => {
    render(
      <RepostModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    )
    
    const textarea = screen.getByPlaceholderText("What do you think about this?")
    
    fireEvent.change(textarea, { target: { value: "Great post!" } })
    
    expect(screen.getByText("11/500")).toBeInTheDocument()
  })

  it("should show error when character limit is exceeded", () => {
    render(
      <RepostModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    )
    
    const textarea = screen.getByPlaceholderText("What do you think about this?")
    const longText = "a".repeat(501)
    
    fireEvent.change(textarea, { target: { value: longText } })
    
    // Check that count is shown in red when over limit
    const charCount = screen.getByText("501/500")
    expect(charCount).toHaveClass("text-red-600", "dark:text-red-400")
  })

  it("should accept quote content within limit", () => {
    render(
      <RepostModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    )
    
    const textarea = screen.getByPlaceholderText("What do you think about this?")
    fireEvent.change(textarea, { target: { value: "Great insights!" } })
    
    expect(screen.getByText("15/500")).toBeInTheDocument()
  })

  it("should accept quote at exactly 500 characters", () => {
    render(
      <RepostModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    )
    
    const textarea = screen.getByPlaceholderText("What do you think about this?")
    const exactLimit = "a".repeat(500)
    fireEvent.change(textarea, { target: { value: exactLimit } })
    
    expect(screen.getByText("500/500")).toBeInTheDocument()
  })

  it("should show correct char count for empty input", () => {
    render(
      <RepostModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    )
    
    expect(screen.getByText("0/500")).toBeInTheDocument()
  })

  it("should have textarea for quote content", () => {
    render(
      <RepostModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    )
    
    const textarea = screen.getByPlaceholderText("What do you think about this?")
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveAttribute("maxLength", "500")
  })

  it("should show original post content", () => {
    render(
      <RepostModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    )
    
    expect(screen.getByText("This is a test post")).toBeInTheDocument()
  })

  it("should have buttons for actions", () => {
    render(
      <RepostModal
        post={mockPost}
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    )
    
    expect(screen.getByText("Cancel")).toBeInTheDocument()
    expect(screen.getByText("Quote Post")).toBeInTheDocument()
  })
})
