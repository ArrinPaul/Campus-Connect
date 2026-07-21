import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { LikeButton, ReactionPicker } from "./ReactionPicker"

// Mock data hooks
jest.mock("@/lib/api", () => ({
  useMutation: jest.fn(() => jest.fn()),
  useQuery: jest.fn(() => null),
  api: {
    reactions: {
      addReaction: "reactions:addReaction",
      removeReaction: "reactions:removeReaction",
      getUserReaction: "reactions:getUserReaction",
      getReactions: "reactions:getReactions",
    },
  },
}))

// Mock tooltip components
jest.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <span>{children}</span>,
}))

describe("LikeButton / ReactionPicker", () => {
  const mockAddReaction = jest.fn()
  const mockRemoveReaction = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    const { useMutation, useQuery } = require("@/lib/api")
    
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
          },
        }
      }
      return null
    })
  })

  it("renders like button", () => {
    render(
      <LikeButton
        targetId="test-post"
        targetType="post"
      />
    )

    expect(screen.getByRole("button")).toBeInTheDocument()
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Like")
  })

  it("calls addReaction when clicking like button", async () => {
    render(
      <LikeButton
        targetId="test-post"
        targetType="post"
      />
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockAddReaction).toHaveBeenCalledWith({
        targetId: "test-post",
        targetType: "post",
        type: "like",
      })
    })
  })

  it("displays user's current like state", () => {
    const { useQuery } = require("@/lib/api")
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
          },
        }
      }
      return null
    })

    render(
      <LikeButton
        targetId="test-post"
        targetType="post"
      />
    )

    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("aria-label", "Unlike")
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("calls removeReaction when clicking liked button again", async () => {
    const { useQuery } = require("@/lib/api")
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
          },
        }
      }
      return null
    })

    render(
      <LikeButton
        targetId="test-post"
        targetType="post"
      />
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockRemoveReaction).toHaveBeenCalledWith({
        targetId: "test-post",
        targetType: "post",
      })
    })
  })

  it("displays total like count", () => {
    const { useQuery } = require("@/lib/api")
    useQuery.mockImplementation((api: any) => {
      if (api.toString().includes("getUserReaction")) {
        return null
      }
      if (api.toString().includes("getReactions")) {
        return {
          total: 42,
          topReactions: [{ type: "like", count: 42 }],
          counts: {
            like: 42,
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
      <LikeButton
        targetId="test-post"
        targetType="post"
        compact={true}
      />
    )

    const button = screen.getByRole("button")
    expect(button).toHaveClass("px-2", "py-1", "text-sm")
  })
})
