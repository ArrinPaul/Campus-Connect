import { render, screen, fireEvent } from "@testing-library/react"
import NotificationsPage from "./page"
import { useQuery, useMutation } from "@/lib/api"
import { useUser } from "@/lib/auth/client"

const useConvexAuth = jest.fn(() => ({ isAuthenticated: true, isLoading: false }))

jest.mock("@/lib/api", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(() => jest.fn()),
  api: {
    notifications: {
      getNotifications: {},
      getUnreadCount: {},
      markAllAsRead: {},
    },
  },
}))
jest.mock("@/components/notifications/NotificationItem", () => ({
  NotificationItem: ({ notification }: any) => (
    <div data-testid="notification-item">{notification.message}</div>
  ),
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>
const mockUseConvexAuth = useConvexAuth as jest.MockedFunction<typeof useConvexAuth>
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>
const mockMarkAllAsRead = jest.fn()

describe("NotificationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMutation.mockReturnValue(mockMarkAllAsRead as any)
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false })
    mockUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true, user: { id: "test-user-id", fullName: "Test User", imageUrl: "/test.jpg" } } as any)
  })

  it("should render page title", () => {
    // GET /api/notifications returns a bare array, not { notifications: [...] }
    mockUseQuery.mockReturnValue([])

    render(<NotificationsPage />)

    expect(screen.getByText("Notifications")).toBeInTheDocument()
  })

  it("should show unread count badge when there are unread notifications", () => {
    const mockNotifications = [
      { id: "n1", type: "like", message: "Test", read: false, created_at: new Date().toISOString(), from_user_id: "u2", reference_id: "p1", from_user: { id: "u2", name: "Alice", profile_picture: undefined } },
      { id: "n2", type: "like", message: "Test2", read: false, created_at: new Date().toISOString(), from_user_id: "u3", reference_id: "p1", from_user: { id: "u3", name: "Bob", profile_picture: undefined } },
    ]
    mockUseQuery.mockReturnValue(mockNotifications)

    render(<NotificationsPage />)

    // Unread count shows in "Mark all as read (2)" and pill badge
    expect(screen.getByText(/Mark all as read \(2\)/i)).toBeInTheDocument()
  })

  it("should show Mark all as read button when there are unread notifications", () => {
    const mockNotifications = [
      { id: "n1", type: "like", message: "Test", read: false, created_at: new Date().toISOString(), from_user_id: "u2", reference_id: "p1", from_user: { id: "u2", name: "Alice", profile_picture: undefined } },
    ]
    mockUseQuery.mockReturnValue(mockNotifications)

    render(<NotificationsPage />)

    expect(screen.getByText(/Mark all as read/i)).toBeInTheDocument()
  })

  it("should not show Mark all as read button when no unread notifications", () => {
    const mockNotifications = [
      { id: "n1", type: "like", message: "Test", read: true, created_at: new Date().toISOString(), from_user_id: "u2", reference_id: "p1", from_user: { id: "u2", name: "Alice", profile_picture: undefined } },
    ]
    mockUseQuery.mockReturnValue(mockNotifications)

    render(<NotificationsPage />)

    expect(screen.queryByText(/Mark all as read/i)).not.toBeInTheDocument()
  })

  it("should show empty state when no notifications", () => {
    mockUseQuery.mockReturnValue([])

    render(<NotificationsPage />)

    expect(screen.getByText("All caught up")).toBeInTheDocument()
  })

  it("should render notification items when notifications exist", () => {
    const mockNotifications = [
      { id: "notif1", from_user_id: "user2", type: "like", reference_id: "post1", message: "John reacted to your post", read: false, created_at: new Date().toISOString(), from_user: { id: "user2", name: "John", profile_picture: undefined } },
      { id: "notif2", from_user_id: "user3", type: "comment", reference_id: "post2", message: "Jane commented on your post", read: true, created_at: new Date(Date.now() - 10000).toISOString(), from_user: { id: "user3", name: "Jane", profile_picture: undefined } },
    ]
    mockUseQuery.mockReturnValue(mockNotifications)

    render(<NotificationsPage />)

    const notificationItems = screen.getAllByTestId("notification-item")
    expect(notificationItems).toHaveLength(2)
    expect(screen.getByText("John reacted to your post")).toBeInTheDocument()
    expect(screen.getByText("Jane commented on your post")).toBeInTheDocument()
  })

  it("should show loading skeleton when data is loading (undefined)", () => {
    // When useQuery returns undefined, the source shows a loading skeleton
    mockUseQuery.mockReturnValue(undefined)

    const { container } = render(<NotificationsPage />)

    // Source shows .animate-pulse divs when data === undefined
    const pulseElements = container.querySelectorAll(".animate-pulse")
    expect(pulseElements.length).toBeGreaterThan(0)
  })

  it("should show sign-in prompt when not authenticated", () => {
    mockUseUser.mockReturnValue({ isLoaded: true, isSignedIn: false, user: null } as any)
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false })
    // skip means useQuery returns undefined
    mockUseQuery.mockReturnValue(undefined)

    render(<NotificationsPage />)

    expect(screen.getByText(/Sign in to view your notifications/i)).toBeInTheDocument()
  })

  it("should call markAllAsRead when clicking Mark all as read button", () => {
    const mockNotifications = [
      { id: "n1", type: "like", message: "Test", read: false, created_at: new Date().toISOString(), from_user_id: "u2", reference_id: "p1", from_user: { id: "u2", name: "Alice", profile_picture: undefined } },
    ]
    mockUseQuery.mockReturnValue(mockNotifications)

    render(<NotificationsPage />)

    const markAllButton = screen.getByText(/Mark all as read/i)
    fireEvent.click(markAllButton)

    expect(mockMarkAllAsRead).toHaveBeenCalled()
  })
})

