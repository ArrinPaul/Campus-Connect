import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ReactionPicker, reactionEmojis } from "./ReactionPicker"

// Mock Convex hooks
jest.mock("convex/react", () => ({
  useMutation: jest.fn(() => jest.fn()),
  useQuery: jest.fn(() => null),
}))

// Mock tooltip components
jest.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <span>{children}</span>,
}))

describe("ReactionPicker", () => {
  const mockAddReaction = jest.fn()
  const mockRemoveReaction = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Set desktop width so hover picker shows
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true })
    const { useMutation, useQuery } = require("convex/react")
    
    useMutation.mockImplementation((api: any) => {
      if (api?.toString().includes("addReaction")) {
        return mockAddReaction
      }
      if (api?.toString().includes("removeReaction")) {
        return mockRemoveReaction
      }
      return jest.fn()
    })

    useQuery.mockImplementation((api: any) => {
      if (api?.toString().includes("getUserReaction")) {
        return null
      }
      if (api?.toString().includes("getReactions")) {
        return {
          total: 0,
          topReactions: [],
          counts: {
            like: 0,
            love: 0,
            laugh: 0,
            wow: 0,
            sad: 0,
            scholarly: 0,
          },
        }
      }
      return null
    })
  })

  it("renders reaction button", () => {
    render(
      <ReactionPicker
        targetId="test-post"
        targetType="post"
      />
    )

    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("shows reaction picker on hover", async () => {
    render(
      <ReactionPicker
        targetId="test-post"
        targetType="post"
      />
    )

    // Simulate hover
    const button = screen.getByRole("button")
    fireEvent.mouseEnter(button)

    await waitFor(() => {
      // Check if all reaction emojis are displayed in the picker
      // Note: 👍 appears twice (main button + picker), so use getAllByText for it
      Object.values(reactionEmojis).forEach((emoji) => {
        const elements = screen.getAllByText(emoji)
        expect(elements.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  it("calls addReaction when clicking a reaction", async () => {
    render(
      <ReactionPicker
        targetId="test-post"
        targetType="post"
      />
    )

    // Open picker
    const button = screen.getByRole("button")
    fireEvent.click(button)

    await waitFor(() => {
      // 👍 appears in both the main button and the picker, so use getAllByText
      expect(screen.getAllByText(reactionEmojis.like).length).toBeGreaterThanOrEqual(2)
    })

    // Click like reaction
    const likeButton = screen.getByTitle("Like")
    fireEvent.click(likeButton)

    await waitFor(() => {
      expect(mockAddReaction).toHaveBeenCalledWith({
        targetId: "test-post",
        targetType: "post",
        type: "like",
      })
    })
  })

  it("displays user's current reaction", () => {
    const { useQuery } = require("convex/react")
    useQuery.mockImplementation((api: any) => {
      if (api.toString().includes("getUserReaction")) {
        return "love"
      }
      if (api.toString().includes("getReactions")) {
        return {
          total: 1,
          topReactions: [{ type: "love", count: 1 }],
          counts: {
            like: 0,
            love: 1,
            laugh: 0,
            wow: 0,
            sad: 0,
            scholarly: 0,
          },
        }
      }
      return null
    })

    render(
      <ReactionPicker
        targetId="test-post"
        targetType="post"
      />
    )

    expect(screen.getByText(reactionEmojis.love)).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("calls removeReaction when clicking same reaction again", async () => {
    const { useQuery } = require("convex/react")
    useQuery.mockImplementation((api: any) => {
      if (api.toString().includes("getUserReaction")) {
        return "like"
      }
      if (api.toString().includes("getReactions")) {
        return {
          total: 1,
          topReactions: [{ type: "like", count: 1 }],
          counts: {
            like: 1,
            love: 0,
            laugh: 0,
            wow: 0,
            sad: 0,
            scholarly: 0,
          },
        }
      }
      return null
    })

    render(
      <ReactionPicker
        targetId="test-post"
        targetType="post"
      />
    )

    // Open picker
    const button = screen.getByRole("button")
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByTitle("Like")).toBeInTheDocument()
    })

    // Click like again (should remove)
    const likeButton = screen.getByTitle("Like")
    fireEvent.click(likeButton)

    await waitFor(() => {
      expect(mockRemoveReaction).toHaveBeenCalledWith({
        targetId: "test-post",
        targetType: "post",
      })
    })
  })

  it("displays total reaction count", () => {
    const { useQuery } = require("convex/react")
    useQuery.mockImplementation((api: any) => {
      if (api.toString().includes("getUserReaction")) {
        return null
      }
      if (api.toString().includes("getReactions")) {
        return {
          total: 42,
          topReactions: [
            { type: "like", count: 20 },
            { type: "love", count: 15 },
            { type: "scholarly", count: 7 },
          ],
          counts: {
            like: 20,
            love: 15,
            laugh: 0,
            wow: 0,
            sad: 0,
            scholarly: 7,
          },
        }
      }
      return null
    })

    render(
      <ReactionPicker
        targetId="test-post"
        targetType="post"
      />
    )

    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("renders in compact mode", () => {
    render(
      <ReactionPicker
        targetId="test-post"
        targetType="post"
        compact={true}
      />
    )

    const button = screen.getByRole("button")
    expect(button).toHaveClass("px-2", "py-1", "text-sm")
  })
})
