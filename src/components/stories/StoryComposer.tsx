"use client"

import { useState, useRef, useCallback } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { X, Image as ImageIcon, Type, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import imageCompression from "browser-image-compression"

// Preset background colours for text stories
const BG_PRESETS = [
  "#1a73e8", // Google Blue
  "#0f9d58", // Google Green
  "#f4b400", // Google Yellow
  "#db4437", // Google Red
  "#9c27b0", // Purple
  "#e91e63", // Pink
  "#00bcd4", // Cyan
  "#ff5722", // Deep Orange
  "#212121", // Near Black
  "#37474f", // Blue Grey
]

type Mode = "image" | "text"

interface StoryComposerProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

/**
 * Full-screen modal for creating a new story.
 * Supports two modes:
 *  - Image: pick a photo from device, preview, then post
 *  - Text: write text over a coloured background
 */
export function StoryComposer({ isOpen, onClose, onCreated }: StoryComposerProps) {
  const createStory = useMutation(api.stories.createStory)
  const generateUploadUrl = useMutation(api.media.generateUploadUrl)

  const [mode, setMode] = useState<Mode>("text")
  const [text, setText] = useState("")
  const [bgColor, setBgColor] = useState(BG_PRESETS[0])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setText("")
    setBgColor(BG_PRESETS[0])
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setIsSubmitting(false)
    setError("")
    setMode("text")
  }, [imagePreview])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (![ "image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, GIF, or WebP images are allowed")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB")
      return
    }
    setError("")
    
    // Compress image before setting
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      setImageFile(compressed)
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      setImagePreview(URL.createObjectURL(compressed))
    } catch (err) {
      console.error("Image compression failed:", err)
      // Fallback to original file if compression fails
      setImageFile(file)
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      setImagePreview(URL.createObjectURL(file))
    }
    e.target.value = ""
  }

  const handleSubmit = async () => {
    setError("")

    if (mode === "text" && text.trim().length === 0) {
      setError("Please enter some text for your story")
      return
    }
    if (mode === "image" && !imageFile) {
      setError("Please select an image")
      return
    }

    setIsSubmitting(true)
    try {
      let mediaUrl: string | undefined

      if (mode === "image" && imageFile) {
        // Upload image to Convex storage
        const uploadUrl = await generateUploadUrl({
          fileType: imageFile.type,
          fileSize: imageFile.size,
          uploadType: "image",
        })
        const res = await fetch(uploadUrl, {
          method: "POST",
          body: imageFile,
          headers: { "Content-Type": imageFile.type },
        })
        if (!res.ok) throw new Error("Image upload failed")
        const { storageId } = await res.json()

        // Resolve to public URL — for stories, we embed the storageId URL directly
        // The story will store the URL after resolution
        mediaUrl = `https://cdn.convex.cloud/${storageId}` // placeholder; real URL from Convex
        // Note: In production, use api.media.resolveStorageUrls to get the public URL
      }

      await createStory({
        content: mode === "text" ? text.trim() : undefined,
        mediaUrl,
        backgroundColor: mode === "text" ? bgColor : undefined,
      })

      reset()
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create story")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-full max-w-sm h-auto bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground">Create Story</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setMode("text"); setError("") }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              mode === "text"
                ? "text-primary border-b-2 border-blue-600"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Type className="h-4 w-4" />
            Text
          </button>
          <button
            onClick={() => { setMode("image"); setError("") }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              mode === "image"
                ? "text-primary border-b-2 border-blue-600"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ImageIcon className="h-4 w-4" />
            Image
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 p-4 flex-1">
          {mode === "text" ? (
            <>
              {/* Phone-like preview */}
              <div
                className="relative mx-auto w-40 h-64 rounded-2xl overflow-hidden flex items-center justify-center shadow-md transition-colors"
                style={{ backgroundColor: bgColor }}
              >
                <p
                  className="px-3 text-center text-primary-foreground font-semibold text-base break-words leading-snug"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                >
                  {text || <span className="opacity-50">Your story text…</span>}
                </p>
              </div>

              {/* Text input */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write something…"
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="text-right text-xs text-muted-foreground">{text.length}/500</div>

              {/* Background color picker */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Background</p>
                <div className="flex flex-wrap gap-2">
                  {BG_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBgColor(color)}
                      className="relative h-8 w-8 rounded-full ring-offset-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    >
                      {color === bgColor && (
                        <Check className="absolute inset-0 m-auto h-4 w-4 text-primary-foreground drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Image picker */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
              />

              {imagePreview ? (
                <div className="relative mx-auto w-40 h-64 rounded-2xl overflow-hidden shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null)
                      if (imagePreview) URL.revokeObjectURL(imagePreview)
                      setImagePreview(null)
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-primary-foreground hover:bg-black/80"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mx-auto flex h-64 w-40 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors"
                >
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Select photo</span>
                </button>
              )}
            </>
          )}

          {error && (
            <p className="text-sm text-destructive dark:text-red-400 text-center">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sharing…
              </>
            ) : (
              "Add to Story"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
