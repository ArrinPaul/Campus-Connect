import { validateImage, formatFileSize } from "./image-optimization"

// Mock browser-image-compression (it requires browser APIs)
jest.mock("browser-image-compression", () => jest.fn())

describe("image-optimization", () => {
  describe("validateImage", () => {
    function createMockFile(
      name: string,
      size: number,
      type: string
    ): File {
      const buffer = new ArrayBuffer(size)
      return new File([buffer], name, { type })
    }

    it("should accept valid JPEG images", () => {
      const file = createMockFile("photo.jpg", 1024 * 1024, "image/jpeg")
      const result = validateImage(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should accept valid PNG images", () => {
      const file = createMockFile("image.png", 2 * 1024 * 1024, "image/png")
      const result = validateImage(file)
      expect(result.valid).toBe(true)
    })

    it("should accept valid WebP images", () => {
      const file = createMockFile("photo.webp", 500 * 1024, "image/webp")
      const result = validateImage(file)
      expect(result.valid).toBe(true)
    })

    it("should reject invalid file types", () => {
      const file = createMockFile("doc.pdf", 1024, "application/pdf")
      const result = validateImage(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Invalid file type")
    })

    it("should reject files exceeding max size", () => {
      const file = createMockFile(
        "huge.jpg",
        15 * 1024 * 1024,
        "image/jpeg"
      )
      const result = validateImage(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("File too large")
    })

    it("should use custom max size", () => {
      const file = createMockFile(
        "small.jpg",
        3 * 1024 * 1024,
        "image/jpeg"
      )
      const result = validateImage(file, { maxSizeMB: 2 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Max: 2MB")
    })

    it("should use custom allowed types", () => {
      const file = createMockFile("photo.gif", 1024, "image/gif")
      const result = validateImage(file, {
        allowedTypes: ["image/jpeg", "image/png"],
      })
      expect(result.valid).toBe(false)
    })
  })

  describe("formatFileSize", () => {
    it("should format bytes", () => {
      expect(formatFileSize(500)).toBe("500 B")
    })

    it("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1.0 KB")
      expect(formatFileSize(1536)).toBe("1.5 KB")
    })

    it("should format megabytes", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1.0 MB")
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 MB")
    })
  })
})
