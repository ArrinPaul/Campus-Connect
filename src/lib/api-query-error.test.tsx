import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useQuery, useQueryError, useQueryWithError } from "./api"

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

describe("useQuery on a 404", () => {
  const originalFetch = global.fetch
  afterEach(() => { global.fetch = originalFetch })

  it("resolves null (not-found) instead of staying undefined forever", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: "nope" }) }) as any
    const { result } = renderHook(() => ({ data: useQuery(endpoint, {}), error: useQueryError(endpoint, {}) }), { wrapper })
    await waitFor(() => expect(result.current.data).toBeNull())
    expect(result.current.error).toBeNull()
  })

  it("still surfaces other failures as errors, with data left undefined", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "boom" }) }) as any
    const { result } = renderHook(() => ({ data: useQuery(endpoint, {}), error: useQueryError(endpoint, {}) }), { wrapper })
    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.data).toBeUndefined()
  })
})

describe("useQueryWithError", () => {
  const originalFetch = global.fetch
  afterEach(() => { global.fetch = originalFetch })

  it("returns data and error together with a single fetch", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [1, 2] }) as any
    const { result } = renderHook(() => useQueryWithError(endpoint, {}), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual([1, 2]))
    expect(result.current.error).toBeNull()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it("exposes the error when the request fails, so pages can show a retry state", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "boom" }) }) as any
    const { result } = renderHook(() => useQueryWithError(endpoint, {}), { wrapper })
    await waitFor(() => expect(result.current.error?.message).toBe("boom"))
    expect(result.current.data).toBeUndefined()
  })
})
