import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { NotificationBell } from "./NotificationBell"
import { useQuery, useMutation, api } from "@/lib/api"
import { useRouter } from "next/navigation"

jest.mock("@/lib/api", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(() => jest.fn()),
  useConvexAuth: jest.fn(() => ({ isAuthenticated: true, isLoading: false })),
  api: {
    notifications: {
      getUnreadCount: {},
      getRecentNotifications: {},
    },
  },
}))
jest.mock("next/navigation")
jest.mock("@/components/accessibility/LiveRegion", () => ({
  useLiveRegion: jest.fn(() => ({ announce: jest.fn() })),
  LiveRegion: ({ children }: any) => children,
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockPush = jest.fn()
const mockMarkAsRead = jest.fn().mockResolvedValue({ success: true })

describe("NotificationBell", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any)
    mockUseMutation.mockReturnValue(mockMarkAsRead)
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

  // Regression: the dropdown previously read notification.actor, .isRead,
  // .createdAt, .actorId, .referenceId, ._id — none of which exist on the
  // real API response (from_user, read, created_at, from_user_id,
  // reference_id, id). Never caught because every other test here mocks an
  // empty notification list. formatDistanceToNow was also fully mocked out
  // before, which hid that the real field, even with the right name, is an
  // ISO string that needs wrapping in `new Date(...)` — date-fns does not
  // accept a raw string.
  it("renders a real notification without crashing and with the right content", () => {
    const realNotification = {
      id: "notif-1",
      type: "like",
      message: "Alice liked your post",
      reference_type: "post",
      reference_id: "post-1",
      from_user_id: "alice-1",
      from_user: { id: "alice-1", name: "Alice", profile_picture: null },
      read: false,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    }
    // mockImplementation (not mockReturnValueOnce) because clicking the
    // bell triggers a re-render, which calls useQuery again — a
    // once-queue only covers the first render and silently falls back to
    // undefined on the second, which looks exactly like "no notifications".
    mockUseQuery.mockImplementation((endpoint: any) => {
      if (endpoint === api.notifications.getUnreadCount) return 1
      return [realNotification]
    })

    render(<NotificationBell />)
    fireEvent.click(screen.getByLabelText(/Notifications/))

    expect(screen.getByText("Alice liked your post")).toBeInTheDocument()
    expect(screen.getByText("A")).toBeInTheDocument() // avatar fallback initial
    expect(screen.getByText(/minutes? ago/)).toBeInTheDocument()
  })

  it("clicking a notification marks it read and navigates to the right URL", () => {
    const realNotification = {
      id: "notif-1",
      type: "like",
      message: "Alice liked your post",
      reference_type: "post",
      reference_id: "post-1",
      from_user_id: "alice-1",
      from_user: { id: "alice-1", name: "Alice", profile_picture: null },
      read: false,
      created_at: new Date().toISOString(),
    }
    mockUseQuery.mockImplementation((endpoint: any) => {
      if (endpoint === api.notifications.getUnreadCount) return 1
      return [realNotification]
    })

    render(<NotificationBell />)
    fireEvent.click(screen.getByLabelText(/Notifications/))
    fireEvent.click(screen.getByText("Alice liked your post"))

    expect(mockMarkAsRead).toHaveBeenCalledWith({ notificationId: "notif-1" })
    expect(mockPush).toHaveBeenCalledWith("/post/post-1")
  })
})
