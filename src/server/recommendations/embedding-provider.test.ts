// Regression: falling back to MockEmbeddingProvider (no OPENAI_API_KEY, or a
// mock_ placeholder) used to be completely silent — semantic search would
// degrade to a deterministic hash with nothing in the logs to explain why
// results looked wrong. Verifies the fallback now warns, exactly once per
// process rather than once per request.
describe("getEmbeddingProvider", () => {
  const originalKey = process.env.OPENAI_API_KEY
  const mockWarn = jest.fn()

  beforeEach(() => {
    jest.resetModules()
    jest.doMock("@/lib/logger", () => ({
      createLogger: () => ({ debug: jest.fn(), info: jest.fn(), warn: mockWarn, error: jest.fn() }),
    }))
    mockWarn.mockClear()
  })

  afterEach(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = originalKey
  })

  it("warns once when OPENAI_API_KEY is unset", async () => {
    delete process.env.OPENAI_API_KEY
    const { getEmbeddingProvider, MockEmbeddingProvider } = await import("./embedding-provider")

    const provider = getEmbeddingProvider()

    expect(provider).toBeInstanceOf(MockEmbeddingProvider)
    expect(mockWarn).toHaveBeenCalledTimes(1)
    expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining("OPENAI_API_KEY"))
  })

  it("does not warn again on a second call in the same process", async () => {
    delete process.env.OPENAI_API_KEY
    const { getEmbeddingProvider } = await import("./embedding-provider")

    getEmbeddingProvider()
    getEmbeddingProvider()

    expect(mockWarn).toHaveBeenCalledTimes(1)
  })

  it("warns when the key is a mock_ placeholder", async () => {
    process.env.OPENAI_API_KEY = "mock_placeholder"
    const { getEmbeddingProvider, MockEmbeddingProvider } = await import("./embedding-provider")

    const provider = getEmbeddingProvider()

    expect(provider).toBeInstanceOf(MockEmbeddingProvider)
    expect(mockWarn).toHaveBeenCalledTimes(1)
  })

  it("does not warn and returns the real provider when a real key is set", async () => {
    process.env.OPENAI_API_KEY = "sk-real-key"
    const { getEmbeddingProvider, OpenAIEmbeddingProvider } = await import("./embedding-provider")

    const provider = getEmbeddingProvider()

    expect(provider).toBeInstanceOf(OpenAIEmbeddingProvider)
    expect(mockWarn).not.toHaveBeenCalled()
  })
})
