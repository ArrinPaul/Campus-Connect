import { renderHook, waitFor } from "@testing-library/react"
import { useDebounce } from "./useDebounce"

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500))

    expect(result.current).toBe("initial")
  })

  it("should debounce value changes", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    )

    expect(result.current).toBe("initial")

    // Update the value
    rerender({ value: "updated", delay: 500 })

    // Value should not change immediately
    expect(result.current).toBe("initial")

    // Fast-forward time
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current).toBe("updated")
    })
  })

  it("should cancel previous timeout on rapid changes", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    )

    // First update
    rerender({ value: "first", delay: 500 })
    jest.advanceTimersByTime(200)

    // Second update before first completes
    rerender({ value: "second", delay: 500 })
    jest.advanceTimersByTime(200)

    // Third update before second completes
    rerender({ value: "third", delay: 500 })

    // Value should still be initial
    expect(result.current).toBe("initial")

    // Complete the debounce
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current).toBe("third")
    })
  })

  it("should use custom delay", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 1000 },
      }
    )

    rerender({ value: "updated", delay: 1000 })

    // Should not update after 500ms
    jest.advanceTimersByTime(500)
    expect(result.current).toBe("initial")

    // Should update after 1000ms
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current).toBe("updated")
    })
  })

  it("should use default delay of 500ms when not specified", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      {
        initialProps: { value: "initial" },
      }
    )

    rerender({ value: "updated" })

    // Should not update before 500ms
    jest.advanceTimersByTime(400)
    expect(result.current).toBe("initial")

    // Should update after 500ms
    jest.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current).toBe("updated")
    })
  })

  it("should handle number values", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 500 },
      }
    )

    expect(result.current).toBe(0)

    rerender({ value: 42, delay: 500 })
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current).toBe(42)
    })
  })

  it("should handle boolean values", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: false, delay: 500 },
      }
    )

    expect(result.current).toBe(false)

    rerender({ value: true, delay: 500 })
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it("should handle object values", async () => {
    const initialObj = { name: "John" }
    const updatedObj = { name: "Jane" }

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 500 },
      }
    )

    expect(result.current).toBe(initialObj)

    rerender({ value: updatedObj, delay: 500 })
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current).toBe(updatedObj)
    })
  })
})
