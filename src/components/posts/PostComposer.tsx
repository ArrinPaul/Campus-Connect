"use client"

import { useState, useRef, useEffect, useCallback } from"react"
import { useMutation, useQuery, useAction } from"@/lib/api"
import { useUser } from"@/lib/auth/client"
import { api } from"@/lib/api"
import { Id } from"@/lib/api"
import dynamic from"next/dynamic"
import { ButtonLoadingSpinner } from"@/components/ui/loading-skeleton"
import { MentionAutocomplete } from"./MentionAutocomplete"
import { toast } from"sonner"
import { Button } from"@/components/ui/button"
import { cn } from"@/lib/utils"

// Lazy load the heavy Tiptap editor (~300KB)
const RichTextEditor = dynamic(
 () => import("@/components/editor/RichTextEditor").then((m) => m.RichTextEditor),
 {
 loading: () => (
 <div className="h-32 animate-pulse rounded-lg bg-canvas" />
 ),
 ssr: false,
 }
)
import Image from"next/image"
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
} from"lucide-react"

// Client-side file type / size constants (mirrored from backend media limits)
import imageCompression from "browser-image-compression"

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
  const { isSignedIn, isLoaded } = useUser()
  const isAuthenticated = isSignedIn ?? false
  
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

      // Validation
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

 const hashtagSuggestions = useQuery(
 api.hashtags.searchHashtags,
 showHashtagAutocomplete && hashtagAutocompleteQuery.length > 0
 ? { query: hashtagAutocompleteQuery, limit: 5 }
 :"skip"
 )

 useEffect(() => {
 const lastAtMatch = content.match(/(?:^|\s)@([^\s@]*)$/);
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
 if (e.key ==="ArrowDown") {
 e.preventDefault()
 setSelectedHashtagIndex((prev) => (prev < hashtagSuggestions.length - 1 ? prev + 1 : prev))
 } else if (e.key ==="ArrowUp") {
 e.preventDefault()
 setSelectedHashtagIndex((prev) => (prev > 0 ? prev - 1 : 0))
 } else if (e.key ==="Enter" && showHashtagAutocomplete) {
 e.preventDefault()
 insertHashtag(hashtagSuggestions[selectedHashtagIndex].tag)
 } else if (e.key ==="Escape") {
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
 if (attachedFiles.length === 0) {
 setError("Post content cannot be empty")
 return
 }
 }

 setIsSubmitting(true)

 try {
 let pollId: string | undefined
 let mediaUrls: string[] | undefined
 let finalMediaType:"image" |"video" |"file" |"link" | undefined
 let mediaFileNames: string[] | undefined

 if (showPollUI) {
 const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean)
 if (validOptions.length < 2) {
 setError("A poll needs at least 2 options")
 setIsSubmitting(false)
 return
 }
 pollId = await createPollMutation({
 options: validOptions,
 durationHours: pollDuration,
 isAnonymous: pollIsAnonymous,
 }) as string
 }

 if (attachedFiles.length > 0 && attachedType) {
 setIsUploading(true)
 setUploadProgress(0)

 const storageIds: string[] = []
 const fileNames: string[] = []

 for (let i = 0; i < attachedFiles.length; i++) {
 const file = attachedFiles[i]
 fileNames.push(file.name)
 const uploadUrl = await generateUploadUrl({
 fileType: file.type,
 fileSize: file.size,
 uploadType: attachedType,
 })

 const uploadRes = await fetch(uploadUrl, {
 method:"POST",
 body: file,
 headers: {"Content-Type": file.type },
 })
 if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`)
 const { storageId } = await uploadRes.json()
 storageIds.push(storageId)
 setUploadProgress(Math.round(((i + 1) / attachedFiles.length) * 100))
 }

 const resolvedUrls = await resolveStorageUrls({
 storageIds: storageIds as Id<"_storage">[],
 })
 mediaUrls = resolvedUrls.filter((u: any): u is string => u !== null)
 finalMediaType = attachedType
 mediaFileNames = fileNames
 setIsUploading(false)
 } else if (linkPreviewData) {
 finalMediaType ="link"
 }

 const createdPost = await createPost({
 content: content.trim() ||"",
 mediaUrls,
 mediaType: finalMediaType,
 mediaFileNames,
 linkPreview: linkPreviewData ?? undefined,
 ...(pollId ? { pollId: pollId as Id<"polls"> } : {}),
 ...(communityId ? { communityId } : {}),
 })
 const postId = createdPost as string | undefined

 if (pollId && postId) {
 await linkPollToPost({ pollId: pollId as Id<"polls">, postId: postId as Id<"posts"> })
 }

 // Broadcast the new post to trigger realtime feed updates
 import("@/lib/supabase/client").then(({ createClient }) => {
 const supabase = createClient()
 supabase.channel('public:posts').send({
 type:"broadcast",
 event:"new_post",
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
 setPollOptions(["Option 1","Option 2"])
 setPollDuration(24)
 setPollIsAnonymous(false)

 if (onPostCreated) onPostCreated()
 toast.success("Post published!")
 } catch (err) {
 setError(err instanceof Error ? err.message :"Failed to create post")
 setIsUploading(false)
 } finally {
 setIsSubmitting(false)
 }
 }

 return (
 <form
 onSubmit={handleSubmit}
 className="bg-surface-soft border border-hairline rounded-2xl p-4 space-y-md"
 >
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

 <div className="relative" onKeyDown={handleWrapperKeyDown}>
 <RichTextEditor
 value={content}
 onChange={handleContentChange}
 placeholder="Share your thoughts..."
 maxLength={maxLength}
 minHeight="100px"
 disabled={isSubmitting}
 />

 {/* Hashtag autocomplete */}
 {showHashtagAutocomplete && hashtagSuggestions && hashtagSuggestions.length > 0 && (
 <div className="absolute z-50 mt-1 w-64 bg-surface-soft border border-hairline rounded-xl shadow-product overflow-hidden">
 <ul className="py-1">
 {hashtagSuggestions.map((hashtag: any, index: any) => (
 <li
 key={hashtag._id}
 className={cn(
"px-4 py-2 cursor-pointer text-xs text-slate transition-colors",
 index === selectedHashtagIndex ?"bg-canvas text-primary" :"text-ink-deep hover:bg-canvas"
 )}
 onClick={() => insertHashtag(hashtag.tag)}
 onMouseEnter={() => setSelectedHashtagIndex(index)}
 >
 <div className="flex items-center justify-between font-semibold">
 <span>#{hashtag.tag}</span>
 <span className="text-[10px] text-slate">{hashtag.postCount}</span>
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

 {error && <p className="mt-2 text-xs text-critical">{error}</p>}
 </div>

  {/* Media Toolbar */}
  <div className="flex items-center gap-xs border-t border-hairline pt-sm flex-wrap">
  <button
  type="button"
  onClick={() => imageInputRef.current?.click()}
  disabled={!!attachedType && attachedType !== "image"}
  className="active:scale-[0.98] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate hover:bg-canvas hover:text-primary transition-colors disabled:opacity-30"
  title="Attach photos"
  >
  <ImageIcon className="h-4 w-4" />
  <span className="hidden sm:inline">Photos</span>
  </button>

  <button
  type="button"
  onClick={() => videoInputRef.current?.click()}
  disabled={!!attachedType && attachedType !== "video"}
  className="active:scale-[0.98] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate hover:bg-canvas hover:text-primary transition-colors disabled:opacity-30"
  title="Attach video"
  >
  <Video className="h-4 w-4" />
  <span className="hidden sm:inline">Video</span>
  </button>

  <button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  disabled={!!attachedType && attachedType !== "file"}
  className="active:scale-[0.98] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate hover:bg-canvas hover:text-primary transition-colors disabled:opacity-30"
  title="Attach document"
  >
  <FileText className="h-4 w-4" />
  <span className="hidden sm:inline">Document</span>
  </button>

  <button
  type="button"
  onClick={() => setShowPollUI((v) => !v)}
  className={cn(
  "active:scale-[0.98] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
  showPollUI ? "bg-canvas text-primary" : "text-slate hover:bg-canvas hover:text-primary"
  )}
  title="Create poll"
  >
  <BarChart2 className="h-4 w-4" />
  <span className="hidden sm:inline">Poll</span>
  </button>

 {isFetchingPreview && (
 <div className="ml-auto flex items-center gap-1.5 text-xs text-slate italic">
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 <span>Fetching preview...</span>
 </div>
 )}
 </div>

 {/* Poll Creator */}
 {showPollUI && (
 <div className="rounded-lg border border-hairline bg-canvas p-md space-y-md animate-in">
 <div className="flex items-center justify-between">
 <span className="font-semibold text-xs text-ink-deep flex items-center gap-1.5">
 <BarChart2 className="h-4 w-4" /> Create Poll
 </span>
 <button
 type="button"
 onClick={() => setShowPollUI(false)}
 className="text-slate hover:text-ink-deep transition-colors"
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
 const next = [...pollOptions];
 next[i] = e.target.value;
 setPollOptions(next);
 }}
 placeholder={`Option ${i + 1}`}
 className="w-full rounded-sm border border-hairline bg-canvas px-3 py-2 text-xs text-slate focus:outline-none focus:ring-1 focus:ring-primary"
 />
 ))}
 {pollOptions.length < 5 && (
 <button
 type="button"
 onClick={() => setPollOptions([...pollOptions,""])}
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
        <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden border border-hairline shadow-sm group">
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
    <div className="relative rounded-xl overflow-hidden border border-hairline bg-canvas p-2 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Video className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink-deep truncate">{attachedFiles[0].name}</p>
          <p className="text-[10px] text-slate">{(attachedFiles[0].size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => removeFile(0)}
        className="rounded-full p-1.5 text-slate hover:bg-surface-soft hover:text-ink-deep transition-colors"
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
        <div key={i} className="rounded-xl border border-hairline bg-canvas p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-surface-soft flex items-center justify-center text-slate shrink-0 border border-hairline">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-deep truncate">{file.name}</p>
              <p className="text-[10px] text-slate">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeFile(i)}
            className="rounded-full p-1.5 text-slate hover:bg-surface-soft hover:text-ink-deep transition-colors"
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
    <div className="relative rounded-xl border border-hairline bg-canvas p-3">
      <button
        type="button"
        onClick={() => {
          setLinkPreviewData(null)
          setDetectedLink(null)
        }}
        className="absolute top-2 right-2 rounded-full p-1 text-slate hover:bg-surface-soft transition-colors"
        title="Remove link preview"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <p className="text-xs font-semibold text-primary truncate pr-6">{linkPreviewData.title || linkPreviewData.url}</p>
      {linkPreviewData.description && (
        <p className="text-[11px] text-slate line-clamp-2 mt-0.5">{linkPreviewData.description}</p>
      )}
    </div>
  )}

 {/* Uploading Status */}
 {isUploading && (
 <div className="space-y-xs animate-pulse">
 <div className="flex justify-between text-[10px] text-slate font-semibold">
 <span>Uploading Assets</span>
 <span>{uploadProgress}%</span>
 </div>
 <div className="h-1 w-full rounded-full bg-hairline overflow-hidden">
 <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
 </div>
 </div>
 )}

 <Button
 type="submit"
 disabled={isSubmitting || isUploading || (content.trim().length === 0 && attachedFiles.length === 0 && !showPollUI)}
 variant="primary"
 className="w-full"
 >
 {isUploading ? `Uploading ${uploadProgress}%...` : isSubmitting ?"Posting..." :"Post"}
 </Button>
 </form>
 )
}
