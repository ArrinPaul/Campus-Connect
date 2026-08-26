import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SuggestedUsers } from "./SuggestedUsers";

const mockGetSuggestedUsers = jest.fn();
const mockFollowUserMutation = jest.fn();

jest.mock("@/lib/api", () => ({
  useQuery: jest.fn((apiFunction) => {
    if (apiFunction === "follows:getSuggestedUsers") {
      return mockGetSuggestedUsers();
    }
    return undefined;
  }),
  useMutation: jest.fn((apiFunction) => {
    if (apiFunction === "follows:followUser") {
      return mockFollowUserMutation;
    }
    return jest.fn();
  }),
  api: {
    follows: {
      getSuggestedUsers: "follows:getSuggestedUsers",
      followUser: "follows:followUser",
    },
  },
}));

describe("SuggestedUsers Widget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading skeleton state when data is undefined", () => {
    mockGetSuggestedUsers.mockReturnValue(undefined);
    render(<SuggestedUsers />);

    expect(screen.getByTestId("suggested-users-widget")).toBeInTheDocument();
    expect(screen.getByText("Suggested Connections")).toBeInTheDocument();
    expect(screen.getByTestId("suggested-loading")).toBeInTheDocument();
  });

  it("renders empty state when user array is empty", () => {
    mockGetSuggestedUsers.mockReturnValue([]);
    render(<SuggestedUsers />);

    expect(screen.getByTestId("suggested-empty")).toBeInTheDocument();
    expect(screen.getByText(/No suggested connections right now/i)).toBeInTheDocument();
  });

  it("renders list of suggested users with name, role, and follow button", () => {
    const mockUsers = [
      { id: "u1", name: "Alice Wonderland", role: "Student", username: "alice" },
      { id: "u2", name: "Bob Builder", role: "Research Scholar", username: "bob" },
    ];
    mockGetSuggestedUsers.mockReturnValue(mockUsers);
    render(<SuggestedUsers showSeeAll={true} />);

    expect(screen.getByTestId("suggested-list")).toBeInTheDocument();
    expect(screen.getByText("Alice Wonderland")).toBeInTheDocument();
    expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    expect(screen.getByText("See all")).toBeInTheDocument();
    expect(screen.getByTestId("follow-btn-u1")).toBeInTheDocument();
    expect(screen.getByTestId("follow-btn-u2")).toBeInTheDocument();
  });

  it("handles follow user click with optimistic update", async () => {
    const mockUsers = [{ id: "u1", name: "Alice Wonderland", role: "Student" }];
    mockGetSuggestedUsers.mockReturnValue(mockUsers);
    mockFollowUserMutation.mockResolvedValueOnce({ success: true });

    render(<SuggestedUsers />);

    const followBtn = screen.getByTestId("follow-btn-u1");
    expect(followBtn).toHaveTextContent("Follow");

    fireEvent.click(followBtn);

    expect(mockFollowUserMutation).toHaveBeenCalledWith({ followingId: "u1" });
    await waitFor(() => {
      expect(screen.getByText("Following")).toBeInTheDocument();
    });
  });
});
