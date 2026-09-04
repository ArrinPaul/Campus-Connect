"use client"

import { useState, useRef, useEffect } from "react"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { FileText, Download, X, ChevronLeft, ChevronRight, ZoomIn, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export interface MediaGalleryProps {
  mediaUrls: string[]
  mediaType: "image" | "video" | "file"
  mediaFileNames?: string[]
  altPrefix?: string
  onDoubleTapLike?: () => void
}

export function MediaGallery({
  mediaUrls,
  mediaType,
  mediaFileNames,
  altPrefix = "Post media",
  onDoubleTapLike,
}: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showHeartBurst, setShowHeartBurst] = useState(false)
  const [heartCoords, setHeartCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 })
  const lastTapRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  if (!mediaUrls || mediaUrls.length === 0) return null

  if (mediaType === "file") {
    return (
      <div className="mt-3 flex flex-col gap-2">
        {mediaUrls.map((url, i) => {
          const name = mediaFileNames?.[i] || `File ${i + 1}`
          return (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted transition-colors group"
            >
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate text-sm font-medium text-foreground">
                {name}
              </span>
              <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          )
        })}
      </div>
    )
  }

  if (mediaType === "video") {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden bg-black aspect-video relative">
        <video
          src={mediaUrls[0]}
          controls
          className="w-full h-full object-contain"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  // Handle double-tap to like with heart burst
  const handleMediaDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setHeartCoords({ x, y })
    setShowHeartBurst(true)
    onDoubleTapLike?.()
    setTimeout(() => setShowHeartBurst(false), 900)
  }

  // Image grid
  const count = mediaUrls.length
  const gridClass = cn(
    "mt-2.5 grid gap-1 rounded-2xl overflow-hidden relative",
    count === 1 && "grid-cols-1",
    count === 2 && "grid-cols-2",
    count === 3 && "grid-cols-2",
    count >= 4 && "grid-cols-2"
  )

  return (
    <>
      <div className={gridClass}>
        {mediaUrls.slice(0, 4).map((url, i) => {
          const isThirdOfThree = count === 3 && i === 0
          const isOverlayCell = count > 4 && i === 3
          const remainingCount = count - 4

          return (
            <button
              key={url}
              type="button"
              onClick={() => setLightboxIndex(i)}
              onDoubleClick={handleMediaDoubleClick}
              className={cn(
                "relative overflow-hidden bg-muted cursor-pointer select-none focus:outline-none",
                isThirdOfThree && "col-span-2 row-span-1",
                count === 1 ? "aspect-video" : "aspect-square"
              )}
              aria-label={`View ${altPrefix} ${i + 1}`}
            >
              <OptimizedImage
                src={url}
                alt={mediaFileNames?.[i] || `${altPrefix} ${i + 1}`}
                fill
                className="object-cover hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 600px"
              />
              {isOverlayCell && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{remainingCount}</span>
                </div>
              )}
            </button>
          )
        })}

        {/* Double-tap animated heart burst */}
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.9] }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: `${heartCoords.x}%`,
                top: `${heartCoords.y}%`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 30,
              }}
            >
              <Heart className="h-20 w-20 fill-[#ED4956] text-[#ED4956] drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={mediaUrls}
          fileNames={mediaFileNames}
          initialIndex={lightboxIndex}
          altPrefix={altPrefix}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}

// ─── ImageLightbox ──────────────────────────────────────────────────────────

interface ImageLightboxProps {
  images: string[]
  fileNames?: string[]
  initialIndex: number
  altPrefix: string
  onClose: () => void
}

export function ImageLightbox({
  images,
  fileNames,
  initialIndex,
  altPrefix,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Move focus into the dialog on open so Escape/arrow keys work
  // immediately, without requiring an extra click first — the trigger
  // button that opened this stays focused otherwise, since it's now
  // hidden behind the backdrop.
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  const goToPrev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length)
  const goToNext = () => setCurrentIndex((i) => (i + 1) % images.length)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrev()
    else if (e.key === "ArrowRight") goToNext()
    else if (e.key === "Escape") onClose()
  }

  const currentUrl = images[currentIndex]
  const currentName = fileNames?.[currentIndex] || `${altPrefix} ${currentIndex + 1}`

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md outline-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors"
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Zoom toggle */}
      <button
        onClick={() => setZoomed((z) => !z)}
        className="absolute top-4 right-16 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors"
        aria-label={zoomed ? "Zoom out" : "Zoom in"}
      >
        <ZoomIn className="h-5 w-5" />
      </button>

      {/* Navigation - Previous */}
      {images.length > 1 && (
        <button
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <div
        className={cn(
          "relative transition-all duration-300 select-none",
          zoomed
            ? "cursor-zoom-out max-w-none max-h-none w-auto h-auto overflow-auto"
            : "cursor-zoom-in max-w-[90vw] max-h-[85vh] w-full h-full"
        )}
        onClick={() => setZoomed((z) => !z)}
      >
        {zoomed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt={currentName}
            className="max-w-none"
            style={{ maxWidth: "200vw", maxHeight: "200vh" }}
          />
        ) : (
          <div className="relative w-full h-full min-h-[200px] min-w-[200px]">
            <OptimizedImage
              src={currentUrl}
              alt={currentName}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>
        )}
      </div>

      {/* Navigation - Next */}
      {images.length > 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Counter + filename */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
        {images.length > 1 && (
          <div className="flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === currentIndex ? "w-5 bg-white" : "w-1.5 bg-white/40"
                )}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
        <span className="text-white/70 text-xs font-medium px-2">{currentName}</span>
      </div>
    </div>
  )
}
