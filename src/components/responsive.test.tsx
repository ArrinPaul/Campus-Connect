import { render, screen } from "@testing-library/react"
import { PostCard } from "./posts/PostCard"
import { UserCard } from "./profile/UserCard"
import { PostComposer } from "./posts/PostComposer"

// Mock Convex
jest.mock("convex/react", () => ({
  useMutation: jest.fn(() => jest.fn()),
  useAction: jest.fn(() => jest.fn()),
  useQuery: jest.fn(() => null),
}))

// Mock Next.js Image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock Next.js Link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  MockLink.displayName = "MockLink"
  return MockLink
})

// Mock PostCard child components
jest.mock("@/components/posts/ReactionPicker", () => ({
  ReactionPicker: () => <div data-testid="reaction-picker">Reactions</div>,
  ReactionSummary: () => <div data-testid="reaction-summary">Summary</div>,
}))
jest.mock("@/components/posts/ReactionModal", () => ({ ReactionModal: () => null }))
jest.mock("@/components/posts/BookmarkButton", () => ({ BookmarkButton: () => <button>Bookmark</button> }))
jest.mock("@/components/posts/PostContent", () => ({ PostContent: ({ content }: any) => <div>{content}</div> }))
jest.mock("@/components/posts/RepostModal", () => ({ RepostModal: () => null }))
jest.mock("@/components/posts/CommentList", () => ({ CommentList: () => <div>Comments</div> }))
jest.mock("@/components/posts/CommentComposer", () => ({ CommentComposer: () => <div>Composer</div> }))
jest.mock("lucide-react", () => ({
  Share2: (props: any) => <svg {...props} />,
  Copy: (props: any) => <svg {...props} />,
  Repeat2: (props: any) => <svg {...props} />,
  Send: (props: any) => <svg {...props} />,
  Hash: (props: any) => <svg {...props} />,
  AtSign: (props: any) => <svg {...props} />,
  MessageCircle: (props: any) => <svg {...props} />,
  // New icons used by PostComposer
  Image: (props: any) => <svg {...props} />,
  Video: (props: any) => <svg {...props} />,
  FileText: (props: any) => <svg {...props} />,
  X: (props: any) => <svg {...props} />,
  Link: (props: any) => <svg {...props} />,
  Loader2: (props: any) => <svg {...props} />,
}))

describe("Responsive Component Behavior", () => {
  describe("PostCard - Responsive Design", () => {
    const mockPost = {
      _id: "post1" as any,
      authorId: "user1" as any,
      content: "Test post content",
      likeCount: 5,
      commentCount: 3,
      shareCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const mockAuthor = {
      _id: "user1" as any,
      name: "Test User",
      role: "Student" as const,
    }

    it("should have responsive padding classes", () => {
      const { container } = render(<PostCard post={mockPost} author={mockAuthor} />)
      
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain("p-4")
      expect(card.className).toContain("sm:p-6")
    })

    it("should have responsive avatar sizes", () => {
      const { container } = render(<PostCard post={mockPost} author={mockAuthor} />)
      
      const avatar = container.querySelector(".relative")
      expect(avatar?.className).toContain("h-8")
      expect(avatar?.className).toContain("w-8")
      expect(avatar?.className).toContain("sm:h-10")
      expect(avatar?.className).toContain("sm:w-10")
    })

    it("should have responsive text sizes", () => {
      render(<PostCard post={mockPost} author={mockAuthor} />)
      
      const authorName = screen.getByText("Test User")
      expect(authorName.className).toContain("text-sm")
      expect(authorName.className).toContain("sm:text-base")
    })

    it("should have responsive spacing", () => {
      const { container } = render(<PostCard post={mockPost} author={mockAuthor} />)
      
      const contentDiv = container.querySelector(".mt-3")
      expect(contentDiv?.className).toContain("sm:mt-4")
    })

    it.skip("should have minimum touch target size for interactive elements", () => {
      // Skipped: PostCard child components are mocked, so interactive elements aren't available
      render(<PostCard post={mockPost} author={mockAuthor} />)
      
      const likeButton = screen.getByLabelText(/like post/i)
      const styles = window.getComputedStyle(likeButton)
      
      expect(styles.minWidth).toBe("44px")
      expect(styles.minHeight).toBe("44px")
    })
  })

  describe("UserCard - Responsive Design", () => {
    const mockUser = {
      _id: "user1" as any,
      name: "Test User",
      role: "Student" as const,
      university: "Test University",
      skills: ["React", "TypeScript", "Node.js"],
    }

    it("should have responsive padding classes", () => {
      const { container } = render(<UserCard user={mockUser} />)
      
      const card = container.querySelector("div")
      expect(card?.className).toContain("p-3")
      expect(card?.className).toContain("sm:p-4")
    })

    it("should have responsive avatar sizes", () => {
      const { container } = render(<UserCard user={mockUser} />)
      
      const avatar = container.querySelector(".relative")
      expect(avatar?.className).toContain("h-10")
      expect(avatar?.className).toContain("w-10")
      expect(avatar?.className).toContain("sm:h-12")
      expect(avatar?.className).toContain("sm:w-12")
    })

    it("should have responsive text sizes", () => {
      render(<UserCard user={mockUser} />)
      
      const userName = screen.getByText("Test User")
      expect(userName.className).toContain("text-sm")
      expect(userName.className).toContain("sm:text-base")
    })

    it("should have responsive layout for role and university", () => {
      const { container } = render(<UserCard user={mockUser} />)
      
      const infoContainer = container.querySelector(".flex.flex-col")
      expect(infoContainer?.className).toContain("sm:flex-row")
    })
  })

  describe("PostComposer - Responsive Design", () => {
    it("should have responsive spacing classes", () => {
      const { container } = render(<PostComposer />)
      
      const form = container.querySelector("form")
      expect(form?.className).toContain("space-y-3")
      expect(form?.className).toContain("sm:space-y-4")
    })

    it("should have responsive text sizes", () => {
      const { container } = render(<PostComposer />)
      
      const characterCount = container.querySelector(".text-xs")
      expect(characterCount?.className).toContain("sm:text-sm")
    })

    it("should have minimum touch target size for submit button", () => {
      render(<PostComposer />)
      
      const submitButton = screen.getByRole("button", { name: /post/i })
      const styles = window.getComputedStyle(submitButton)
      
      expect(styles.minHeight).toBe("44px")
    })

    it("should have responsive button text size", () => {
      render(<PostComposer />)
      
      const submitButton = screen.getByRole("button", { name: /post/i })
      expect(submitButton.className).toContain("text-sm")
      expect(submitButton.className).toContain("sm:text-base")
    })
  })

  describe("Touch Target Sizes", () => {
    it("should ensure all buttons meet 44x44px minimum touch target", () => {
      const mockPost = {
        _id: "post1" as any,
        authorId: "user1" as any,
        content: "Test post",
        likeCount: 0,
        commentCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const mockAuthor = {
        _id: "user1" as any,
        name: "Test User",
        role: "Student" as const,
      }

      render(<PostCard post={mockPost} author={mockAuthor} />)
      
      const buttons = screen.getAllByRole("button")
      
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button)
        const minWidth = parseInt(styles.minWidth)
        const minHeight = parseInt(styles.minHeight)
        
        // Touch targets should be at least 44x44px
        expect(minWidth).toBeGreaterThanOrEqual(44)
        expect(minHeight).toBeGreaterThanOrEqual(44)
      })
    })
  })

  describe("Responsive Breakpoints", () => {
    it("should use standard Tailwind breakpoints", () => {
      // This test verifies that we're using standard breakpoints:
      // sm: 640px, md: 768px, lg: 1024px
      
      const mockPost = {
        _id: "post1" as any,
        authorId: "user1" as any,
        content: "Test",
        likeCount: 0,
        commentCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const mockAuthor = {
        _id: "user1" as any,
        name: "Test User",
        role: "Student" as const,
      }

      const { container } = render(<PostCard post={mockPost} author={mockAuthor} />)
      
      // Check for sm: breakpoint classes
      const smClasses = container.innerHTML.match(/sm:/g)
      expect(smClasses).toBeTruthy()
      expect(smClasses!.length).toBeGreaterThan(0)
    })
  })
})
