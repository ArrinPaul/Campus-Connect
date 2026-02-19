"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useMutation, useQuery, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"
import { parseHashtags } from "../../../lib/hashtag-utils"
import { parseMentions } from "../../../lib/mention-utils"
import { MentionAutocomplete } from "./MentionAutocomplete"
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
  const [cursorPosition, setCursorPosition] = useState(0)

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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
    (files: FileList | File[], type: "image" | "video" | "file") => {
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
      setAttachedFiles(fileArr)
      setAttachedType(type)
      setLinkPreviewData(null) // Clear link preview when files attached

      // Generate object URL previews for images
      if (type === "image") {
        const previews = fileArr.map((f) => URL.createObjectURL(f))
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

  // Detect hashtag or mention being typed
  useEffect(() => {
    if (!textareaRef.current) return

    const position = textareaRef.current.selectionStart
    const textBeforeCursor = content.substring(0, position)
    
    // Check for @ mention (prioritize over hashtag if both present)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      
      // Check if we're still typing the mention (no spaces)
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionAutocompleteQuery(textAfterAt)
        setShowMentionAutocomplete(true)
        setShowHashtagAutocomplete(false)
        return
      }
    }
    
    // Check for # hashtag
    const lastHashIndex = textBeforeCursor.lastIndexOf("#")
    if (lastHashIndex !== -1) {
      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1)
      
      // Check if we're still typing the hashtag (no spaces)
      if (!textAfterHash.includes(" ") && !textAfterHash.includes("\n")) {
        setHashtagAutocompleteQuery(textAfterHash)
        setShowHashtagAutocomplete(true)
        setShowMentionAutocomplete(false)
        setSelectedHashtagIndex(0)
        return
      }
    }
    
    setShowHashtagAutocomplete(false)
    setShowMentionAutocomplete(false)
  }, [content, cursorPosition])

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only handle hashtag autocomplete keyboard events (mentions have their own)
    if (!showHashtagAutocomplete || !hashtagSuggestions || hashtagSuggestions.length === 0) {
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedHashtagIndex((prev) => 
        prev < hashtagSuggestions.length - 1 ? prev + 1 : prev
      )
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

  // Insert selected hashtag
  const insertHashtag = (tag: string) => {
    if (!textareaRef.current) return

    const position = textareaRef.current.selectionStart
    const textBeforeCursor = content.substring(0, position)
    const textAfterCursor = content.substring(position)
    
    // Find the last # before cursor
    const lastHashIndex = textBeforeCursor.lastIndexOf("#")
    
    if (lastHashIndex !== -1) {
      const newContent = 
        content.substring(0, lastHashIndex) + 
        `#${tag} ` + 
        textAfterCursor
      
      setContent(newContent)
      setShowHashtagAutocomplete(false)
      
      // Set cursor position after inserted hashtag
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = lastHashIndex + tag.length + 2 // +2 for # and space
          textareaRef.current.selectionStart = newPosition
          textareaRef.current.selectionEnd = newPosition
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  // Insert selected mention
  const insertMention = (username: string) => {
    if (!textareaRef.current) return

    const position = textareaRef.current.selectionStart
    const textBeforeCursor = content.substring(0, position)
    const textAfterCursor = content.substring(position)
    
    // Find the last @ before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    
    if (lastAtIndex !== -1) {
      const newContent = 
        content.substring(0, lastAtIndex) + 
        `@${username} ` + 
        textAfterCursor
      
      setContent(newContent)
      setShowMentionAutocomplete(false)
      
      // Set cursor position after inserted mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = lastAtIndex + username.length + 2 // +2 for @ and space
          textareaRef.current.selectionStart = newPosition
          textareaRef.current.selectionEnd = newPosition
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    setCursorPosition(e.target.selectionStart)
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

      <div className="relative">
        <label htmlFor="postContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What&apos;s on your mind?
        </label>
        
        {/* Syntax-highlighted overlay */}
        <div className="relative mt-1">
          {/* Hidden div for syntax highlighting */}
          <div
            className="absolute inset-0 rounded-md border border-transparent px-3 py-2 text-gray-900 dark:text-gray-100 pointer-events-none whitespace-pre-wrap break-words overflow-hidden"
            style={{
              fontFamily: "inherit",
              fontSize: "inherit",
              lineHeight: "inherit",
            }}
            aria-hidden="true"
          >
            {/* Parse and render both hashtags and mentions */}
            {parseHashtags(content).map((hashtagSegment, hashIndex) => {
              if (hashtagSegment.type === "hashtag") {
                return (
                  <span key={hashIndex} className="text-blue-600 dark:text-blue-400 font-medium">
                    {hashtagSegment.content}
                  </span>
                )
              }
              // For text segments, parse mentions
              return parseMentions(hashtagSegment.content).map((mentionSegment, mentionIndex) => {
                if (mentionSegment.type === "mention") {
                  return (
                    <span key={`${hashIndex}-${mentionIndex}`} className="text-blue-600 dark:text-blue-400 font-medium">
                      @{mentionSegment.content}
                    </span>
                  )
                }
                return <span key={`${hashIndex}-${mentionIndex}`}>{mentionSegment.content}</span>
              })
            })}
            {/* Placeholder when empty */}
            {content.length === 0 && (
              <span className="text-gray-400 dark:text-gray-500">
                Share your thoughts, ideas, or updates...
              </span>
            )}
          </div>

          {/* Actual textarea (transparent text) */}
          <textarea
            ref={textareaRef}
            id="postContent"
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            rows={4}
            maxLength={maxLength}
            className="relative block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 caret-gray-900 dark:caret-gray-100"
            style={{
              color: "transparent",
              caretColor: "currentColor",
            }}
          />
        </div>

        {/* Hashtag autocomplete dropdown */}
        {showHashtagAutocomplete && hashtagSuggestions && hashtagSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-64 rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
            <ul className="py-1">
              {hashtagSuggestions.map((hashtag, index) => (
                <li
                  key={hashtag._id}
                  className={`px-4 py-2 cursor-pointer transition-colors ${
                    index === selectedHashtagIndex
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => insertHashtag(hashtag.tag)}
                  onMouseEnter={() => setSelectedHashtagIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">#{hashtag.tag}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {hashtag.postCount} {hashtag.postCount === 1 ? "post" : "posts"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">↑</kbd>
              <kbd className="ml-1 px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">↓</kbd> to navigate,
              <kbd className="ml-1 px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">Enter</kbd> to select
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

        <div className="mt-1 flex justify-between text-xs sm:text-sm">
          <span className="text-red-600 dark:text-red-400">{error}</span>
          <span className={`${content.length > maxLength ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
            {content.length}/{maxLength}
          </span>
        </div>
      </div>

      {/* ── Media Toolbar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-2">
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
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
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
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
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
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
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
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title="Add poll"
        >
          <BarChart2 className="h-4 w-4" />
          <span className="hidden sm:inline">Poll</span>
        </button>

        {isFetchingPreview && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Fetching preview…</span>
          </div>
        )}
      </div>

      {/* ── Poll Creator ─────────────────────────────────────────────────── */}
      {showPollUI && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" />
              Create Poll
            </span>
            <button
              type="button"
              onClick={() => {
                setShowPollUI(false)
                setPollOptions(["Option 1", "Option 2"])
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-gray-400 hover:text-red-500 transition-colors"
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
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add option
              </button>
            )}
          </div>

          {/* Duration & Anonymous */}
          <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Duration</label>
              <select
                value={pollDuration ?? ""}
                onChange={(e) =>
                  setPollDuration(e.target.value ? Number(e.target.value) : undefined)
                }
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Anonymous votes</span>
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
                className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
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
            <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2">
              {attachedType === "video" ? (
                <Video className="h-4 w-4 text-blue-500 shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
              )}
              <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
              <span className="shrink-0 text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
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
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Uploading…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
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
            className="absolute -top-1 -right-1 z-10 rounded-full bg-gray-200 dark:bg-gray-700 p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600"
            aria-label="Remove link preview"
          >
            <X className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
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
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:text-base flex items-center justify-center gap-2"
          style={{ minHeight: "44px" }}
        >
          {(isSubmitting || isUploading) && <ButtonLoadingSpinner />}
          {isUploading ? `Uploading ${uploadProgress}%…` : isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  )
}
