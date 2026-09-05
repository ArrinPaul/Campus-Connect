import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { NotificationItem } from "./NotificationItem"
import { useMutation } from "@/lib/api"
import { useRouter } from "next/navigation"

jest.mock("@/lib/api", () => ({
  useMutation: jest.fn(() => jest.fn().mockResolvedValue({ success: true })),
  api: { notifications: { markAsRead: {} } },
}))
jest.mock("next/navigation")
jest.mock("@/components/ui/OptimizedImage", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- test double, not real app UI
  OptimizedImage: (props: any) => <img alt={props.alt} src={props.src} />,
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockPush = jest.fn()

// Regression: this component previously read notification.actor, .isRead,
// .createdAt, .actorId, .referenceId, ._id — none of which exist on the
// real API response (from_user, read, created_at, from_user_id,
// reference_id, id). Never exercised because the notifications table was
// always empty before this session (see docs/TASKS.md §4 — "notifications
// were fully built but never triggered").
describe("NotificationItem", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ push: mockPush } as any)
  })

  const baseNotification = {
    id: "notif-1",
    user_id: "me",
    from_user_id: "alice-1",
    type: "like",
    reference_type: "post",
    reference_id: "post-1",
    message: "Alice liked your post",
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    from_user: { id: "alice-1", name: "Alice", profile_picture: undefined },
  }

  it("renders the message and a relative timestamp without crashing", () => {
    render(<NotificationItem notification={baseNotification} />)

    expect(screen.getByText("Alice liked your post")).toBeInTheDocument()
    expect(screen.getByText(/minutes? ago/)).toBeInTheDocument()
  })

  it("shows the actor's avatar fallback initial when there's no profile picture", () => {
    render(<NotificationItem notification={baseNotification} />)
    expect(screen.getByText("A")).toBeInTheDocument()
  })

  it("marks the notification read and navigates using the real field names on click", async () => {
    const markAsRead = jest.fn().mockResolvedValue({ success: true })
    ;(useMutation as jest.Mock).mockReturnValue(markAsRead)

    render(<NotificationItem notification={baseNotification} />)
    fireEvent.click(screen.getByText("Alice liked your post"))

    expect(markAsRead).toHaveBeenCalledWith({ notificationId: "notif-1" })
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/post/post-1"))
  })

  it("does not call markAsRead again for an already-read notification", () => {
    const markAsRead = jest.fn()
    ;(useMutation as jest.Mock).mockReturnValue(markAsRead)

    render(<NotificationItem notification={{ ...baseNotification, read: true }} />)
    fireEvent.click(screen.getByText("Alice liked your post"))

    expect(markAsRead).not.toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith("/post/post-1")
  })
})
