import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import BookmarksPage from "./page"

// Mock modules
vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(),
}))

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}))

vi.mock("@/convex/_generated/api", () => ({
  api: {
    bookmarks: {
      getCollections: "bookmarks:getCollections",
      getBookmarks: "bookmarks:getBookmarks",
    },
  },
}))

vi.mock("@/components/posts/PostCard", () => ({
  PostCard: vi.fn(({ post, author }) => (
    <div data-testid="post-card">
      <div>{post.content}</div>
      <div>{author.name}</div>
    </div>
  )),
}))

vi.mock("@/components/ui/tabs", () => ({
  Tabs: vi.fn(({ children }) => <div data-testid="tabs">{children}</div>),
  TabsContent: vi.fn(({ children }) => <div>{children}</div>),
  TabsList: vi.fn(({ children }) => <div data-testid="tabs-list">{children}</div>),
  TabsTrigger: vi.fn(({ children, value }) => (
    <button data-testid={`tab-${value}`}>{children}</button>
  )),
}))

import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"

describe("BookmarksPage", () => {
  const mockUseUser = useUser as any
  const mockUseQuery = useQuery as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should show loading state while auth is loading", () => {
    mockUseUser.mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
    })

    render(<BookmarksPage />)

    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument()
  })

  it("should show sign-in message when not authenticated", () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    })

    render(<BookmarksPage />)

    expect(screen.getByText("Sign in to view your bookmarks")).toBeInTheDocument()
    expect(screen.getByText("Bookmark posts to save them for later")).toBeInTheDocument()
  })

  it("should show empty state when no bookmarks", async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    })

    mockUseQuery.mockImplementation((query: string) => {
      if (query === "bookmarks:getCollections") {
        return []
      }
      if (query === "bookmarks:getBookmarks") {
        return { bookmarks: [], cursor: null }
      }
      return undefined
    })

    render(<BookmarksPage />)

    await waitFor(() => {
      expect(screen.getByText("No bookmarks yet")).toBeInTheDocument()
    })
  })

  it("should display bookmarks with tabs", async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    })

    const mockCollections = [
      { name: "Saved", count: 2 },
      { name: "Research", count: 1 },
    ]

    const mockBookmarks = [
      {
        _id: "bookmark1",
        postId: "post1",
        collectionName: "Saved",
        createdAt: Date.now(),
        post: {
          _id: "post1",
          authorId: "author1",
          content: "Test post 1",
          likeCount: 5,
          commentCount: 2,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        author: {
          _id: "author1",
          name: "Test Author",
          profilePicture: undefined,
          role: "Student",
        },
      },
    ]

    mockUseQuery.mockImplementation((query: string) => {
      if (query === "bookmarks:getCollections") {
        return mockCollections
      }
      if (query === "bookmarks:getBookmarks") {
        return { bookmarks: mockBookmarks, cursor: null }
      }
      return undefined
    })

    render(<BookmarksPage />)

    await waitFor(() => {
      expect(screen.getByTestId("tabs")).toBeInTheDocument()
      expect(screen.getByTestId("tab-All")).toBeInTheDocument()
      expect(screen.getByTestId("tab-Saved")).toBeInTheDocument()
      expect(screen.getByTestId("tab-Research")).toBeInTheDocument()
    })

    // Check if bookmarks are rendered
    await waitFor(() => {
      expect(screen.getByTestId("post-card")).toBeInTheDocument()
      expect(screen.getByText("Test post 1")).toBeInTheDocument()
      expect(screen.getByText("Test Author")).toBeInTheDocument()
    })
  })

  it("should show collection-specific empty state", async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    })

    mockUseQuery.mockImplementation((query: string, args?: any) => {
      if (query === "bookmarks:getCollections") {
        return [{ name: "Research", count: 0 }]
      }
      if (query === "bookmarks:getBookmarks") {
        return { bookmarks: [], cursor: null }
      }
      return undefined
    })

    render(<BookmarksPage />)

    await waitFor(() => {
      expect(screen.getByText("No bookmarks yet")).toBeInTheDocument()
    })
  })

  it("should show load more button when there are more bookmarks", async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    })

    const mockBookmarks = [
      {
        _id: "bookmark1",
        postId: "post1",
        collectionName: "Saved",
        createdAt: Date.now(),
        post: {
          _id: "post1",
          authorId: "author1",
          content: "Test post 1",
          likeCount: 5,
          commentCount: 2,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        author: {
          _id: "author1",
          name: "Test Author",
          profilePicture: undefined,
          role: "Student",
        },
      },
    ]

    mockUseQuery.mockImplementation((query: string) => {
      if (query === "bookmarks:getCollections") {
        return [{ name: "Saved", count: 25 }]
      }
      if (query === "bookmarks:getBookmarks") {
        return { bookmarks: mockBookmarks, cursor: "20" }
      }
      return undefined
    })

    render(<BookmarksPage />)

    await waitFor(() => {
      expect(screen.getByText("Load More")).toBeInTheDocument()
    })
  })

  it("should handle null post or author data gracefully", async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    })

    const mockBookmarks = [
      {
        _id: "bookmark1",
        postId: "post1",
        collectionName: "Saved",
        createdAt: Date.now(),
        post: null, // Deleted post
        author: null,
      },
      {
        _id: "bookmark2",
        postId: "post2",
        collectionName: "Saved",
        createdAt: Date.now(),
        post: {
          _id: "post2",
          authorId: "author2",
          content: "Valid post",
          likeCount: 5,
          commentCount: 2,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        author: {
          _id: "author2",
          name: "Valid Author",
          profilePicture: undefined,
          role: "Student",
        },
      },
    ]

    mockUseQuery.mockImplementation((query: string) => {
      if (query === "bookmarks:getCollections") {
        return [{ name: "Saved", count: 2 }]
      }
      if (query === "bookmarks:getBookmarks") {
        return { bookmarks: mockBookmarks, cursor: null }
      }
      return undefined
    })

    render(<BookmarksPage />)

    await waitFor(() => {
      // Should only render the valid post
      const postCards = screen.getAllByTestId("post-card")
      expect(postCards).toHaveLength(1)
      expect(screen.getByText("Valid post")).toBeInTheDocument()
    })
  })
})
