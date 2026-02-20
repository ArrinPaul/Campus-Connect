"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import { useMemo } from "react"
import type { Components } from "react-markdown"

// Import KaTeX CSS (must be registered in the app layout for SSR)
// highlight.js theme is imported globally in globals.css

interface MarkdownRendererProps {
  content: string
  /** Apply compact prose styles (for feed cards) */
  compact?: boolean
  /** Additional className on the wrapper */
  className?: string
}

// ── YouTube / Vimeo auto-embed ────────────────────────────────────────────────

const YOUTUBE_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/
const VIMEO_RE =
  /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/

function VideoEmbed({ url }: { url: string }) {
  const yt = YOUTUBE_RE.exec(url)
  if (yt) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg my-3">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${yt[1]}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          title="YouTube video"
          loading="lazy"
        />
      </div>
    )
  }
  const vm = VIMEO_RE.exec(url)
  if (vm) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg my-3">
        <iframe
          src={`https://player.vimeo.com/video/${vm[1]}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          title="Vimeo video"
          loading="lazy"
        />
      </div>
    )
  }
  return null
}

// ── Custom renderers ──────────────────────────────────────────────────────────

const COMPONENTS: Components = {
  // Auto-link: detect bare YouTube/Vimeo URLs in paragraphs and embed them
  p({ children, ...props }) {
    // Check if the paragraph contains exactly one child that is a bare URL video link
    const childArr = Array.isArray(children) ? children : [children]
    if (childArr.length === 1) {
      const child = childArr[0]
      if (typeof child === "string") {
        const embed = <VideoEmbed url={child} />
        // Only substitute if truly a video URL
        if (YOUTUBE_RE.test(child) || VIMEO_RE.test(child)) return embed
      }
      // Check for anchor element whose text equals its href (bare link pasted)
      if (
        child != null &&
        typeof child === "object" &&
        "type" in child
      ) {
        const el = child as React.ReactElement<{ href?: string; children?: React.ReactNode }>
        if (el.type === "a" && el.props?.href) {
          const href = el.props.href
          const embed = <VideoEmbed url={href} />
          if (YOUTUBE_RE.test(href) || VIMEO_RE.test(href)) return embed
        }
      }
    }
    return <p {...props}>{children}</p>
  },

  // Links — open external links in new tab
  a({ href, children, ...props }) {
    const isExternal = href?.startsWith("http")
    return (
      <a
        href={href}
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className="text-blue-600 dark:text-blue-400 hover:underline break-words"
        {...props}
      >
        {children}
      </a>
    )
  },

  // Code blocks — already highlighted by rehype-highlight
  pre({ children, ...props }) {
    return (
      <pre
        className="my-3 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100"
        {...props}
      >
        {children}
      </pre>
    )
  },

  // Inline code
  code({ children, className, ...props }) {
    const isBlock = className?.startsWith("language-")
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 text-sm font-mono text-rose-600 dark:text-rose-400"
        {...props}
      >
        {children}
      </code>
    )
  },

  // Blockquote
  blockquote({ children, ...props }) {
    return (
      <blockquote
        className="my-3 border-l-4 border-blue-400 dark:border-blue-600 pl-4 italic text-gray-600 dark:text-gray-400"
        {...props}
      >
        {children}
      </blockquote>
    )
  },

  // Tables (GFM)
  table({ children, ...props }) {
    return (
      <div className="my-3 overflow-x-auto">
        <table
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          {...props}
        >
          {children}
        </table>
      </div>
    )
  },
  th({ children, ...props }) {
    return (
      <th
        className="bg-gray-50 dark:bg-gray-800 px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide"
        {...props}
      >
        {children}
      </th>
    )
  },
  td({ children, ...props }) {
    return (
      <td
        className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 text-gray-800 dark:text-gray-200"
        {...props}
      >
        {children}
      </td>
    )
  },

  // Horizontal rule
  hr(props) {
    return (
      <hr
        className="my-4 border-gray-200 dark:border-gray-700"
        {...props}
      />
    )
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MarkdownRenderer({
  content,
  compact = false,
  className = "",
}: MarkdownRendererProps) {
  // Memoise to avoid re-parsing on every parent render
  const processed = useMemo(() => content ?? "", [content])

  const proseClass = compact
    ? "prose prose-sm dark:prose-invert max-w-none leading-relaxed"
    : "prose prose-sm sm:prose-base dark:prose-invert max-w-none leading-relaxed"

  return (
    <div className={`${proseClass} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [rehypeKatex, { output: "html", throwOnError: false }],
          [rehypeHighlight, { ignoreMissing: true }],
          rehypeRaw,
        ]}
        components={COMPONENTS}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
