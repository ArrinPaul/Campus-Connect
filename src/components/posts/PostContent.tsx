"use client"

import Link from "next/link"
import { parseHashtags } from "../../../lib/hashtag-utils"

interface PostContentProps {
  content: string
  className?: string
}

/**
 * Component to render post content with clickable hashtags
 */
export function PostContent({ content, className = "" }: PostContentProps) {
  const segments = parseHashtags(content)

  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === "hashtag" && segment.tag) {
          return (
            <Link
              key={index}
              href={`/hashtag/${segment.tag}`}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
              onClick={(e) => {
                // Prevent click from bubbling to parent elements
                e.stopPropagation()
              }}
            >
              {segment.content}
            </Link>
          )
        }
        return <span key={index}>{segment.content}</span>
      })}
    </p>
  )
}
