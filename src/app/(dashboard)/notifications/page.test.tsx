import { render, screen, fireEvent } from "@testing-library/react"
import NotificationsPage from "./page"
import { useQuery, useMutation, useConvexAuth } from "convex/react"

// Mock dependencies
jest.mock("convex/react", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(() => jest.fn()),
  useConvexAuth: jest.fn(() => ({ isAuthenticated: true, isLoading: false })),
}))
jest.mock("@/components/notifications/NotificationItem", () => ({
  NotificationItem: ({ notification }: any) => (
    <div data-testid="notification-item">{notification.message}</div>
  ),
}))
jest.mock("../../../../convex/_generated/api", () => ({
  api: {
    notifications: {
      getNotifications: {},
      getUnreadCount: {},
      markAllAsRead: {},
    },
  },
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>
const mockUseConvexAuth = useConvexAuth as jest.MockedFunction<typeof useConvexAuth>
const mockMarkAllAsRead = jest.fn()

describe("NotificationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMutation.mockReturnValue(mockMarkAllAsRead as any)
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false })
  })

  it("should render page title", () => {
    mockUseQuery.mockReturnValue({ notifications: [], cursor: null })

    render(<NotificationsPage />)

    expect(screen.getByText("Notifications")).toBeInTheDocument()
  })

  it("should show unread count badge when there are unread notifications", () => {
    const mockNotifications = [
      { _id: "n1" as any, type: "reaction" as const, message: "Test", isRead: false, createdAt: Date.now(), recipientId: "u1" as any, actorId: "u2" as any, referenceId: "p1", actor: { _id: "u2" as any, name: "Alice", profilePicture: undefined } },
      { _id: "n2" as any, type: "reaction" as const, message: "Test2", isRead: false, createdAt: Date.now(), recipientId: "u1" as any, actorId: "u3" as any, referenceId: "p1", actor: { _id: "u3" as any, name: "Bob", profilePicture: undefined } },
    ]
    mockUseQuery.mockReturnValue({ notifications: mockNotifications, cursor: null })

    render(<NotificationsPage />)

    // Unread count badge shows next to title
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("should show Mark all as read button when there are unread notifications", () => {
    const mockNotifications = [
      { _id: "n1" as any, type: "reaction" as const, message: "Test", isRead: false, createdAt: Date.now(), recipientId: "u1" as any, actorId: "u2" as any, referenceId: "p1", actor: { _id: "u2" as any, name: "Alice", profilePicture: undefined } },
    ]
    mockUseQuery.mockReturnValue({ notifications: mockNotifications, cursor: null })

    render(<NotificationsPage />)

    expect(screen.getByText("Mark all as read")).toBeInTheDocument()
  })

  it("should not show Mark all as read button when no unread notifications", () => {
    const mockNotifications = [
      { _id: "n1" as any, type: "reaction" as const, message: "Test", isRead: true, createdAt: Date.now(), recipientId: "u1" as any, actorId: "u2" as any, referenceId: "p1", actor: { _id: "u2" as any, name: "Alice", profilePicture: undefined } },
    ]
    mockUseQuery.mockReturnValue({ notifications: mockNotifications, cursor: null })

    render(<NotificationsPage />)

    expect(screen.queryByText("Mark all as read")).not.toBeInTheDocument()
  })

  it("should show empty state when no notifications", () => {
    mockUseQuery.mockReturnValue({ notifications: [], cursor: null })

    render(<NotificationsPage />)

    expect(screen.getByText("No notifications yet")).toBeInTheDocument()
  })

  it("should render notification items when notifications exist", () => {
    const mockNotifications = [
      { _id: "notif1" as any, recipientId: "user1" as any, actorId: "user2" as any, type: "reaction" as const, referenceId: "post1", message: "John reacted to your post", isRead: false, createdAt: Date.now(), actor: { _id: "user2" as any, name: "John", profilePicture: undefined } },
      { _id: "notif2" as any, recipientId: "user1" as any, actorId: "user3" as any, type: "comment" as const, referenceId: "post2", message: "Jane commented on your post", isRead: true, createdAt: Date.now() - 10000, actor: { _id: "user3" as any, name: "Jane", profilePicture: undefined } },
    ]
    mockUseQuery.mockReturnValue({ notifications: mockNotifications, cursor: null })

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
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false })
    // skip means useQuery returns undefined
    mockUseQuery.mockReturnValue(undefined)

    render(<NotificationsPage />)

    expect(screen.getByText("Sign in to view notifications")).toBeInTheDocument()
  })

  it("should call markAllAsRead when clicking Mark all as read button", () => {
    const mockNotifications = [
      { _id: "n1" as any, type: "reaction" as const, message: "Test", isRead: false, createdAt: Date.now(), recipientId: "u1" as any, actorId: "u2" as any, referenceId: "p1", actor: { _id: "u2" as any, name: "Alice", profilePicture: undefined } },
    ]
    mockUseQuery.mockReturnValue({ notifications: mockNotifications, cursor: null })

    render(<NotificationsPage />)

    const markAllButton = screen.getByText("Mark all as read")
    fireEvent.click(markAllButton)

    expect(mockMarkAllAsRead).toHaveBeenCalled()
  })
})

