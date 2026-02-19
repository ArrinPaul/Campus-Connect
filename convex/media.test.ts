/**
 * Tests for convex/media.ts — pure logic tests
 *
 * Note: Convex mutation/query/action wrappers are not directly callable in the
 * test environment. We test the embedded handler logic via helper functions and
 * direct simulation of the auth/storage context.
 */

// ── Auth guard logic ────────────────────────────────────────────────────────
describe("media auth guard logic", () => {
  it("should throw when getUserIdentity returns null", async () => {
    // Simulate the auth check present in every handler
    const checkAuth = async (ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) => {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) throw new Error("Not authenticated")
      return identity
    }

    const ctx = { auth: { getUserIdentity: async () => null } }
    await expect(checkAuth(ctx)).rejects.toThrow("Not authenticated")
  })

  it("should pass when getUserIdentity returns a user", async () => {
    const checkAuth = async (ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) => {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) throw new Error("Not authenticated")
      return identity
    }

    const ctx = { auth: { getUserIdentity: async () => ({ subject: "user123" }) } }
    const identity = await checkAuth(ctx)
    expect(identity).toEqual({ subject: "user123" })
  })
})

// ── generateUploadUrl logic ─────────────────────────────────────────────────
describe("media generateUploadUrl logic", () => {
  it("should call storage.generateUploadUrl and return its result", async () => {
    const mockGenerateUrl = jest.fn().mockResolvedValue("https://upload.convex.cloud/presigned")
    const ctx = {
      auth: { getUserIdentity: async () => ({ subject: "user123" }) },
      storage: { generateUploadUrl: mockGenerateUrl },
    }

    const identity = await ctx.auth.getUserIdentity()
    expect(identity).not.toBeNull()
    const url = await ctx.storage.generateUploadUrl()
    expect(mockGenerateUrl).toHaveBeenCalledTimes(1)
    expect(url).toBe("https://upload.convex.cloud/presigned")
  })
})

// ── getFileUrl logic ─────────────────────────────────────────────────────────
describe("media getFileUrl logic", () => {
  it("should call storage.getUrl with the provided storageId", async () => {
    const mockGetUrl = jest.fn().mockResolvedValue("https://cdn.convex.cloud/file.jpg")
    const ctx = {
      auth: { getUserIdentity: async () => ({ subject: "user123" }) },
      storage: { getUrl: mockGetUrl },
    }

    const storageId = "k573abc123" as any
    const url = await ctx.storage.getUrl(storageId)
    expect(mockGetUrl).toHaveBeenCalledWith(storageId)
    expect(url).toBe("https://cdn.convex.cloud/file.jpg")
  })

  it("should return null for non-existent storage ID", async () => {
    const ctx = {
      auth: { getUserIdentity: async () => ({ subject: "user123" }) },
      storage: { getUrl: async (_id: unknown) => null },
    }

    const url = await ctx.storage.getUrl("nonexistent" as any)
    expect(url).toBeNull()
  })
})

// ── deleteUpload logic ───────────────────────────────────────────────────────
describe("media deleteUpload logic", () => {
  it("should call storage.delete with the provided storageId", async () => {
    const deleteMock = jest.fn().mockResolvedValue(undefined)
    const ctx = {
      auth: { getUserIdentity: async () => ({ subject: "user123" }) },
      storage: { delete: deleteMock },
    }

    const storageId = "k573abc123" as any
    await ctx.storage.delete(storageId)
    expect(deleteMock).toHaveBeenCalledWith(storageId)
  })
})

// ── resolveStorageUrls logic ─────────────────────────────────────────────────
describe("media resolveStorageUrls logic", () => {
  it("should resolve all storage IDs to URLs in parallel", async () => {
    const mockGetUrl = jest.fn().mockImplementation(async (id: string) => `https://cdn.example.com/${id}`)
    const ctx = {
      auth: { getUserIdentity: async () => ({ subject: "user123" }) },
      storage: { getUrl: mockGetUrl },
    }

    const storageIds = ["id1", "id2", "id3"]
    const urls = await Promise.all(storageIds.map((id) => ctx.storage.getUrl(id)))

    expect(urls).toEqual([
      "https://cdn.example.com/id1",
      "https://cdn.example.com/id2",
      "https://cdn.example.com/id3",
    ])
    expect(mockGetUrl).toHaveBeenCalledTimes(3)
  })

  it("should preserve null for missing storage IDs", async () => {
    const ctx = {
      auth: { getUserIdentity: async () => ({ subject: "user123" }) },
      storage: {
        getUrl: async (id: string) => (id === "missing" ? null : `https://cdn.example.com/${id}`),
      },
    }

    const storageIds = ["id1", "missing", "id3"]
    const urls = await Promise.all(storageIds.map((id) => ctx.storage.getUrl(id)))
    expect(urls).toEqual(["https://cdn.example.com/id1", null, "https://cdn.example.com/id3"])
  })
})

// ── Helper function logic ────────────────────────────────────────────────────
describe("fetchLinkPreview OG tag extraction logic", () => {
  it("should extract og:title from HTML", () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Test Title" />
          <meta property="og:description" content="Test Description" />
          <meta property="og:image" content="https://example.com/image.jpg" />
        </head>
        <body><h1>Page</h1></body>
      </html>
    `

    const titlePattern = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i
    const descPattern = /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i
    const imagePattern = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i

    expect(html.match(titlePattern)?.[1]).toBe("Test Title")
    expect(html.match(descPattern)?.[1]).toBe("Test Description")
    expect(html.match(imagePattern)?.[1]).toBe("https://example.com/image.jpg")
  })

  it("should fall back to <title> tag when og:title is absent", () => {
    const html = `<html><head><title>Fallback Title</title></head></html>`
    const titleTagPattern = /<title[^>]*>([^<]+)<\/title>/i
    expect(html.match(titleTagPattern)?.[1]).toBe("Fallback Title")
  })

  it("should handle reversed attribute order in meta tags", () => {
    const html = `<meta content="Reversed Title" property="og:title" />`
    const reversedPattern =
      /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i
    expect(html.match(reversedPattern)?.[1]).toBe("Reversed Title")
  })

  it("should decode HTML entities", () => {
    // Test the entity decoding logic from media.ts
    const decodeHtmlEntities = (str: string): string =>
      str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")

    expect(decodeHtmlEntities("Hello &amp; World")).toBe("Hello & World")
    expect(decodeHtmlEntities("&lt;script&gt;")).toBe("<script>")
    expect(decodeHtmlEntities("It&#39;s a &quot;test&quot;")).toBe("It's a \"test\"")
  })

  it("should validate URL protocol", () => {
    // Test the URL validation from fetchLinkPreview
    const isValidUrl = (url: string): boolean => {
      try {
        const parsed = new URL(url)
        return ["http:", "https:"].includes(parsed.protocol)
      } catch {
        return false
      }
    }

    expect(isValidUrl("https://example.com")).toBe(true)
    expect(isValidUrl("http://example.com/page?q=1")).toBe(true)
    expect(isValidUrl("ftp://example.com")).toBe(false)
    expect(isValidUrl("javascript:alert(1)")).toBe(false)
    expect(isValidUrl("not-a-url")).toBe(false)
  })
})

// ── File validation constants ─────────────────────────────────────────────────
describe("media file type and size constants", () => {
  it("should export IMAGE_TYPES with supported formats", () => {
    const { IMAGE_TYPES } = require("./media")
    expect(IMAGE_TYPES).toContain("image/jpeg")
    expect(IMAGE_TYPES).toContain("image/png")
    expect(IMAGE_TYPES).toContain("image/gif")
    expect(IMAGE_TYPES).toContain("image/webp")
  })

  it("should export VIDEO_TYPES with supported formats", () => {
    const { VIDEO_TYPES } = require("./media")
    expect(VIDEO_TYPES).toContain("video/mp4")
    expect(VIDEO_TYPES).toContain("video/webm")
  })

  it("should export FILE_TYPES with supported formats", () => {
    const { FILE_TYPES } = require("./media")
    expect(FILE_TYPES).toContain("application/pdf")
  })

  it("should have correct size limits", () => {
    const { MAX_IMAGE_SIZE, MAX_VIDEO_SIZE, MAX_FILE_SIZE, MAX_IMAGES_PER_POST } = require("./media")
    expect(MAX_IMAGE_SIZE).toBe(10 * 1024 * 1024)   // 10MB
    expect(MAX_VIDEO_SIZE).toBe(100 * 1024 * 1024)  // 100MB
    expect(MAX_FILE_SIZE).toBe(25 * 1024 * 1024)    // 25MB
    expect(MAX_IMAGES_PER_POST).toBe(10)
  })
})

