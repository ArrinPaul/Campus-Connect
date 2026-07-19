"use client"

import { useState, useRef, useCallback } from"react"
import { useMutation } from"@/lib/api"
import { api } from"@/lib/api"
import { X, Image as ImageIcon, Type, Check, Loader2, Video as VideoIcon } from"lucide-react"
import { cn } from"@/lib/utils"
import { createLogger } from"@/lib/logger"
import imageCompression from"browser-image-compression"

const log = createLogger("StoryComposer")

// Preset background colours for text stories
const BG_PRESETS = [
"#1a73e8","#0f9d58","#f4b400","#db4437","#9c27b0",
"#e91e63","#00bcd4","#ff5722","#212121","#37474f",
]

type Mode ="image" |"video" |"text"

interface StoryComposerProps {
 isOpen: boolean
 onClose: () => void
 onCreated?: () => void
}

export function StoryComposer({ isOpen, onClose, onCreated }: StoryComposerProps) {
 const createStory = useMutation(api.stories.createStory)
 const generateUploadUrl = useMutation(api.media.generateUploadUrl)
 const resolveStorageUrls = useMutation(api.media.resolveStorageUrls)

 const [mode, setMode] = useState<Mode>("text")
 const [text, setText] = useState("")
 const [bgColor, setBgColor] = useState(BG_PRESETS[0])
 const [mediaFile, setMediaFile] = useState<File | null>(null)
 const [mediaPreview, setMediaPreview] = useState<string | null>(null)
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [error, setError] = useState("")

 const fileInputRef = useRef<HTMLInputElement>(null)

 const reset = useCallback(() => {
 setText("")
 setBgColor(BG_PRESETS[0])
 setMediaFile(null)
 if (mediaPreview) URL.revokeObjectURL(mediaPreview)
 setMediaPreview(null)
 setIsSubmitting(false)
 setError("")
 setMode("text")
 }, [mediaPreview])

 const handleClose = () => {
 reset()
 onClose()
 }

 const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (!file) return
 
 if (mode ==="image") {
 if (!["image/jpeg","image/png","image/gif","image/webp"].includes(file.type)) {
 setError("Only JPEG, PNG, GIF, or WebP images are allowed")
 return
 }
 if (file.size > 10 * 1024 * 1024) {
 setError("Image must be under 10 MB")
 return
 }
 } else if (mode ==="video") {
 if (!["video/mp4","video/webm","video/ogg"].includes(file.type)) {
 setError("Only MP4, WebM, or OGG videos are allowed")
 return
 }
 if (file.size > 50 * 1024 * 1024) {
 setError("Video must be under 50 MB")
 return
 }
 }

 setError("")
 
 if (mode ==="image") {
 try {
 const compressed = await imageCompression(file, {
 maxSizeMB: 2,
 maxWidthOrHeight: 1920,
 useWebWorker: true,
 })
 setMediaFile(compressed)
 if (mediaPreview) URL.revokeObjectURL(mediaPreview)
 setMediaPreview(URL.createObjectURL(compressed))
 } catch (err) {
 log.error("Image compression failed, using original", err instanceof Error ? err : new Error(String(err)))
 setMediaFile(file)
 if (mediaPreview) URL.revokeObjectURL(mediaPreview)
 setMediaPreview(URL.createObjectURL(file))
 }
 } else {
 setMediaFile(file)
 if (mediaPreview) URL.revokeObjectURL(mediaPreview)
 setMediaPreview(URL.createObjectURL(file))
 }
 
 e.target.value =""
 }

 const handleSubmit = async () => {
 setError("")

 if (mode ==="text" && text.trim().length === 0) {
 setError("Please enter some text for your story")
 return
 }
 if ((mode ==="image" || mode ==="video") && !mediaFile) {
 setError(`Please select a ${mode}`)
 return
 }

 setIsSubmitting(true)
 try {
 let mediaUrl: string | undefined

 if ((mode ==="image" || mode ==="video") && mediaFile) {
 const uploadUrl = await generateUploadUrl({
 fileType: mediaFile.type,
 fileSize: mediaFile.size,
 uploadType: mode,
 })
 const res = await fetch(uploadUrl, {
 method:"POST",
 body: mediaFile,
 headers: {"Content-Type": mediaFile.type },
 })
 if (!res.ok) throw new Error(`${mode} upload failed`)
 const { storageId } = await res.json()

 const urls = await resolveStorageUrls({ storageIds: [storageId] })
 if (!urls || !urls[0]) throw new Error("Failed to resolve storage URL")
 mediaUrl = urls[0]
 }

 await createStory({
 content: mode ==="text" ? text.trim() : undefined,
 mediaUrl,
 backgroundColor: mode ==="text" ? bgColor : undefined,
 })

 reset()
 onCreated?.()
 onClose()
 } catch (err) {
 setError(err instanceof Error ? err.message :"Failed to create story")
 } finally {
 setIsSubmitting(false)
 }
 }

 if (!isOpen) return null

 return (
 <div
 className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
 onClick={(e) => e.target === e.currentTarget && handleClose()}
 >
 <div className="relative w-full max-w-sm h-auto bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-col">
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
 <h2 className="font-semibold text-ink-deep">Create Story</h2>
 <button
 onClick={handleClose}
 className="rounded-full p-1.5 hover:bg-muted transition-colors"
 aria-label="Close"
 >
 <X className="h-5 w-5 text-muted-foreground" />
 </button>
 </div>

 {/* Mode tabs */}
 <div className="flex border-b border-hairline">
 <button
 onClick={() => { setMode("text"); setError("") }}
 className={cn(
"flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
 mode ==="text"
 ?"text-primary border-b-2 border-blue-600"
 :"text-muted-foreground hover:text-ink-deep"
 )}
 >
 <Type className="h-4 w-4" /> Text
 </button>
 <button
 onClick={() => { setMode("image"); setError("") }}
 className={cn(
"flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
 mode ==="image"
 ?"text-primary border-b-2 border-blue-600"
 :"text-muted-foreground hover:text-ink-deep"
 )}
 >
 <ImageIcon className="h-4 w-4" /> Image
 </button>
 <button
 onClick={() => { setMode("video"); setError("") }}
 className={cn(
"flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
 mode ==="video"
 ?"text-primary border-b-2 border-blue-600"
 :"text-muted-foreground hover:text-ink-deep"
 )}
 >
 <VideoIcon className="h-4 w-4" /> Video
 </button>
 </div>

 {/* Content */}
 <div className="flex flex-col gap-4 p-4 flex-1">
 {mode ==="text" ? (
 <>
 <div
 className="relative mx-auto w-40 h-64 rounded-2xl overflow-hidden flex items-center justify-center shadow-md transition-colors"
 style={{ backgroundColor: bgColor }}
 >
 <p
 className="px-3 text-center text-on-primary font-semibold text-base break-words leading-snug"
 style={{ textShadow:"0 1px 3px rgba(0,0,0,0.5)" }}
 >
 {text || <span className="opacity-50">Your story text…</span>}
 </p>
 </div>

 <textarea
 value={text}
 onChange={(e) => setText(e.target.value)}
 placeholder="Write something…"
 maxLength={500}
 rows={3}
 className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
 />
 <div className="text-right text-xs text-muted-foreground">{text.length}/500</div>

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
 >
 {color === bgColor && (
 <Check className="absolute inset-0 m-auto h-4 w-4 text-on-primary drop-shadow" />
 )}
 </button>
 ))}
 </div>
 </div>
 </>
 ) : (
 <>
 <input
 ref={fileInputRef}
 type="file"
 className="hidden"
 accept={mode ==="image" ?"image/jpeg,image/png,image/gif,image/webp" :"video/mp4,video/webm,video/ogg"}
 onChange={handleFileSelect}
 />

 {mediaPreview ? (
 <div className="relative mx-auto w-40 h-64 rounded-2xl overflow-hidden shadow-md bg-black">
 {mode ==="image" ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={mediaPreview} alt="Preview" className="h-full w-full object-cover" />
 ) : (
 <video src={mediaPreview} className="h-full w-full object-cover" controls playsInline />
 )}
 <button
 onClick={() => {
 setMediaFile(null)
 if (mediaPreview) URL.revokeObjectURL(mediaPreview)
 setMediaPreview(null)
 }}
 className="absolute top-2 right-2 z-10 rounded-full bg-black/60 p-1 text-on-primary hover:bg-black/80"
 >
 <X className="h-3.5 w-3.5" />
 </button>
 </div>
 ) : (
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="mx-auto flex h-64 w-40 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-hairline bg-muted/50 hover:bg-muted transition-colors"
 >
 {mode ==="image" ? <ImageIcon className="h-10 w-10 text-muted-foreground" /> : <VideoIcon className="h-10 w-10 text-muted-foreground" />}
 <span className="text-sm text-muted-foreground">Select {mode}</span>
 </button>
 )}
 </>
 )}

 {error && <p className="text-sm text-critical text-center">{error}</p>}
 </div>

 {/* Footer */}
 <div className="px-4 pb-4">
 <button
 onClick={handleSubmit}
 disabled={isSubmitting}
 className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
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
