import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { UserSearchBar } from "./UserSearchBar"

// Mock the useDebounce hook
jest.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}))

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Search: () => <div data-testid="search-icon">Search Icon</div>,
  X: () => <div data-testid="x-icon">X Icon</div>,
}))

describe("UserSearchBar", () => {
  it("should render search input", () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText("Search users by name...")
    expect(input).toBeInTheDocument()
  })

  it("should display search icon", () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    expect(screen.getByTestId("search-icon")).toBeInTheDocument()
  })

  it("should not display clear button when input is empty", () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument()
  })

  it("should display clear button when input has text", () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText("Search users by name...")
    fireEvent.change(input, { target: { value: "John" } })

    expect(screen.getByLabelText("Clear search")).toBeInTheDocument()
  })

  it("should update input value on change", () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText(
      "Search users by name..."
    ) as HTMLInputElement
    fireEvent.change(input, { target: { value: "Jane Doe" } })

    expect(input.value).toBe("Jane Doe")
  })

  it("should trigger search callback on input change", async () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText("Search users by name...")
    fireEvent.change(input, { target: { value: "Alice" } })

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("Alice")
    })
  })

  it("should clear input when clear button is clicked", () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText(
      "Search users by name..."
    ) as HTMLInputElement
    fireEvent.change(input, { target: { value: "Bob" } })

    expect(input.value).toBe("Bob")

    const clearButton = screen.getByLabelText("Clear search")
    fireEvent.click(clearButton)

    expect(input.value).toBe("")
  })

  it("should trigger search with empty string when cleared", async () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText("Search users by name...")
    fireEvent.change(input, { target: { value: "Charlie" } })

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("Charlie")
    })

    mockOnSearch.mockClear()

    const clearButton = screen.getByLabelText("Clear search")
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("")
    })
  })

  it("should have accessible label for search input", () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByLabelText("Search users")
    expect(input).toBeInTheDocument()
  })

  it("should handle multiple input changes", async () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText("Search users by name...")

    fireEvent.change(input, { target: { value: "A" } })
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("A")
    })

    fireEvent.change(input, { target: { value: "Al" } })
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("Al")
    })

    fireEvent.change(input, { target: { value: "Alice" } })
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("Alice")
    })
  })

  it("should handle special characters in search", async () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText("Search users by name...")
    fireEvent.change(input, { target: { value: "O'Brien" } })

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("O'Brien")
    })
  })

  it("should handle whitespace in search", async () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText("Search users by name...")
    fireEvent.change(input, { target: { value: "  John Doe  " } })

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("  John Doe  ")
    })
  })
})
