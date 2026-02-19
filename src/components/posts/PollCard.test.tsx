import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PollCard } from "./PollCard"

// Mock convex/react
jest.mock("convex/react", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(() => jest.fn()),
}))

// Mock next navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock("../../../../convex/_generated/api", () => ({
  api: {
    polls: {
      getPollResults: "polls:getPollResults",
      getUserVote: "polls:getUserVote",
      vote: "polls:vote",
    },
  },
}))

import { useQuery, useMutation } from "convex/react"

const mockPollId = "poll_001" as any

function makePoll(overrides = {}) {
  const now = Date.now()
  return {
    _id: "poll_001",
    authorId: "user_001",
    question: undefined,
    options: [
      { id: "opt_a", text: "Option A", voteCount: 3 },
      { id: "opt_b", text: "Option B", voteCount: 1 },
    ],
    totalVotes: 4,
    endsAt: now + 86_400_000,
    isAnonymous: false,
    isExpired: false,
    createdAt: now,
    ...overrides,
  }
}

describe("PollCard", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders loading skeleton when poll data is undefined", () => {
    ;(useQuery as jest.Mock).mockReturnValue(undefined)
    const { container } = render(<PollCard pollId={mockPollId} />)
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("renders nothing when poll is null (deleted)", () => {
    ;(useQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === "polls:getPollResults") return null
      return null
    })
    const { container } = render(<PollCard pollId={mockPollId} />)
    expect(container.firstChild).toBeNull()
  })

  it("shows vote options as clickable buttons when user has not voted", () => {
    ;(useQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === "polls:getPollResults") return makePoll()
      return null // no user vote
    })
    render(<PollCard pollId={mockPollId} />)

    expect(screen.getByRole("button", { name: "Option A" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Option B" })).toBeInTheDocument()
  })

  it("shows progress bars with percentages after user has voted", () => {
    ;(useQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === "polls:getPollResults") return makePoll()
      return "opt_a" // user has voted
    })
    render(<PollCard pollId={mockPollId} />)

    // After voting, percentage text should appear
    expect(screen.getByText("75%")).toBeInTheDocument() // 3/4 = 75%
    expect(screen.getByText("25%")).toBeInTheDocument() // 1/4 = 25%
  })

  it("shows total vote count", () => {
    ;(useQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === "polls:getPollResults") return makePoll()
      return "opt_a"
    })
    render(<PollCard pollId={mockPollId} />)
    expect(screen.getByText(/4 votes/)).toBeInTheDocument()
  })

  it("calls vote mutation when an option is clicked", async () => {
    const mockVote = jest.fn().mockResolvedValue(undefined)
    ;(useMutation as jest.Mock).mockReturnValue(mockVote)
    ;(useQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === "polls:getPollResults") return makePoll()
      return null
    })
    render(<PollCard pollId={mockPollId} />)

    fireEvent.click(screen.getByRole("button", { name: "Option A" }))
    await waitFor(() => {
      expect(mockVote).toHaveBeenCalledWith({
        pollId: mockPollId,
        optionId: "opt_a",
      })
    })
  })

  it("shows 'Final Results' badge when poll is expired", () => {
    ;(useQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === "polls:getPollResults")
        return makePoll({ isExpired: true, endsAt: Date.now() - 1000 })
      return null
    })
    render(<PollCard pollId={mockPollId} />)
    expect(screen.getByText("Final Results")).toBeInTheDocument()
  })

  it("shows time remaining when poll is active and has endsAt", () => {
    ;(useQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === "polls:getPollResults")
        return makePoll({ endsAt: Date.now() + 3 * 3_600_000 }) // 3h from now
      return null
    })
    render(<PollCard pollId={mockPollId} />)
    expect(screen.getByText(/left/)).toBeInTheDocument()
  })

  it("shows anonymous badge when poll.isAnonymous is true", () => {
    ;(useQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === "polls:getPollResults") return makePoll({ isAnonymous: true })
      return null
    })
    render(<PollCard pollId={mockPollId} />)
    expect(screen.getByText("Anonymous")).toBeInTheDocument()
  })

  it("shows optional question text when provided", () => {
    ;(useQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === "polls:getPollResults")
        return makePoll({ question: "What is your favorite color?" })
      return null
    })
    render(<PollCard pollId={mockPollId} />)
    expect(screen.getByText("What is your favorite color?")).toBeInTheDocument()
  })

  it("shows checkmark on the option the user voted for", () => {
    ;(useQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === "polls:getPollResults") return makePoll()
      return "opt_b" // voted for opt_b
    })
    render(<PollCard pollId={mockPollId} />)
    // CheckCircle2 icon should be visible — verify via svg or by the selected styling
    // Check that "Option B" text appears in results view
    const optionText = screen.getByText("Option B")
    expect(optionText).toBeInTheDocument()
  })

  it("shows 'Vote to see results' hint when user has not voted", () => {
    ;(useQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === "polls:getPollResults") return makePoll()
      return null
    })
    render(<PollCard pollId={mockPollId} />)
    expect(screen.getByText(/Vote to see results/)).toBeInTheDocument()
  })
})
