import { render, screen } from "@testing-library/react"
import {
  PostSkeleton,
  UserCardSkeleton,
  ProfileHeaderSkeleton,
  LoadingSpinner,
  CommentSkeleton,
  FullPageLoadingSpinner,
  ButtonLoadingSpinner,
} from "./loading-skeleton"

describe("Loading Skeleton Components", () => {
  it("renders PostSkeleton", () => {
    const { container } = render(<PostSkeleton />)
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("renders UserCardSkeleton", () => {
    const { container } = render(<UserCardSkeleton />)
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("renders ProfileHeaderSkeleton", () => {
    const { container } = render(<ProfileHeaderSkeleton />)
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("renders LoadingSpinner with default size", () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })

  it("renders LoadingSpinner with custom size", () => {
    render(<LoadingSpinner size="lg" />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("renders CommentSkeleton", () => {
    const { container } = render(<CommentSkeleton />)
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("renders FullPageLoadingSpinner", () => {
    render(<FullPageLoadingSpinner />)
    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.getAllByText("Loading...").length).toBeGreaterThan(0)
  })

  it("renders ButtonLoadingSpinner", () => {
    const { container } = render(<ButtonLoadingSpinner />)
    expect(container.querySelector(".animate-spin")).toBeInTheDocument()
  })
})
