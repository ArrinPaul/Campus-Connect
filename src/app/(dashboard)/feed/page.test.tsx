import { render, screen } from "@testing-library/react"
import FeedPage from "./page"

// Mock the v2 feed components using @/ alias paths
jest.mock("@/app/(components)/feed/Feed", () => ({
  Feed: () => <div data-testid="feed">Feed</div>,
}))

jest.mock("@/app/(components)/feed/FeedRightSidebar", () => ({
  FeedRightSidebar: () => <div data-testid="feed-right-sidebar">FeedRightSidebar</div>,
}))

jest.mock("@/app/(components)/feed/skeletons", () => ({
  FeedSkeleton: () => <div data-testid="feed-skeleton">Loading...</div>,
}))

describe("FeedPage", () => {
  it("should render the Feed component", () => {
    render(<FeedPage />)
    expect(screen.getByTestId("feed")).toBeInTheDocument()
  })

  it("should render the FeedRightSidebar component", () => {
    render(<FeedPage />)
    expect(screen.getByTestId("feed-right-sidebar")).toBeInTheDocument()
  })

  it("should have a grid layout container", () => {
    const { container } = render(<FeedPage />)
    const grid = container.querySelector(".grid")
    expect(grid).toBeInTheDocument()
  })
})
