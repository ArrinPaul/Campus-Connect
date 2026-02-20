"use client"

import { MarkdownRenderer } from "@/components/editor/MarkdownRenderer"

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
