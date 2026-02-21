"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useMutation, useQuery, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import dynamic from "next/dynamic"
import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"
import { MentionAutocomplete } from "./MentionAutocomplete"

// Lazy load the heavy Tiptap editor (~300KB)
const RichTextEditor = dynamic(
  () => import("@/components/editor/RichTextEditor").then((m) => m.RichTextEditor),
  {
    loading: () => (
      <div className="h-32 animate-pulse rounded-lg bg-muted" />
    ),
    ssr: false,
  }
)
import Image from "next/image"
import {
  Image as ImageIcon,
  Video,
  FileText,
  X,
  Link as LinkIcon,
  Loader2,
  BarChart2,
  Plus,
  Trash2,
} from "lucide-react"

// Client-side file type / size constants (mirrored from convex/media.ts)
import imageCompression from "browser-image-compression"
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const VIDEO_TYPES = ["video/mp4", "video/webm"]
const FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "text/plain",
]
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_IMAGES_PER_POST = 10

interface PostComposerProps {
  onPostCreated?: () => void
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const createPost = useMutation(api.posts.createPost)
  const generateUploadUrl = useMutation(api.media.generateUploadUrl)
  const resolveStorageUrls = useMutation(api.media.resolveStorageUrls)
  const fetchLinkPreview = useAction(api.media.fetchLinkPreview)
  const createPollMutation = useMutation(api.polls.createPoll)
  const linkPollToPost = useMutation(api.polls.linkPollToPost)

  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showHashtagAutocomplete, setShowHashtagAutocomplete] = useState(false)
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false)
  const [hashtagAutocompleteQuery, setHashtagAutocompleteQuery] = useState("")
  const [mentionAutocompleteQuery, setMentionAutocompleteQuery] = useState("")
  const [selectedHashtagIndex, setSelectedHashtagIndex] = useState(0)

  // Media state
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [attachedType, setAttachedType] = useState<"image" | "video" | "file" | null>(null)
  const [filePreviews, setFilePreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [detectedLink, setDetectedLink] = useState<string | null>(null)
  const [linkPreviewData, setLinkPreviewData] = useState<{
    url: string; title?: string; description?: string; image?: string; favicon?: string
  } | null>(null)
  const [isFetchingPreview, setIsFetchingPreview] = useState(false)

  // ── Poll state ─────────────────────────────────────────────────────────
  const [showPollUI, setShowPollUI] = useState(false)
  const [pollOptions, setPollOptions] = useState(["Option 1", "Option 2"])
  const [pollDuration, setPollDuration] = useState<number | undefined>(24)
  const [pollIsAnonymous, setPollIsAnonymous] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const linkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const maxLength = 5000

  // ── Link auto-detection ────────────────────────────────────────────────
  const detectAndFetchLink = useCallback(
    (text: string) => {
      if (linkDebounceRef.current) clearTimeout(linkDebounceRef.current)
      // Only detect if no files are already attached
      if (attachedFiles.length > 0) return

      linkDebounceRef.current = setTimeout(async () => {
        const urlMatch = text.match(/https?:\/\/[^\s)>]+/)
        const url = urlMatch?.[0] ?? null
        if (url === detectedLink) return
        setDetectedLink(url)
        if (!url) {
          setLinkPreviewData(null)
          return
        }
        setIsFetchingPreview(true)
        try {
          const data = await fetchLinkPreview({ url })
          setLinkPreviewData(data ?? null)
        } catch {
          setLinkPreviewData(null)
        } finally {
          setIsFetchingPreview(false)
        }
      }, 800)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attachedFiles.length, detectedLink, fetchLinkPreview]
  )

  // ── File validation & selection ───────────────────────────────────────
  const handleFileSelect = useCallback(
    async (files: FileList | File[], type: "image" | "video" | "file") => {
      const fileArr = Array.from(files)
      if (fileArr.length === 0) return

      // Validate
      for (const file of fileArr) {
        if (type === "image") {
          if (!IMAGE_TYPES.includes(file.type)) {
            setError("Only JPEG, PNG, GIF, or WebP images are allowed")
            return
          }
          if (file.size > MAX_IMAGE_SIZE) {
            setError("Images must be under 10 MB")
            return
          }
        } else if (type === "video") {
          if (!VIDEO_TYPES.includes(file.type)) {
            setError("Only MP4 or WebM videos are allowed")
            return
          }
          if (file.size > MAX_VIDEO_SIZE) {
            setError("Videos must be under 100 MB")
            return
          }
        } else {
          if (!FILE_TYPES.includes(file.type)) {
            setError("Only PDF, DOCX, PPTX, DOC, or TXT files are allowed")
            return
          }
          if (file.size > MAX_FILE_SIZE) {
            setError("Files must be under 25 MB")
            return
          }
        }
      }

      if (type === "image" && fileArr.length > MAX_IMAGES_PER_POST) {
        setError(`You can attach at most ${MAX_IMAGES_PER_POST} images`)
        return
      }
      if (type === "video" && fileArr.length > 1) {
        setError("You can only attach 1 video")
        return
      }

      setError("")

      // Compress images client-side before storing (skip GIFs to preserve animation)
      let finalFiles = fileArr
      if (type === "image") {
        const compressionOptions = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/webp" as const,
        }
        finalFiles = await Promise.all(
          fileArr.map(async (file) => {
            if (file.type === "image/gif") return file // preserve animated GIFs
            try {
              return await imageCompression(file, compressionOptions)
            } catch {
              return file // fall back to original if compression fails
            }
          })
        )
      }

      setAttachedFiles(finalFiles)
      setAttachedType(type)
      setLinkPreviewData(null) // Clear link preview when files attached

      // Generate object URL previews for images
      if (type === "image") {
        const previews = finalFiles.map((f) => URL.createObjectURL(f))
        setFilePreviews(previews)
      } else {
        setFilePreviews([])
      }
    },
    []
  )

  const removeFile = useCallback(
    (index: number) => {
      setAttachedFiles((prev) => {
        const next = prev.filter((_, i) => i !== index)
        if (next.length === 0) setAttachedType(null)
        return next
      })
      setFilePreviews((prev) => {
        const toRevoke = prev[index]
        if (toRevoke) URL.revokeObjectURL(toRevoke)
        return prev.filter((_, i) => i !== index)
      })
    },
    []
  )

  // ── Drag and drop ─────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const files = e.dataTransfer.files
      if (!files || files.length === 0) return
      const first = files[0]
      if (IMAGE_TYPES.includes(first.type)) handleFileSelect(files, "image")
      else if (VIDEO_TYPES.includes(first.type)) handleFileSelect([first], "video")
      else handleFileSelect([first], "file")
    },
    [handleFileSelect]
  )

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const hashtagSuggestions = useQuery(
    api.hashtags.searchHashtags,
    showHashtagAutocomplete && hashtagAutocompleteQuery.length > 0
      ? { query: hashtagAutocompleteQuery, limit: 5 }
      : "skip"
  )

  // Detect hashtag or mention being typed (string-based, no cursor dependency)
  useEffect(() => {
    // Check for @ mention at end of content (last word starts with @)
    const lastAtMatch = content.match(/(?:^|\s)@([^\s@]*)$/);
    if (lastAtMatch) {
      setMentionAutocompleteQuery(lastAtMatch[1])
      setShowMentionAutocomplete(true)
      setShowHashtagAutocomplete(false)
      return
    }

    // Check for # hashtag at end of content (last word starts with #)
    const lastHashMatch = content.match(/(?:^|\s)#([^\s#]*)$/)
    if (lastHashMatch) {
      setHashtagAutocompleteQuery(lastHashMatch[1])
      setShowHashtagAutocomplete(true)
      setShowMentionAutocomplete(false)
      setSelectedHashtagIndex(0)
      return
    }

    setShowHashtagAutocomplete(false)
    setShowMentionAutocomplete(false)
  }, [content])

  // Keyboard navigation for hashtag autocomplete (via onKeyDown on wrapper div)
  const handleWrapperKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!showHashtagAutocomplete || !hashtagSuggestions || hashtagSuggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedHashtagIndex((prev) => (prev < hashtagSuggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedHashtagIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === "Enter" && showHashtagAutocomplete) {
      e.preventDefault()
      insertHashtag(hashtagSuggestions[selectedHashtagIndex].tag)
    } else if (e.key === "Escape") {
      setShowHashtagAutocomplete(false)
    }
  }

  // Insert selected hashtag (replace trailing #word at end of content)
  const insertHashtag = (tag: string) => {
    const newContent = content.replace(/(?:^|(?<=\s))#[^\s#]*$/, `#${tag} `)
    setContent(newContent !== content ? newContent : content + `#${tag} `)
    setShowHashtagAutocomplete(false)
  }

  // Insert selected mention (replace trailing @word at end of content)
  const insertMention = (username: string) => {
    const newContent = content.replace(/(?:^|(?<=\s))@[^\s@]*$/, `@${username} `)
    setContent(newContent !== content ? newContent : content + `@${username} `)
    setShowMentionAutocomplete(false)
  }

  const handleContentChange = (val: string) => {
    setContent(val)
    detectAndFetchLink(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Client-side validation
    if (!content || content.trim().length === 0) {
      if (attachedFiles.length === 0) {
        setError("Post content cannot be empty")
        return
      }
    }

    if (content.length > maxLength) {
      setError(`Post content must not exceed ${maxLength} characters`)
      return
    }

    setIsSubmitting(true)

    try {
      let postId: string | undefined
      let pollId: string | undefined
      let mediaUrls: string[] | undefined
      let finalMediaType: "image" | "video" | "file" | "link" | undefined
      let mediaFileNames: string[] | undefined

      // ── Create poll first if active ──────────────────────────────────
      if (showPollUI) {
        const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean)
        if (validOptions.length < 2) {
          setError("A poll needs at least 2 options")
          setIsSubmitting(false)
          return
        }
        for (const opt of validOptions) {
          if (opt.length > 100) {
            setError("Each poll option must be 100 characters or fewer")
            setIsSubmitting(false)
            return
          }
        }
        pollId = await createPollMutation({
          options: validOptions,
          durationHours: pollDuration,
          isAnonymous: pollIsAnonymous,
        }) as string
      }

      // ── Upload files if any ──────────────────────────────────────────
      if (attachedFiles.length > 0 && attachedType) {
        setIsUploading(true)
        setUploadProgress(0)

        const storageIds: string[] = []
        const fileNames: string[] = []

        for (let i = 0; i < attachedFiles.length; i++) {
          const file = attachedFiles[i]
          fileNames.push(file.name)

          // 1. Get presigned upload URL
          const uploadUrl = await generateUploadUrl()

          // 2. Upload file
          const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            body: file,
            headers: { "Content-Type": file.type },
          })
          if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`)

          const { storageId } = await uploadRes.json()
          storageIds.push(storageId)

          setUploadProgress(Math.round(((i + 1) / attachedFiles.length) * 100))
        }

        // 3. Resolve all storage IDs to public URLs
        const resolvedUrls = await resolveStorageUrls({
          storageIds: storageIds as any,
        })

        mediaUrls = resolvedUrls.filter((u): u is string => u !== null)
        finalMediaType = attachedType
        mediaFileNames = fileNames
        setIsUploading(false)
      } else if (linkPreviewData) {
        // Link post — store link preview, set mediaType to "link"
        finalMediaType = "link"
      }

      const createdPost = await createPost({
        content: content.trim() || " ", // Convex requires non-empty, use space if media-only
        mediaUrls,
        mediaType: finalMediaType,
        mediaFileNames,
        linkPreview: linkPreviewData ?? undefined,
        ...(pollId ? { pollId: pollId as any } : {}),
      })
      postId = createdPost?._id as string | undefined

      // Link poll to post (set two-way reference)
      if (pollId && postId) {
        await linkPollToPost({ pollId: pollId as any, postId: postId as any })
      }

      // Clear form after successful post
      setContent("")
      setAttachedFiles([])
      setAttachedType(null)
      filePreviews.forEach((u) => URL.revokeObjectURL(u))
      setFilePreviews([])
      setLinkPreviewData(null)
      setDetectedLink(null)
      setUploadProgress(0)
      setShowPollUI(false)
      setPollOptions(["Option 1", "Option 2"])
      setPollDuration(24)
      setPollIsAnonymous(false)

      if (onPostCreated) {
        onPostCreated()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post")
      setIsUploading(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="space-y-3 sm:space-y-4"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          if (!e.target.files || e.target.files.length === 0) return
          const first = e.target.files[0]
          if (IMAGE_TYPES.includes(first.type)) handleFileSelect(e.target.files, "image")
          else if (VIDEO_TYPES.includes(first.type)) handleFileSelect([first], "video")
          else handleFileSelect([first], "file")
          // Reset so the same file can be re-selected
          e.target.value = ""
        }}
        accept={[...IMAGE_TYPES, ...VIDEO_TYPES, ...FILE_TYPES].join(",")}
        multiple
      />

      <div className="relative" onKeyDown={handleWrapperKeyDown}>
        <label className="block text-sm font-medium text-foreground">
          What&apos;s on your mind?
        </label>

        <div className="mt-1">
          <RichTextEditor
            value={content}
            onChange={handleContentChange}
            placeholder="Share your thoughts… (supports **markdown** syntax)"
            maxLength={maxLength}
            minHeight="120px"
            disabled={isSubmitting}
          />
        </div>

        {/* Hashtag autocomplete dropdown */}
        {showHashtagAutocomplete && hashtagSuggestions && hashtagSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-64 rounded-md bg-card shadow-lg border border-border">
            <ul className="py-1">
              {hashtagSuggestions.map((hashtag, index) => (
                <li
                  key={hashtag._id}
                  className={`px-4 py-2 cursor-pointer transition-colors ${
                    index === selectedHashtagIndex
                      ? "bg-primary/10 dark:bg-blue-900/20 text-primary"
                      : "text-foreground hover:bg-accent"
                  }`}
                  onClick={() => insertHashtag(hashtag.tag)}
                  onMouseEnter={() => setSelectedHashtagIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">#{hashtag.tag}</span>
                    <span className="text-xs text-muted-foreground">
                      {hashtag.postCount} {hashtag.postCount === 1 ? "post" : "posts"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
              <kbd className="px-1 py-0.5 rounded bg-muted bg-muted">↑</kbd>
              <kbd className="ml-1 px-1 py-0.5 rounded bg-muted bg-muted">↓</kbd> to navigate,
              <kbd className="ml-1 px-1 py-0.5 rounded bg-muted bg-muted">Enter</kbd> to select
            </div>
          </div>
        )}

        {/* Mention autocomplete dropdown */}
        {showMentionAutocomplete && (
          <MentionAutocomplete
            query={mentionAutocompleteQuery}
            onSelect={insertMention}
            onClose={() => setShowMentionAutocomplete(false)}
            position={{ top: 120, left: 16 }}
          />
        )}

        {error && (
          <p className="mt-1 text-xs text-destructive dark:text-red-400">{error}</p>
        )}
      </div>

      {/* ── Media Toolbar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-t border-border pt-2">
        <button
          type="button"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = IMAGE_TYPES.join(",")
              fileInputRef.current.multiple = true
              fileInputRef.current.click()
            }
          }}
          disabled={!!attachedType && attachedType !== "image"}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors"
          title="Attach images"
        >
          <ImageIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Images</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = VIDEO_TYPES.join(",")
              fileInputRef.current.multiple = false
              fileInputRef.current.click()
            }
          }}
          disabled={!!attachedType && attachedType !== "video"}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors"
          title="Attach video"
        >
          <Video className="h-4 w-4" />
          <span className="hidden sm:inline">Video</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = FILE_TYPES.join(",")
              fileInputRef.current.multiple = true
              fileInputRef.current.click()
            }
          }}
          disabled={!!attachedType && attachedType !== "file"}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors"
          title="Attach file"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">File</span>
        </button>

        {/* Poll toggle */}
        <button
          type="button"
          onClick={() => setShowPollUI((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            showPollUI
              ? "bg-primary/10 dark:bg-blue-900/40 text-primary"
              : "text-muted-foreground hover:bg-accent"
          }`}
          title="Add poll"
        >
          <BarChart2 className="h-4 w-4" />
          <span className="hidden sm:inline">Poll</span>
        </button>

        {isFetchingPreview && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Fetching preview…</span>
          </div>
        )}
      </div>

      {/* ── Poll Creator ─────────────────────────────────────────────────── */}
      {showPollUI && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-primary/10 dark:bg-blue-950/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary dark:text-blue-300 flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" />
              Create Poll
            </span>
            <button
              type="button"
              onClick={() => {
                setShowPollUI(false)
                setPollOptions(["Option 1", "Option 2"])
              }}
              className="text-muted-foreground hover:text-muted-foreground hover:text-foreground"
              aria-label="Remove poll"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions]
                    next[i] = e.target.value
                    setPollOptions(next)
                  }}
                  placeholder={`Option ${i + 1}`}
                  maxLength={100}
                  className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button
                type="button"
                onClick={() => setPollOptions((prev) => [...prev, ""])}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add option
              </button>
            )}
          </div>

          {/* Duration & Anonymous */}
          <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Duration</label>
              <select
                value={pollDuration ?? ""}
                onChange={(e) =>
                  setPollDuration(e.target.value ? Number(e.target.value) : undefined)
                }
                className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">1 day</option>
                <option value="72">3 days</option>
                <option value="168">1 week</option>
                <option value="">No expiry</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pollIsAnonymous}
                onChange={(e) => setPollIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground">Anonymous votes</span>
            </label>
          </div>
        </div>
      )}

      {/* ── Image Previews ───────────────────────────────────────────────── */}
      {attachedType === "image" && filePreviews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filePreviews.map((src, i) => (
            <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Attachment ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-primary-foreground hover:bg-black/80"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Video/File Attachment List ──────────────────────────────────── */}
      {attachedType !== "image" && attachedFiles.length > 0 && (
        <div className="flex flex-col gap-1">
          {attachedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-muted bg-card px-3 py-2">
              {attachedType === "video" ? (
                <Video className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-primary shrink-0" />
              )}
              <span className="flex-1 truncate text-sm text-foreground">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Upload progress ──────────────────────────────────────────────── */}
      {isUploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Link Preview ─────────────────────────────────────────────────── */}
      {linkPreviewData && attachedFiles.length === 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => { setLinkPreviewData(null); setDetectedLink(null) }}
            className="absolute -top-1 -right-1 z-10 rounded-full bg-muted bg-muted p-0.5 hover:bg-muted dark:hover:bg-muted"
            aria-label="Remove link preview"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Link preview</span>
          </div>
          <div className="flex overflow-hidden rounded-xl border border-border bg-card">
            {linkPreviewData.image && (
              <div className="relative w-24 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={linkPreviewData.image} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex flex-col justify-center gap-0.5 px-3 py-2 min-w-0">
              {linkPreviewData.title && (
                <p className="truncate text-sm font-semibold text-foreground">{linkPreviewData.title}</p>
              )}
              {linkPreviewData.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{linkPreviewData.description}</p>
              )}
              <p className="truncate text-xs text-muted-foreground">{linkPreviewData.url}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isSubmitting || isUploading || (content.trim().length === 0 && attachedFiles.length === 0)}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 sm:text-base flex items-center justify-center gap-2"
          style={{ minHeight: "44px" }}
        >
          {(isSubmitting || isUploading) && <ButtonLoadingSpinner />}
          {isUploading ? `Uploading ${uploadProgress}%…` : isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  )
}
