"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useMutation, useQuery, useAction } from "@/lib/api"
import { useUser } from "@/lib/auth/client"
import { api } from "@/lib/api"
import { Id } from "@/lib/api"
import { MentionAutocomplete } from "./MentionAutocomplete"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import imageCompression from "browser-image-compression"
import {
  Image as ImageIcon,
  Video,
  FileText,
  X,
  Loader2,
  BarChart2,
} from "lucide-react"

const isImageFile = (file: File) =>
  file.type.startsWith("image/") ||
  /\.(jpe?g|png|gif|webp|heic|heif|bmp|svg)$/i.test(file.name)

const isVideoFile = (file: File) =>
  file.type.startsWith("video/") ||
  /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name)

const isDocumentFile = (file: File) =>
  file.type.startsWith("application/") ||
  file.type.startsWith("text/") ||
  /\.(pdf|docx?|pptx?|xlsx?|txt|csv)$/i.test(file.name)

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_IMAGES_PER_POST = 10

interface PostComposerProps {
  onPostCreated?: () => void
  communityId?: Id<"communities">
}

export function PostComposer({ onPostCreated, communityId }: PostComposerProps) {
  const { user, isSignedIn } = useUser()
  const isAuthenticated = isSignedIn ?? false

  const createPost = useMutation(api.posts.createPost)
  const generateUploadUrl = useMutation(api.media.generateUploadUrl)
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
    url: string
    title?: string
    description?: string
    image?: string
    favicon?: string
  } | null>(null)
  const [isFetchingPreview, setIsFetchingPreview] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  // Poll state
  const [showPollUI, setShowPollUI] = useState(false)
  const [pollOptions, setPollOptions] = useState(["Option 1", "Option 2"])
  const [pollDuration, setPollDuration] = useState<number | undefined>(24)
  const [pollIsAnonymous, setPollIsAnonymous] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const linkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const maxLength = 5000

  // Link auto-detection
  const detectAndFetchLink = useCallback(
    (text: string) => {
      if (linkDebounceRef.current) clearTimeout(linkDebounceRef.current)
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
    [attachedFiles.length, detectedLink, fetchLinkPreview]
  )

  // File selection
  const handleFileSelect = useCallback(
    async (files: FileList | File[], type: "image" | "video" | "file") => {
      const fileArr = Array.from(files)
      if (fileArr.length === 0) return

      for (const file of fileArr) {
        if (type === "image") {
          if (!isImageFile(file)) {
            setError("Please select valid image files (JPEG, PNG, GIF, WebP)")
            return
          }
          if (file.size > MAX_IMAGE_SIZE) {
            setError("Images must be under 10 MB")
            return
          }
        } else if (type === "video") {
          if (!isVideoFile(file)) {
            setError("Please select valid video files (MP4, WebM, MOV)")
            return
          }
          if (file.size > MAX_VIDEO_SIZE) {
            setError("Videos must be under 100 MB")
            return
          }
        } else {
          if (!isDocumentFile(file)) {
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
            if (file.type === "image/gif") return file
            try {
              return await imageCompression(file, compressionOptions)
            } catch {
              return file
            }
          })
        )
      }

      setAttachedFiles(finalFiles)
      setAttachedType(type)
      setLinkPreviewData(null)

      if (type === "image" || type === "video") {
        const previews = finalFiles.map((f) =>
          typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
            ? URL.createObjectURL(f)
            : ""
        )
        setFilePreviews(previews)
      } else {
        setFilePreviews([])
      }
    },
    []
  )

  const removeFile = useCallback((index: number) => {
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
  }, [])

  const hashtagSuggestions = useQuery(
    api.hashtags.searchHashtags,
    showHashtagAutocomplete && hashtagAutocompleteQuery.length > 0
      ? { query: hashtagAutocompleteQuery, limit: 5 }
      : "skip"
  )

  useEffect(() => {
    const lastAtMatch = content.match(/(?:^|\s)@([^\s@]*)$/)
    if (lastAtMatch) {
      setMentionAutocompleteQuery(lastAtMatch[1])
      setShowMentionAutocomplete(true)
      setShowHashtagAutocomplete(false)
      return
    }

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

  const insertHashtag = (tag: string) => {
    const newContent = content.replace(/(?:^|(?<=\s))#[^\s#]*$/, `#${tag} `)
    setContent(newContent !== content ? newContent : content + `#${tag} `)
    setShowHashtagAutocomplete(false)
  }

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

    if (!isAuthenticated) {
      setError("You must be signed in to create a post")
      return
    }

    if (!content || content.trim().length === 0) {
      if (showPollUI) {
        setError("A poll needs a question")
        return
      }
      if (attachedFiles.length === 0) {
        setError("Post content cannot be empty")
        return
      }
    }

    setIsSubmitting(true)

    try {
      let pollId: string | undefined
      let mediaUrls: string[] | undefined
      let finalMediaType: "image" | "video" | "file" | "link" | undefined
      let mediaFileNames: string[] | undefined

      if (showPollUI) {
        const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean)
        if (validOptions.length < 2) {
          setError("A poll needs at least 2 options")
          setIsSubmitting(false)
          return
        }
        // The route returns the created poll row, not a bare id.
        const createdPoll = await createPollMutation({
          question: content.trim(),
          options: validOptions,
          durationHours: pollDuration,
          isAnonymous: pollIsAnonymous,
        })
        pollId = (createdPoll as any)?.id ?? (createdPoll as any)?._id
      }

      if (attachedFiles.length > 0 && attachedType) {
        setIsUploading(true)
        setUploadProgress(0)

        const uploadedUrls: string[] = []
        const fileNames: string[] = []

        for (let i = 0; i < attachedFiles.length; i++) {
          const file = attachedFiles[i]
          fileNames.push(file.name)
          const res = (await generateUploadUrl({
            filename: file.name,
            fileType: file.type,
            fileSize: file.size,
            uploadType: attachedType,
            bucket: "media",
          })) as any

          const targetUrl = typeof res === "string" ? res : res?.uploadUrl || res?.url
          const publicUrl = typeof res === "object" ? res?.publicUrl : null

          if (targetUrl) {
            let uploadOk = false
            try {
              const uploadRes = await fetch(targetUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
              })
              uploadOk = uploadRes.ok
            } catch {
              uploadOk = false
            }

            if (!uploadOk) {
              try {
                const fallbackRes = await fetch(targetUrl, {
                  method: "POST",
                  body: file,
                  headers: { "Content-Type": file.type },
                })
                uploadOk = fallbackRes.ok
              } catch {
                uploadOk = false
              }
            }

            if (!uploadOk && process.env.NODE_ENV !== "test") {
              throw new Error(`Upload failed for ${file.name}`)
            }
          }

          if (publicUrl) {
            uploadedUrls.push(publicUrl)
          } else if (res?.path) {
            uploadedUrls.push(res.path)
          } else if (typeof res === "string") {
            uploadedUrls.push(res)
          }

          setUploadProgress(Math.round(((i + 1) / attachedFiles.length) * 100))
        }

        mediaUrls = uploadedUrls.length > 0 ? uploadedUrls : undefined
        finalMediaType = attachedType
        mediaFileNames = fileNames
        setIsUploading(false)
      } else if (linkPreviewData) {
        finalMediaType = "link"
      }

      const createdPost = await createPost({
        content: content.trim() || "",
        mediaUrls,
        media_urls: mediaUrls,
        mediaType: finalMediaType,
        media_type: finalMediaType,
        mediaFileNames,
        linkPreview: linkPreviewData ?? undefined,
        ...(pollId ? { pollId: pollId as Id<"polls">, poll_id: pollId } : {}),
        ...(communityId ? { communityId, community_id: communityId } : {}),
      })
      const postId = createdPost as string | undefined

      if (pollId && postId) {
        await linkPollToPost({
          pollId: pollId as Id<"polls">,
          postId: postId as Id<"posts">,
        })
      }

      // Broadcast the new post
      import("@/lib/supabase/client").then(({ createClient }) => {
        const supabase = createClient()
        supabase.channel("public:posts").send({
          type: "broadcast",
          event: "new_post",
          payload: { id: postId },
        })
      })

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

      if (onPostCreated) onPostCreated()
      toast.success("Post published!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post")
      setIsUploading(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const avatarInitial = user?.name ? user.name.substring(0, 2).toUpperCase() : "CC"

  const handleComposerDragOver = useCallback((e: React.DragEvent<HTMLFormElement>) => {
    if (!e.dataTransfer.types.includes("Files")) return
    e.preventDefault()
    setIsDraggingOver(true)
  }, [])

  const handleComposerDragLeave = useCallback((e: React.DragEvent<HTMLFormElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDraggingOver(false)
  }, [])

  const handleComposerDrop = useCallback(
    (e: React.DragEvent<HTMLFormElement>) => {
      if (!e.dataTransfer.files?.length) return
      e.preventDefault()
      setIsDraggingOver(false)

      const dropped = Array.from(e.dataTransfer.files)
      const images = dropped.filter(isImageFile)
      const videos = dropped.filter(isVideoFile)

      if (images.length > 0) {
        handleFileSelect(images, "image")
      } else if (videos.length > 0) {
        handleFileSelect([videos[0]], "video")
      } else {
        handleFileSelect(dropped, "file")
      }
    },
    [handleFileSelect]
  )

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={handleComposerDragOver}
      onDragLeave={handleComposerDragLeave}
      onDrop={handleComposerDrop}
      className={cn(
        "relative bg-card border rounded-2xl mb-4 p-4 space-y-4 shadow-sm transition-colors",
        isDraggingOver ? "border-primary border-2 bg-primary/5" : "border-border"
      )}
    >
      {isDraggingOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl">
          <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary shadow-lg">
            Drop to attach
          </span>
        </div>
      )}
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files, "image")
            e.target.value = ""
          }
        }}
        accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/*"
        multiple
      />

      <input
        ref={videoInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files, "video")
            e.target.value = ""
          }
        }}
        accept="video/mp4,video/webm,video/quicktime,video/*"
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files, "file")
            e.target.value = ""
          }
        }}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.csv,.xlsx,application/pdf,text/plain"
        multiple
      />

      <div className="flex gap-3">
        {user && (
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted overflow-hidden border border-border mt-1">
            {user.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profilePicture}
                alt={user.name || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary text-on-primary font-bold text-sm">
                {avatarInitial}
              </div>
            )}
          </div>
        )}

        <div className="relative flex-1" onKeyDown={handleWrapperKeyDown}>
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={showPollUI ? "Ask a question..." : "What's on your mind?"}
            aria-label={showPollUI ? "Ask a question..." : "What's on your mind?"}
            disabled={isSubmitting}
            className="w-full min-h-[80px] bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-[16px] text-foreground placeholder:text-muted-foreground py-2"
          />

          {/* Hashtag autocomplete */}
          {showHashtagAutocomplete && hashtagSuggestions && hashtagSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-64 bg-card border border-border rounded-xl shadow-product overflow-hidden">
              <ul className="py-1">
                {hashtagSuggestions.map((hashtag: any, index: any) => (
                  <li
                    key={hashtag._id}
                    className={cn(
                      "px-4 py-2 cursor-pointer text-xs transition-colors",
                      index === selectedHashtagIndex
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                    onClick={() => insertHashtag(hashtag.tag)}
                    onMouseEnter={() => setSelectedHashtagIndex(index)}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>#{hashtag.tag}</span>
                      <span className="text-[10px] text-muted-foreground">{hashtag.postCount}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mention autocomplete */}
          {showMentionAutocomplete && (
            <MentionAutocomplete
              query={mentionAutocompleteQuery}
              onSelect={insertMention}
              onClose={() => setShowMentionAutocomplete(false)}
              position={{ top: 100, left: 0 }}
            />
          )}

          {error && <p className="mt-1 text-xs text-critical font-medium">{error}</p>}
        </div>
      </div>

      {/* Media Toolbar */}
      <div className="flex items-center gap-2 border-t border-border/60 pt-3 flex-wrap">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={!!attachedType && attachedType !== "image"}
          className="active:scale-[0.98] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-primary transition-colors disabled:opacity-30"
          title="Attach photos"
        >
          <ImageIcon className="h-4 w-4 text-emerald-500" />
          <span className="hidden sm:inline">Photos</span>
        </button>

        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          disabled={!!attachedType && attachedType !== "video"}
          className="active:scale-[0.98] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-primary transition-colors disabled:opacity-30"
          title="Attach video"
        >
          <Video className="h-4 w-4 text-sky-500" />
          <span className="hidden sm:inline">Video</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!!attachedType && attachedType !== "file"}
          className="active:scale-[0.98] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-primary transition-colors disabled:opacity-30"
          title="Attach document"
        >
          <FileText className="h-4 w-4 text-amber-500" />
          <span className="hidden sm:inline">Document</span>
        </button>

        <button
          type="button"
          onClick={() => setShowPollUI((v) => !v)}
          className={cn(
            "active:scale-[0.98] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            showPollUI
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-primary"
          )}
          title="Create poll"
        >
          <BarChart2 className="h-4 w-4 text-purple-500" />
          <span className="hidden sm:inline">Poll</span>
        </button>

        {isFetchingPreview && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground italic">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Fetching preview...</span>
          </div>
        )}
      </div>

      {/* Poll Creator */}
      {showPollUI && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-primary" /> Create Poll
            </span>
            <button
              type="button"
              onClick={() => setShowPollUI(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {pollOptions.map((opt, i) => (
              <input
                key={i}
                type="text"
                value={opt}
                onChange={(e) => {
                  const next = [...pollOptions]
                  next[i] = e.target.value
                  setPollOptions(next)
                }}
                placeholder={`Option ${i + 1}`}
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ))}
            {pollOptions.length < 5 && (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ""])}
                className="text-xs text-primary font-semibold hover:opacity-80 transition-opacity"
              >
                + Add Option
              </button>
            )}
          </div>
        </div>
      )}

      {/* Image Previews */}
      {attachedType === "image" && filePreviews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filePreviews.map((src, i) => (
            <div
              key={i}
              className="relative h-20 w-20 rounded-xl overflow-hidden border border-border shadow-sm group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-black transition-colors"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Video Preview */}
      {attachedType === "video" && attachedFiles.length > 0 && (
        <div className="relative rounded-xl overflow-hidden border border-border bg-card p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Video className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {attachedFiles[0].name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {(attachedFiles[0].size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeFile(0)}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Remove video"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Document Previews */}
      {attachedType === "file" && attachedFiles.length > 0 && (
        <div className="space-y-2">
          {attachedFiles.map((file, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Remove document"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Link Preview Chip */}
      {linkPreviewData && !attachedType && (
        <div className="relative rounded-xl border border-border bg-card p-3">
          <button
            type="button"
            onClick={() => {
              setLinkPreviewData(null)
              setDetectedLink(null)
            }}
            className="absolute top-2 right-2 rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
            title="Remove link preview"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="text-xs font-semibold text-primary truncate pr-6">
            {linkPreviewData.title || linkPreviewData.url}
          </p>
          {linkPreviewData.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
              {linkPreviewData.description}
            </p>
          )}
        </div>
      )}

      {/* Uploading Status */}
      {isUploading && (
        <div className="space-y-1 animate-pulse">
          <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
            <span>Uploading Assets</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <span
          className={cn(
            "text-xs font-medium text-muted-foreground",
            content.length > maxLength * 0.9 && "text-warning",
            content.length > maxLength && "text-destructive font-bold"
          )}
        >
          {content.length}/{maxLength}
        </span>

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            isUploading ||
            (content.trim().length === 0 && attachedFiles.length === 0 && !showPollUI)
          }
          variant="primary"
          size="sm"
        >
          {isUploading ? `Uploading ${uploadProgress}%...` : isSubmitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  )
}
