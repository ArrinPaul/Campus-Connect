"use client"

import Link from "next/link"
import { parseHashtags } from "../../../lib/hashtag-utils"
import { parseMentions } from "../../../lib/mention-utils"

interface PostContentProps {
  content: string
  className?: string
}

/**
 * Component to render post content with clickable hashtags and mentions
 */
export function PostContent({ content, className = "" }: PostContentProps) {
  const hashtagSegments = parseHashtags(content)

  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {hashtagSegments.map((hashtagSegment, hashIndex) => {
        if (hashtagSegment.type === "hashtag" && hashtagSegment.tag) {
          return (
            <Link
              key={hashIndex}
              href={`/hashtag/${hashtagSegment.tag}`}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
              onClick={(e) => {
                // Prevent click from bubbling to parent elements
                e.stopPropagation()
              }}
            >
              {hashtagSegment.content}
            </Link>
          )
        }
        
        // For text segments, parse and render mentions
        const mentionSegments = parseMentions(hashtagSegment.content)
        return mentionSegments.map((mentionSegment, mentionIndex) => {
          if (mentionSegment.type === "mention") {
            return (
              <Link
                key={`${hashIndex}-${mentionIndex}`}
                href={`/profile/${mentionSegment.content}`}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
                onClick={(e) => {
                  // Prevent click from bubbling to parent elements
                  e.stopPropagation()
                }}
              >
                @{mentionSegment.content}
              </Link>
            )
          }
          return <span key={`${hashIndex}-${mentionIndex}`}>{mentionSegment.content}</span>
        })
      })}
    </p>
  )
}
