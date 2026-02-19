import { render, screen } from "@testing-library/react"
import FeedPage from "./page"

// Mock the components
jest.mock("@/components/posts/PostComposer", () => ({
  PostComposer: () => <div data-testid="post-composer">PostComposer</div>,
}))

jest.mock("@/components/feed/FeedContainer", () => ({
  FeedContainer: () => <div data-testid="feed-container">FeedContainer</div>,
}))

jest.mock("@/components/error-boundary", () => ({
  ErrorBoundary: ({ children }: any) => <div>{children}</div>,
}))

jest.mock("@/components/trending/TrendingHashtags", () => ({
  TrendingHashtags: () => <div data-testid="trending-hashtags">TrendingHashtags</div>,
}))

jest.mock("@/components/stories/StoryRow", () => ({
  StoryRow: () => <div data-testid="story-row">StoryRow</div>,
}))

jest.mock("convex/react", () => ({
  useQuery: jest.fn(() => null),
  useMutation: jest.fn(() => jest.fn()),
}))

describe("FeedPage", () => {
  it("should render PostComposer at the top", () => {
    render(<FeedPage />)
    
    const postComposer = screen.getByTestId("post-composer")
    expect(postComposer).toBeInTheDocument()
  })

  it("should render FeedContainer below PostComposer", () => {
    render(<FeedPage />)
    
    const feedContainer = screen.getByTestId("feed-container")
    expect(feedContainer).toBeInTheDocument()
  })

  it("should render both components in correct order", () => {
    const { container } = render(<FeedPage />)
    
    const postComposer = screen.getByTestId("post-composer")
    const feedContainer = screen.getByTestId("feed-container")
    
    // Check that PostComposer appears before FeedContainer in the DOM
    const postComposerIndex = Array.from(container.querySelectorAll("[data-testid]")).indexOf(postComposer)
    const feedContainerIndex = Array.from(container.querySelectorAll("[data-testid]")).indexOf(feedContainer)
    
    expect(postComposerIndex).toBeLessThan(feedContainerIndex)
  })

  it("should have proper layout structure", () => {
    render(<FeedPage />)
    
    // Check for the main container with proper responsive classes
    const mainContainer = document.querySelector(".max-w-7xl")
    expect(mainContainer).toBeInTheDocument()
  })

  it("should display 'Create a Post' heading", () => {
    render(<FeedPage />)
    
    const heading = screen.getByText("Create a Post")
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe("H2")
  })
})
