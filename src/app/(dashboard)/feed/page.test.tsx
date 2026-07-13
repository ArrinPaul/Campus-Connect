import { render, screen } from "@testing-library/react"
import FeedPage from "./page"

// Mock the v2 feed components using @/ alias paths
jest.mock("@/app/(components)/feed/Feed", () => ({
  Feed: () => <div data-testid="feed">Feed</div>,
}))

jest.mock("@/app/(components)/feed/skeletons", () => ({
  FeedSkeleton: () => <div data-testid="feed-skeleton">Loading...</div>,
}))

describe("FeedPage", () => {
  it("should render the Feed component", () => {
    render(<FeedPage />)
    expect(screen.getByTestId("feed")).toBeInTheDocument()
  })

  it("should have a layout container", () => {
    const { container } = render(<FeedPage />)
    const div = container.querySelector(".min-h-screen")
    expect(div).toBeInTheDocument()
  })
})
