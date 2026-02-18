import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { NotificationBell } from "./NotificationBell"
import { useQuery } from "convex/react"
import { useRouter } from "next/navigation"

// Mock dependencies
jest.mock("convex/react")
jest.mock("next/navigation")
jest.mock("date-fns", () => ({
  formatDistanceToNow: jest.fn(() => "2 minutes ago"),
}))
jest.mock("../../../../convex/_generated/api", () => ({
  api: {
    notifications: {
      getUnreadCount: {},
      getRecentNotifications: {},
    },
  },
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockPush = jest.fn()

describe("NotificationBell", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any)
  })

  it("should render bell icon", () => {
    mockUseQuery.mockReturnValue(0)
    
    render(<NotificationBell />)
    
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument()
  })

  it("should show unread count badge when there are unread notifications", () => {
    mockUseQuery
      .mockReturnValueOnce(5) // unreadCount
      .mockReturnValueOnce([]) // recentNotifications
    
    render(<NotificationBell />)
    
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("should show 9+ badge when unread count exceeds 9", () => {
    mockUseQuery
      .mockReturnValueOnce(15) // unreadCount
      .mockReturnValueOnce([]) // recentNotifications
    
    render(<NotificationBell />)
    
    expect(screen.getByText("9+")).toBeInTheDocument()
  })

  it("should not show badge when unread count is 0", () => {
    mockUseQuery
      .mockReturnValueOnce(0) // unreadCount
      .mockReturnValueOnce([]) // recentNotifications
    
    render(<NotificationBell />)
    
    expect(screen.queryByText("0")).not.toBeInTheDocument()
  })

  it("should open dropdown when bell icon is clicked", () => {
    mockUseQuery
      .mockReturnValueOnce(0) // unreadCount
      .mockReturnValueOnce([]) // recentNotifications
    
    render(<NotificationBell />)
    
    const bellButton = screen.getByLabelText("Notifications")
    fireEvent.click(bellButton)
    
    expect(screen.getByText("Notifications")).toBeInTheDocument()
    expect(screen.getByText("View All")).toBeInTheDocument()
  })

  it("should show empty state when no notifications", () => {
    mockUseQuery
      .mockReturnValueOnce(0) // unreadCount
      .mockReturnValueOnce([]) // recentNotifications
    
    render(<NotificationBell />)
    
    const bellButton = screen.getByLabelText("Notifications")
    fireEvent.click(bellButton)
    
    expect(screen.getByText("No notifications yet")).toBeInTheDocument()
  })
})
