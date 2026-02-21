import { v } from "convex/values"
import { mutation, query, action } from "./_generated/server"

// Allowed file types and size limits
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
export const VIDEO_TYPES = ["video/mp4", "video/webm"]
export const FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/msword", // .doc
  "text/plain",
]

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB
export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
export const MAX_IMAGES_PER_POST = 10

/**
 * Generate a presigned upload URL for Convex file storage.
 * The client uses this URL to upload files directly to storage.
 * Returns a URL valid for 1 hour.
 * 
 * Validates file type and size before generating URL to prevent:
 * - Malicious file uploads (executables, scripts)
 * - Storage abuse (oversized files)
 * - XSS attacks via file content
 */
export const generateUploadUrl = mutation({
  args: {
    fileType: v.string(),
    fileSize: v.number(),
    uploadType: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("file")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    // Validate file type
    let allowedTypes: string[]
    let maxSize: number

    switch (args.uploadType) {
      case "image":
        allowedTypes = IMAGE_TYPES
        maxSize = MAX_IMAGE_SIZE
        break
      case "video":
        allowedTypes = VIDEO_TYPES
        maxSize = MAX_VIDEO_SIZE
        break
      case "file":
        allowedTypes = FILE_TYPES
        maxSize = MAX_FILE_SIZE
        break
    }

    if (!allowedTypes.includes(args.fileType)) {
      throw new Error(
        `Invalid file type: ${args.fileType}. Allowed types: ${allowedTypes.join(", ")}`
      )
    }

    if (args.fileSize > maxSize) {
      const fileSizeMB = (args.fileSize / 1024 / 1024).toFixed(2)
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0)
      throw new Error(
        `File too large: ${fileSizeMB}MB. Maximum allowed: ${maxSizeMB}MB`
      )
    }

    // Additional validation: Check for suspicious file type patterns
    const suspiciousPatterns = [
      "application/x-msdownload", // .exe
      "application/x-executable",
      "application/x-sh",
      "application/x-shellscript",
      "text/javascript",
      "application/javascript",
    ]

    if (suspiciousPatterns.includes(args.fileType)) {
      throw new Error("This file type is not allowed for security reasons")
    }

    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Get the permanent URL for a storage file by its storage ID.
 * Used after uploading to resolve the storage ID to a public URL.
 */
export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    return await ctx.storage.getUrl(args.storageId)
  },
})

/**
 * Delete an uploaded file from storage.
 * Used when a post is deleted or a user removes an attachment.
 * Note: In a production system with file ownership tracking,
 * verify the authenticated user owns the file before deleting.
 */
export const deleteUpload = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    // Note: Convex storage doesn't have built-in ownership tracking.
    // In production, maintain a separate table linking storageIds to uploaders.
    // For now, only authenticated users can delete, and the client only
    // surfaces delete for the user's own posts/uploads.
    await ctx.storage.delete(args.storageId)
    return { success: true }
  },
})

/**
 * Resolve an array of storage IDs to public URLs.
 * Called after uploading files, before creating a post.
 * Limited to MAX_IMAGES_PER_POST to prevent abuse.
 */
export const resolveStorageUrls = mutation({
  args: {
    storageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    if (args.storageIds.length > MAX_IMAGES_PER_POST) {
      throw new Error(`Too many storage IDs (max ${MAX_IMAGES_PER_POST})`)
    }

    const urls: (string | null)[] = await Promise.all(
      args.storageIds.map((id) => ctx.storage.getUrl(id))
    )
    return urls
  },
})

/**
 * Fetch Open Graph / link preview metadata from a URL.
 * Extracts: og:title, og:description, og:image, og:url, favicon.
 * This is a Convex action (can perform network requests).
 */
export const fetchLinkPreview = action({
  args: {
    url: v.string(),
  },
  handler: async (_ctx, args) => {
    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(args.url)
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid URL protocol")
      }
    } catch {
      throw new Error("Invalid URL")
    }

    try {
      const response = await fetch(args.url, {
        method: "GET",
        headers: {
          "User-Agent": "CampusConnect/1.0 (Link Preview Bot)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(5000), // 5s timeout
      })

      if (!response.ok) {
        return null
      }

      const contentType = response.headers.get("content-type") || ""
      if (!contentType.includes("text/html")) {
        // Not an HTML page — return just the URL
        return {
          url: args.url,
          title: parsedUrl.hostname,
          description: undefined,
          image: undefined,
          favicon: `${parsedUrl.origin}/favicon.ico`,
        }
      }

      const html = await response.text()

      // Extract meta tags with simple regex
      const ogTitle = extractMetaContent(html, "og:title") || extractTitle(html)
      const ogDescription =
        extractMetaContent(html, "og:description") ||
        extractMetaContent(html, "description")
      const ogImage = extractMetaContent(html, "og:image")
      const ogUrl = extractMetaContent(html, "og:url") || args.url
      const favicon = `${parsedUrl.origin}/favicon.ico`

      return {
        url: ogUrl,
        title: ogTitle || parsedUrl.hostname,
        description: ogDescription || undefined,
        image: ogImage || undefined,
        favicon,
      }
    } catch {
      // Return minimal preview on error
      return {
        url: args.url,
        title: parsedUrl.hostname,
        description: undefined,
        image: undefined,
        favicon: `${parsedUrl.origin}/favicon.ico`,
      }
    }
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractMetaContent(html: string, property: string): string | undefined {
  // Try og: / twitter: / name= patterns
  const patterns = [
    new RegExp(
      `<meta[^>]*property=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${escapeRegex(property)}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*name=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${escapeRegex(property)}["']`,
      "i"
    ),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return decodeHtmlEntities(match[1].trim())
    }
  }
  return undefined
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : undefined
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
}
