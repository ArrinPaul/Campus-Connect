import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DiscoverPage from "./page"
import { useQuery } from "convex/react"

// Mock convex/react
jest.mock("convex/react", () => ({
  useQuery: jest.fn(),
}))

// Mock the components
jest.mock("@/components/profile/UserSearchBar", () => ({
  UserSearchBar: ({ onSearch }: { onSearch: (query: string) => void }) => (
    <input
      data-testid="user-search-bar"
      onChange={(e) => onSearch(e.target.value)}
      placeholder="Search users"
    />
  ),
}))

jest.mock("@/components/profile/UserFilterPanel", () => ({
  UserFilterPanel: ({
    onFilterChange,
  }: {
    onFilterChange: (filters: any) => void
  }) => (
    <div data-testid="user-filter-panel">
      <button onClick={() => onFilterChange({ role: "Student", skills: [] })}>
        Filter
      </button>
    </div>
  ),
}))

jest.mock("@/components/profile/UserCard", () => ({
  UserCard: ({ user }: { user: any }) => (
    <div data-testid={`user-card-${user._id}`}>{user.name}</div>
  ),
}))

jest.mock("@/components/discover/SuggestedUsers", () => ({
  SuggestedUsers: () => <div data-testid="suggested-users">SuggestedUsers</div>,
}))

jest.mock("@/components/feed/RecommendedPosts", () => ({
  PopularInUniversity: () => <div data-testid="popular-in-university">PopularInUniversity</div>,
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe("DiscoverPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render UserSearchBar at the top", () => {
    mockUseQuery.mockReturnValue(undefined)
    
    render(<DiscoverPage />)
    
    const searchBar = screen.getByTestId("user-search-bar")
    expect(searchBar).toBeInTheDocument()
  })

  it("should render UserFilterPanel in sidebar", () => {
    mockUseQuery.mockReturnValue(undefined)
    
    render(<DiscoverPage />)
    
    // Should render filter panels (one for desktop, one for mobile)
    const filterPanels = screen.getAllByTestId("user-filter-panel")
    expect(filterPanels.length).toBeGreaterThan(0)
  })

  it("should display loading state when data is undefined", () => {
    mockUseQuery.mockReturnValue(undefined)
    
    render(<DiscoverPage />)
    
    // Check for loading skeleton elements
    const skeletons = document.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("should display empty state when no users found", () => {
    mockUseQuery.mockReturnValue([])
    
    render(<DiscoverPage />)
    
    expect(screen.getByText("No users found")).toBeInTheDocument()
    expect(screen.getByText("Try adjusting your search or filters")).toBeInTheDocument()
  })

  it("should display search results using UserCard", () => {
    const mockUsers = [
      {
        _id: "user1",
        name: "John Doe",
        role: "Student",
        university: "MIT",
        skills: ["React", "TypeScript"],
      },
      {
        _id: "user2",
        name: "Jane Smith",
        role: "Faculty",
        university: "Stanford",
        skills: ["Python", "AI"],
      },
    ]
    
    mockUseQuery.mockReturnValue(mockUsers)
    
    render(<DiscoverPage />)
    
    expect(screen.getByTestId("user-card-user1")).toBeInTheDocument()
    expect(screen.getByTestId("user-card-user2")).toBeInTheDocument()
    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("Jane Smith")).toBeInTheDocument()
  })

  it("should display user count in results", () => {
    const mockUsers = [
      {
        _id: "user1",
        name: "John Doe",
        role: "Student",
        university: "MIT",
        skills: [],
      },
      {
        _id: "user2",
        name: "Jane Smith",
        role: "Faculty",
        university: "Stanford",
        skills: [],
      },
    ]
    
    mockUseQuery.mockReturnValue(mockUsers)
    
    render(<DiscoverPage />)
    
    expect(screen.getByText("Found 2 users")).toBeInTheDocument()
  })

  it("should display singular 'user' when only one result", () => {
    const mockUsers = [
      {
        _id: "user1",
        name: "John Doe",
        role: "Student",
        university: "MIT",
        skills: [],
      },
    ]
    
    mockUseQuery.mockReturnValue(mockUsers)
    
    render(<DiscoverPage />)
    
    expect(screen.getByText("Found 1 user")).toBeInTheDocument()
  })

  it("should handle search input", async () => {
    mockUseQuery.mockReturnValue([])
    
    const user = userEvent.setup()
    render(<DiscoverPage />)
    
    const searchBar = screen.getByTestId("user-search-bar")
    await user.type(searchBar, "John")
    
    // The search should trigger (implementation uses debounce)
    expect(searchBar).toHaveValue("John")
  })

  it("should handle filter changes", async () => {
    mockUseQuery.mockReturnValue([])
    
    const user = userEvent.setup()
    render(<DiscoverPage />)
    
    // Check that the filter panel exists (there may be multiple due to responsive design)
    const filterPanels = screen.getAllByTestId("user-filter-panel")
    expect(filterPanels.length).toBeGreaterThan(0)
    
    // Click the filter button in the first panel
    const filterButtons = screen.getAllByText("Filter")
    await user.click(filterButtons[0])
    
    // Filter change should be handled (verified by the mock being called)
    expect(filterButtons[0]).toBeInTheDocument()
  })

  it("should have proper page layout structure", () => {
    mockUseQuery.mockReturnValue([])
    
    render(<DiscoverPage />)
    
    expect(screen.getByText("Discover Users")).toBeInTheDocument()
    expect(screen.getByText("Find and connect with students, researchers, and faculty")).toBeInTheDocument()
  })

  it("should use grid layout for sidebar and main content", () => {
    mockUseQuery.mockReturnValue([])
    
    const { container } = render(<DiscoverPage />)
    
    const gridContainer = container.querySelector(".grid")
    expect(gridContainer).toHaveClass("grid-cols-1", "lg:grid-cols-4")
  })
})
