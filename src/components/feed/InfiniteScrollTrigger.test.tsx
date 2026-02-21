import { render, screen } from "@testing-library/react"
import { InfiniteScrollTrigger } from "./InfiniteScrollTrigger"

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
const mockObserve = jest.fn()
const mockUnobserve = jest.fn()
const mockDisconnect = jest.fn()

beforeAll(() => {
  mockIntersectionObserver.mockImplementation((callback) => {
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
      root: null,
      rootMargin: "",
      thresholds: [],
      takeRecords: () => [],
    }
  })
  global.IntersectionObserver = mockIntersectionObserver as any
})

describe("InfiniteScrollTrigger", () => {
  const mockOnTrigger = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render loading indicator when isLoading is true", () => {
    render(
      <InfiniteScrollTrigger
        onTrigger={mockOnTrigger}
        hasMore={true}
        isLoading={true}
      />
    )

    expect(screen.getByText("Loading more posts...")).toBeInTheDocument()
  })

  it("should render scroll prompt when not loading", () => {
    render(
      <InfiniteScrollTrigger
        onTrigger={mockOnTrigger}
        hasMore={true}
        isLoading={false}
      />
    )

    expect(screen.getByText("Scroll for more")).toBeInTheDocument()
  })

  it("should not render when hasMore is false", () => {
    const { container } = render(
      <InfiniteScrollTrigger
        onTrigger={mockOnTrigger}
        hasMore={false}
        isLoading={false}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it("should create IntersectionObserver when hasMore is true", () => {
    render(
      <InfiniteScrollTrigger
        onTrigger={mockOnTrigger}
        hasMore={true}
        isLoading={false}
      />
    )

    expect(mockIntersectionObserver).toHaveBeenCalled()
    expect(mockObserve).toHaveBeenCalled()
  })

  it("should not create IntersectionObserver when hasMore is false", () => {
    render(
      <InfiniteScrollTrigger
        onTrigger={mockOnTrigger}
        hasMore={false}
        isLoading={false}
      />
    )

    expect(mockObserve).not.toHaveBeenCalled()
  })

  it("should not create IntersectionObserver when isLoading is true", () => {
    render(
      <InfiniteScrollTrigger
        onTrigger={mockOnTrigger}
        hasMore={true}
        isLoading={true}
      />
    )

    // Observer should not be created when loading
    expect(mockObserve).not.toHaveBeenCalled()
  })

  it("should call onTrigger when element becomes visible", () => {
    let observerCallback: IntersectionObserverCallback | null = null

    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
        root: null,
        rootMargin: "",
        thresholds: [],
        takeRecords: () => [],
      }
    })

    render(
      <InfiniteScrollTrigger
        onTrigger={mockOnTrigger}
        hasMore={true}
        isLoading={false}
      />
    )

    // Simulate intersection
    observerCallback!(
        [
          {
            isIntersecting: true,
            target: document.createElement("div"),
            intersectionRatio: 0.5,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: Date.now(),
          },
        ],
        {} as IntersectionObserver
      )

    expect(mockOnTrigger).toHaveBeenCalled()
  })

  it("should not call onTrigger when element is not intersecting", () => {
    let observerCallback: IntersectionObserverCallback | null = null

    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
        root: null,
        rootMargin: "",
        thresholds: [],
        takeRecords: () => [],
      }
    })

    render(
      <InfiniteScrollTrigger
        onTrigger={mockOnTrigger}
        hasMore={true}
        isLoading={false}
      />
    )

    // Simulate no intersection
    observerCallback!(
        [
          {
            isIntersecting: false,
            target: document.createElement("div"),
            intersectionRatio: 0,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: Date.now(),
          },
        ],
        {} as IntersectionObserver
      )

    expect(mockOnTrigger).not.toHaveBeenCalled()
  })

  it("should cleanup observer on unmount", () => {
    const { unmount } = render(
      <InfiniteScrollTrigger
        onTrigger={mockOnTrigger}
        hasMore={true}
        isLoading={false}
      />
    )

    unmount()

    expect(mockUnobserve).toHaveBeenCalled()
  })
})
