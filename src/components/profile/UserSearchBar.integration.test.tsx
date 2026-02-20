import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { UserSearchBar } from "./UserSearchBar"

/**
 * Integration test for UserSearchBar with real debouncing
 * This test uses real timers to verify the debounce behavior works correctly
 */
describe("UserSearchBar - Integration with real debouncing", () => {
  it("should debounce search input and only trigger callback after delay", async () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText("Search users by name...")

    // Type multiple characters rapidly
    fireEvent.change(input, { target: { value: "J" } })
    fireEvent.change(input, { target: { value: "Jo" } })
    fireEvent.change(input, { target: { value: "Joh" } })
    fireEvent.change(input, { target: { value: "John" } })

    // Should not have called the callback yet (or only with initial empty value)
    expect(mockOnSearch).toHaveBeenCalledTimes(1)
    expect(mockOnSearch).toHaveBeenCalledWith("")

    // Wait for debounce delay (300ms + buffer for CI/heavy-load runs)
    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledWith("John")
      },
      { timeout: 1500 }
    )

    // Should have been called with the final value
    expect(mockOnSearch).toHaveBeenCalledWith("John")
  })

  it("should cancel previous debounce when input changes rapidly", async () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText("Search users by name...")

    // Type "Alice"
    fireEvent.change(input, { target: { value: "Alice" } })

    // Wait 100ms (less than debounce delay)
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Change to "Bob" before debounce completes
    fireEvent.change(input, { target: { value: "Bob" } })

    // Wait for debounce to complete
    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledWith("Bob")
      },
      { timeout: 1500 }
    )

    // Should have been called with "Bob", not "Alice"
    expect(mockOnSearch).toHaveBeenCalledWith("Bob")
    expect(mockOnSearch).not.toHaveBeenCalledWith("Alice")
  })

  it("should trigger search immediately when cleared", async () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText("Search users by name...")

    // Type something
    fireEvent.change(input, { target: { value: "Test" } })

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledWith("Test")
      },
      { timeout: 1500 }
    )

    mockOnSearch.mockClear()

    // Click clear button
    const clearButton = screen.getByLabelText("Clear search")
    fireEvent.click(clearButton)

    // Should trigger search with empty string after debounce
    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledWith("")
      },
      { timeout: 1500 }
    )
  })

  it("should handle continuous typing with proper debouncing", async () => {
    const mockOnSearch = jest.fn()
    render(<UserSearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText("Search users by name...")

    // Simulate user typing "JavaScript" character by character
    const searchTerm = "JavaScript"
    for (let i = 1; i <= searchTerm.length; i++) {
      fireEvent.change(input, { target: { value: searchTerm.substring(0, i) } })
      // Small delay between keystrokes (less than debounce)
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    // Wait for final debounce
    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledWith("JavaScript")
      },
      { timeout: 1500 }
    )

    // Should have been called with the complete term
    expect(mockOnSearch).toHaveBeenCalledWith("JavaScript")
  })
})
