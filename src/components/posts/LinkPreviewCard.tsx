"use client"

import Image from "next/image"
import { ExternalLink, Globe } from "lucide-react"

interface LinkPreviewCardProps {
  url: string
  title?: string
  description?: string
  image?: string
  favicon?: string
}

export function LinkPreviewCard({
  url,
  title,
  description,
  image,
  favicon,
}: LinkPreviewCardProps) {
  let hostname = url
  try {
    hostname = new URL(url).hostname
  } catch {
    // use raw url
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex overflow-hidden rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors group"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Thumbnail */}
      {image && (
        <div className="relative w-24 shrink-0 sm:w-36 bg-muted">
          <Image
            src={image}
            alt={title || "Link preview"}
            fill
            className="object-cover"
            sizes="144px"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col justify-center gap-1 px-4 py-3 min-w-0">
        {/* Hostname row */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt=""
              className="h-3.5 w-3.5 rounded-sm object-contain"
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = "none"
                const sibling = target.nextElementSibling as HTMLElement | null
                if (sibling) sibling.style.display = "inline"
              }}
            />
          ) : null}
          <Globe
            className="h-3.5 w-3.5"
            style={{ display: favicon ? "none" : "inline" }}
          />
          <span className="truncate">{hostname}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Title */}
        {title && (
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
            {title}
          </p>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </a>
  )
}
