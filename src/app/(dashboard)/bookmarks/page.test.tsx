import { render, screen } from "@testing-library/react"
import BookmarksPage from "./page"

jest.mock("../../(components)/bookmarks/BookmarkedPostList", () => ({
  BookmarkedPostList: () => <div data-testid="bookmarked-post-list">Bookmarked Posts</div>,
}))

describe("BookmarksPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render the page heading", () => {
    render(<BookmarksPage />)
    expect(screen.getByText("Bookmarks")).toBeInTheDocument()
  })

  it("should render the BookmarkedPostList component", () => {
    render(<BookmarksPage />)
    expect(screen.getByTestId("bookmarked-post-list")).toBeInTheDocument()
  })

  it("should render heading as h1", () => {
    render(<BookmarksPage />)
    const heading = screen.getByText("Bookmarks")
    expect(heading.tagName).toBe("H1")
  })
})
