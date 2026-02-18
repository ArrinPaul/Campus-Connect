import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import NotificationsPage from "./page"
import { useQuery, useMutation } from "convex/react"

// Mock dependencies
jest.mock("convex/react")
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
const mockMarkAllAsRead = jest.fn()

describe("NotificationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMutation.mockReturnValue(mockMarkAllAsRead as any)
  })

  it("should render page title", () => {
    mockUseQuery
      .mockReturnValueOnce({ notifications: [], cursor: null }) // notifications data
      .mockReturnValueOnce(0) // unread count
    
    render(<NotificationsPage />)
    
    expect(screen.getByText("Notifications")).toBeInTheDocument()
  })

  it("should show unread count badge when there are unread notifications", () => {
    mockUseQuery
      .mockReturnValueOnce({ notifications: [], cursor: null }) // notifications data
      .mockReturnValueOnce(5) // unread count
    
    const { container } = render(<NotificationsPage />)
    
    // Check for the unread badge on All tab specifically
    const allTab = screen.getByText("All").closest("button")
    expect(allTab).toHaveTextContent("5")
  })

  it("should show Mark all as read button when there are unread notifications", () => {
    mockUseQuery
      .mockReturnValueOnce({ notifications: [], cursor: null }) // notifications data
      .mockReturnValueOnce(3) // unread count
    
    render(<NotificationsPage />)
    
    expect(screen.getByText("Mark all as read")).toBeInTheDocument()
  })

  it("should not show Mark all as read button when no unread notifications", () => {
    mockUseQuery
      .mockReturnValueOnce({ notifications: [], cursor: null }) // notifications data
      .mockReturnValueOnce(0) // unread count
    
    render(<NotificationsPage />)
    
    expect(screen.queryByText("Mark all as read")).not.toBeInTheDocument()
  })

  it("should render all tab buttons", () => {
    mockUseQuery
      .mockReturnValueOnce({ notifications: [], cursor: null }) // notifications data
      .mockReturnValueOnce(0) // unread count
    
    render(<NotificationsPage />)
    
    expect(screen.getByText("All")).toBeInTheDocument()
    expect(screen.getByText("Mentions")).toBeInTheDocument()
    expect(screen.getByText("Reactions")).toBeInTheDocument()
    expect(screen.getByText("Comments")).toBeInTheDocument()
    expect(screen.getByText("Follows")).toBeInTheDocument()
  })

  it("should highlight active tab", () => {
    mockUseQuery
      .mockReturnValueOnce({ notifications: [], cursor: null }) // notifications data
      .mockReturnValueOnce(0) // unread count
    
    const { container } = render(<NotificationsPage />)
    
    const allTab = screen.getByText("All").closest("button")
    expect(allTab).toHaveClass("text-blue-600")
  })

  it("should show empty state when no notifications", () => {
    mockUseQuery
      .mockReturnValueOnce({ notifications: [], cursor: null }) // notifications data
      .mockReturnValueOnce(0) // unread count
    
    render(<NotificationsPage />)
    
    expect(screen.getByText("No notifications yet")).toBeInTheDocument()
    expect(screen.getByText("You'll see notifications here when people interact with your posts")).toBeInTheDocument()
  })

  it("should render notification items when notifications exist", () => {
    const mockNotifications = [
      {
        _id: "notif1" as any,
        recipientId: "user1" as any,
        actorId: "user2" as any,
        type: "reaction" as const,
        referenceId: "post1",
        message: "John reacted to your post",
        isRead: false,
        createdAt: Date.now(),
        actor: {
          _id: "user2" as any,
          name: "John",
          profilePicture: undefined,
        },
      },
      {
        _id: "notif2" as any,
        recipientId: "user1" as any,
        actorId: "user3" as any,
        type: "comment" as const,
        referenceId: "post2",
        message: "Jane commented on your post",
        isRead: true,
        createdAt: Date.now() - 10000,
        actor: {
          _id: "user3" as any,
          name: "Jane",
          profilePicture: undefined,
        },
      },
    ]

    mockUseQuery
      .mockReturnValueOnce({ notifications: mockNotifications, cursor: null }) // notifications data
      .mockReturnValueOnce(1) // unread count
    
    render(<NotificationsPage />)
    
    const notificationItems = screen.getAllByTestId("notification-item")
    expect(notificationItems).toHaveLength(2)
    expect(screen.getByText("John reacted to your post")).toBeInTheDocument()
    expect(screen.getByText("Jane commented on your post")).toBeInTheDocument()
  })

  it("should show load more button when there are more notifications", () => {
    const mockNotifications = [
      {
        _id: "notif1" as any,
        recipientId: "user1" as any,
        actorId: "user2" as any,
        type: "follow" as const,
        message: "Alice followed you",
        isRead: false,
        createdAt: Date.now(),
        actor: {
          _id: "user2" as any,
          name: "Alice",
          profilePicture: undefined,
        },
      },
    ]

    mockUseQuery
      .mockReturnValueOnce({ notifications: mockNotifications, cursor: "20" }) // notifications data with cursor
      .mockReturnValueOnce(1) // unread count
    
    render(<NotificationsPage />)
    
    expect(screen.getByText("Load more")).toBeInTheDocument()
  })

  it("should not show load more button when no more notifications", () => {
    const mockNotifications = [
      {
        _id: "notif1" as any,
        recipientId: "user1" as any,
        actorId: "user2" as any,
        type: "follow" as const,
        message: "Bob followed you",
        isRead: false,
        createdAt: Date.now(),
        actor: {
          _id: "user2" as any,
          name: "Bob",
          profilePicture: undefined,
        },
      },
    ]

    mockUseQuery
      .mockReturnValueOnce({ notifications: mockNotifications, cursor: null }) // notifications data without cursor
      .mockReturnValueOnce(1) // unread count
    
    render(<NotificationsPage />)
    
    expect(screen.queryByText("Load more")).not.toBeInTheDocument()
  })

  it("should call markAllAsRead when clicking Mark all as read button", () => {
    mockUseQuery
      .mockReturnValueOnce({ notifications: [], cursor: null }) // notifications data
      .mockReturnValueOnce(5) // unread count
    
    render(<NotificationsPage />)
    
    const markAllButton = screen.getByText("Mark all as read")
    fireEvent.click(markAllButton)
    
    expect(mockMarkAllAsRead).toHaveBeenCalledWith({})
  })
})

