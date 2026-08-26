import React from "react";
import { render, screen } from "@testing-library/react";
import { TrendingHashtags } from "./TrendingHashtags";

const mockGetTrending = jest.fn();

jest.mock("@/lib/api", () => ({
  useQuery: jest.fn((apiFunction) => {
    if (apiFunction === "hashtags:getTrending") {
      return mockGetTrending();
    }
    return undefined;
  }),
  api: {
    hashtags: {
      getTrending: "hashtags:getTrending",
    },
  },
}));

describe("TrendingHashtags Widget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading skeleton state when data is undefined", () => {
    mockGetTrending.mockReturnValue(undefined);
    render(<TrendingHashtags />);

    expect(screen.getByTestId("trending-hashtags-widget")).toBeInTheDocument();
    expect(screen.getByText("Trending on Campus")).toBeInTheDocument();
    expect(screen.getByTestId("trending-loading")).toBeInTheDocument();
  });

  it("renders empty state when hashtag array is empty", () => {
    mockGetTrending.mockReturnValue([]);
    render(<TrendingHashtags />);

    expect(screen.getByTestId("trending-empty")).toBeInTheDocument();
    expect(screen.getByText(/No trending topics right now/i)).toBeInTheDocument();
  });

  it("renders list of trending hashtags with tags and post counts", () => {
    const mockData = [
      { id: "h1", tag: "computerscience", post_count: 42 },
      { id: "h2", tag: "hackathon2026", post_count: 1 },
    ];
    mockGetTrending.mockReturnValue(mockData);
    render(<TrendingHashtags />);

    expect(screen.getByTestId("trending-list")).toBeInTheDocument();
    expect(screen.getByText("#computerscience")).toBeInTheDocument();
    expect(screen.getByText("42 posts")).toBeInTheDocument();
    expect(screen.getByText("#hackathon2026")).toBeInTheDocument();
    expect(screen.getByText("1 post")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /#computerscience/i });
    expect(link).toHaveAttribute("href", "/hashtag/computerscience");
  });
});
