"use client"

import dynamic from "next/dynamic"

// Lazy load the markdown renderer (~200KB: react-markdown + remark + rehype + katex)
const MarkdownRenderer = dynamic(
  () =>
    import("@/components/editor/MarkdownRenderer").then(
      (m) => m.MarkdownRenderer
    ),
  {
    loading: () => (
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
      </div>
    ),
    ssr: false,
  }
)

interface PostContentProps {
  content: string
  className?: string
}

/**
 * Renders post content using the full MarkdownRenderer pipeline:
 *  - GFM (tables, strikethrough, task lists, auto-links)
 *  - Fenced code blocks with syntax highlighting (highlight.js)
 *  - Block and inline LaTeX (KaTeX)
 *  - YouTube / Vimeo auto-embed
 */
export function PostContent({ content, className = "" }: PostContentProps) {
  return (
    <MarkdownRenderer
      content={content}
      compact
      className={className}
    />
  )
}
