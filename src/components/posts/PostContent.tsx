"use client"

import { Suspense, lazy } from "react"
import Link from "next/link"
import { parseHashtags } from "../../../lib/hashtag-utils"
import { parseMentions } from "../../../lib/mention-utils"

// Lazy-load heavy renderers
const CodeBlock = lazy(() =>
  import("./CodeBlock").then((m) => ({ default: m.CodeBlock }))
)
const LaTeXRenderer = lazy(() =>
  import("./LaTeXRenderer").then((m) => ({ default: m.LaTeXRenderer }))
)

interface PostContentProps {
  content: string
  className?: string
}

// ─── Segment types ─────────────────────────────────────────────────────────

type Segment =
  | { kind: "code"; lang: string; code: string }
  | { kind: "latex-block"; latex: string }
  | { kind: "text"; text: string }

/**
 * Split raw post content into typed segments for rendering.
 * Handles:
 *  - Fenced code blocks: ```lang\n...\n```
 *  - Block LaTeX: $$...$$
 *  - Everything else: plain text (hashtags / mentions rendered inside)
 */
function parseContentSegments(content: string): Segment[] {
  const segments: Segment[] = []
  // Match fenced code blocks or block LaTeX
  const pattern = /```(\w*)\n?([\s\S]*?)```|\$\$([\s\S]*?)\$\$/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      segments.push({ kind: "text", text: content.slice(lastIndex, match.index) })
    }

    if (match[0].startsWith("```")) {
      // Code block
      segments.push({
        kind: "code",
        lang: match[1] || "text",
        code: match[2] ?? "",
      })
    } else {
      // Block LaTeX $$...$$
      segments.push({ kind: "latex-block", latex: match[3] ?? "" })
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < content.length) {
    segments.push({ kind: "text", text: content.slice(lastIndex) })
  }

  return segments
}

// ─── Inline text renderer (hashtags + mentions + inline LaTeX) ──────────────

function renderInlineText(text: string, keyPrefix: string) {
  // First split by inline LaTeX $...$  (not $$)
  const parts = text.split(/(\$(?!\$)[^$\n]+\$)/g)
  return parts.map((part, pi) => {
    if (part.startsWith("$") && part.endsWith("$") && !part.startsWith("$$")) {
      const latex = part.slice(1, -1)
      return (
        <Suspense key={`${keyPrefix}-il-${pi}`} fallback={<span>{part}</span>}>
          <LaTeXRenderer latex={latex} displayMode={false} />
        </Suspense>
      )
    }
    // regular hashtag + mention parsing
    const hashtagSegments = parseHashtags(part)
    return hashtagSegments.map((hashtagSegment, hashIndex) => {
      if (hashtagSegment.type === "hashtag" && hashtagSegment.tag) {
        return (
          <Link
            key={`${keyPrefix}-il-${pi}-h${hashIndex}`}
            href={`/hashtag/${hashtagSegment.tag}`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {hashtagSegment.content}
          </Link>
        )
      }
      const mentionSegments = parseMentions(hashtagSegment.content)
      return mentionSegments.map((mentionSegment, mentionIndex) => {
        if (mentionSegment.type === "mention") {
          return (
            <Link
              key={`${keyPrefix}-il-${pi}-h${hashIndex}-m${mentionIndex}`}
              href={`/profile/${mentionSegment.content}`}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              @{mentionSegment.content}
            </Link>
          )
        }
        return (
          <span key={`${keyPrefix}-il-${pi}-h${hashIndex}-m${mentionIndex}`}>
            {mentionSegment.content}
          </span>
        )
      })
    })
  })
}

// ─── Main component ─────────────────────────────────────────────────────────

/**
 * Renders post content with:
 *  - Fenced code blocks (syntax highlighted via Prism)
 *  - Block / inline LaTeX (rendered via KaTeX)
 *  - Hashtag and @mention links
 */
export function PostContent({ content, className = "" }: PostContentProps) {
  const segments = parseContentSegments(content)

  return (
    <div className={`${className}`}>
      {segments.map((seg, i) => {
        if (seg.kind === "code") {
          return (
            <Suspense key={i} fallback={<pre className="rounded-xl bg-muted p-4 text-sm overflow-x-auto">{seg.code}</pre>}>
              <CodeBlock code={seg.code} language={seg.lang} />
            </Suspense>
          )
        }

        if (seg.kind === "latex-block") {
          return (
            <Suspense key={i} fallback={<p className="text-center my-3">{`$$${seg.latex}$$`}</p>}>
              <LaTeXRenderer key={i} latex={seg.latex} displayMode={true} />
            </Suspense>
          )
        }

        // Plain text segment — render inline
        return (
          <p key={i} className="whitespace-pre-wrap">
            {renderInlineText(seg.text, String(i))}
          </p>
        )
      })}
    </div>
  )
}
