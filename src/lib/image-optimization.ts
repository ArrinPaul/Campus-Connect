import imageCompression from "browser-image-compression"

/**
 * Client-side image optimization utilities.
 *
 * Compresses images before upload to reduce bandwidth and storage costs.
 * Uses browser-image-compression for WebAssembly-powered compression.
 */

export interface ImageCompressionOptions {
  /** Max file size in MB (default: 1) */
  maxSizeMB?: number
  /** Max width/height in pixels (default: 1920) */
  maxWidthOrHeight?: number
  /** Use web worker for background processing (default: true) */
  useWebWorker?: boolean
  /** Output file type (default: original) */
  fileType?: string
  /** Quality 0-1 for lossy formats (default: 0.8) */
  initialQuality?: number
}

const DEFAULT_OPTIONS: ImageCompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.8,
}

const AVATAR_OPTIONS: ImageCompressionOptions = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 400,
  useWebWorker: true,
  initialQuality: 0.85,
}

const THUMBNAIL_OPTIONS: ImageCompressionOptions = {
  maxSizeMB: 0.1,
  maxWidthOrHeight: 300,
  useWebWorker: true,
  initialQuality: 0.7,
}

/**
 * Compress an image file with sensible defaults.
 *
 * @param file - The image File to compress
 * @param options - Custom compression options (merged with defaults)
 * @returns Compressed File object
 *
 * @example
 * const compressed = await compressImage(file)
 * // Upload `compressed` instead of `file`
 */
export async function compressImage(
  file: File,
  options?: Partial<ImageCompressionOptions>
): Promise<File> {
  // Skip compression for small files (< 100KB) or non-image files
  if (file.size < 100 * 1024 || !file.type.startsWith("image/")) {
    return file
  }

  // Skip compression for SVGs and GIFs (they don't benefit from lossy compression)
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  try {
    const compressed = await imageCompression(file, mergedOptions)

    // Only use compressed version if it's actually smaller
    if (compressed.size >= file.size) {
      return file
    }

    return new File([compressed], file.name, { type: compressed.type })
  } catch (error) {
    console.error("[image-optimization] Compression failed:", error)
    // Return original file if compression fails
    return file
  }
}

/**
 * Compress an image for use as an avatar/profile picture.
 * Uses stricter size limits (200KB, 400×400px).
 */
export async function compressAvatar(file: File): Promise<File> {
  return compressImage(file, AVATAR_OPTIONS)
}

/**
 * Compress an image for thumbnail use.
 * Uses minimal quality (100KB, 300×300px).
 */
export async function compressThumbnail(file: File): Promise<File> {
  return compressImage(file, THUMBNAIL_OPTIONS)
}

/**
 * Get image dimensions without loading the full image.
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      reject(new Error("Failed to load image"))
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Validate image file constraints.
 */
export function validateImage(
  file: File,
  options?: {
    maxSizeMB?: number
    allowedTypes?: string[]
  }
): { valid: boolean; error?: string } {
  const maxSize = (options?.maxSizeMB ?? 10) * 1024 * 1024
  const allowedTypes = options?.allowedTypes ?? [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}`,
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max: ${options?.maxSizeMB ?? 10}MB`,
    }
  }

  return { valid: true }
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
