import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useQuery, useQueryError } from "./api"

// Regression: useQuery only ever returns `data`, so a genuine fetch failure
// looked identical to "still loading" (both leave data undefined forever).
// useQueryError is the opt-in companion that surfaces the actual error
// without changing useQuery's return shape for every existing call site.
function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const endpoint = { _path: "/api/test-thing", _method: "GET" as const }

describe("useQueryError", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it("returns null while a request is pending or has succeeded", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: "world" }),
    }) as any

    const { result } = renderHook(() => useQueryError(endpoint, {}), { wrapper })

    expect(result.current).toBeNull()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(result.current).toBeNull()
  })

  it("surfaces the error when the fetch fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "boom" }),
    }) as any

    const { result } = renderHook(() => useQueryError(endpoint, {}), { wrapper })

    await waitFor(() => expect(result.current).not.toBeNull())
    expect(result.current?.message).toBe("boom")
  })

  it("returns null when disabled ('skip')", () => {
    global.fetch = jest.fn()
    const { result } = renderHook(() => useQueryError(endpoint, "skip"), { wrapper })
    expect(result.current).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("shares its query with a useQuery call for the same endpoint+args (no extra fetch)", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: "world" }),
    }) as any

    const { result } = renderHook(
      () => ({ data: useQuery(endpoint, {}), error: useQueryError(endpoint, {}) }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.data).toEqual({ hello: "world" }))
    expect(result.current.error).toBeNull()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
