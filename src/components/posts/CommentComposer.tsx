"use client"

import { useState, useRef, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"
import { parseMentions } from "../../../lib/mention-utils"
import { parseHashtags } from "../../../lib/hashtag-utils"
import { MentionAutocomplete } from "./MentionAutocomplete"

interface CommentComposerProps {
  postId: Id<"posts">
  onCommentAdded?: () => void
}

export function CommentComposer({ postId, onCommentAdded }: CommentComposerProps) {
  const createComment = useMutation(api.comments.createComment)

  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false)
  const [mentionAutocompleteQuery, setMentionAutocompleteQuery] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const maxLength = 1000

  // Detect mention being typed
  useEffect(() => {
    if (!textareaRef.current) return

    const position = textareaRef.current.selectionStart
    const textBeforeCursor = content.substring(0, position)
    
    // Check for @ mention
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      
      // Check if we're still typing the mention (no spaces)
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionAutocompleteQuery(textAfterAt)
        setShowMentionAutocomplete(true)
        return
      }
    }
    
    setShowMentionAutocomplete(false)
  }, [content, cursorPosition])

  // Insert selected mention
  const insertMention = (username: string) => {
    if (!textareaRef.current) return

    const position = textareaRef.current.selectionStart
    const textBeforeCursor = content.substring(0, position)
    const textAfterCursor = content.substring(position)
    
    // Find the last @ before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    
    if (lastAtIndex !== -1) {
      const newContent = 
        content.substring(0, lastAtIndex) + 
        `@${username} ` + 
        textAfterCursor
      
      setContent(newContent)
      setShowMentionAutocomplete(false)
      
      // Set cursor position after inserted mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = lastAtIndex + username.length + 2 // +2 for @ and space
          textareaRef.current.selectionStart = newPosition
          textareaRef.current.selectionEnd = newPosition
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setCursorPosition(e.target.selectionStart)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Client-side validation
    if (!content || content.trim().length === 0) {
      setError("Comment cannot be empty")
      return
    }

    if (content.length > maxLength) {
      setError(`Comment must not exceed ${maxLength} characters`)
      return
    }

    setIsSubmitting(true)

    try {
      await createComment({ postId, content })
      
      // Clear input after successful comment
      setContent("")
      
      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <label htmlFor={`comment-${postId}`} className="sr-only">
          Add a comment
        </label>
        {/* Highlight overlay */}
        <div
          className="absolute inset-0 pointer-events-none px-3 py-2 text-sm whitespace-pre-wrap break-words overflow-hidden"
          aria-hidden="true"
        >
          {(() => {
            // First parse hashtags, then parse mentions within text segments
            const hashtagSegments = parseHashtags(content)
            const segments: { type: string; content: string }[] = []
            for (const seg of hashtagSegments) {
              if (seg.type === "hashtag") {
                segments.push({ type: "hashtag", content: seg.content })
              } else {
                const mentionSegs = parseMentions(seg.content)
                for (const ms of mentionSegs) {
                  segments.push({ type: ms.type, content: ms.content })
                }
              }
            }
            return segments.map((seg, i) => {
              if (seg.type === "hashtag") {
                return (
                  <span key={i} className="text-blue-600 dark:text-blue-400">
                    {seg.content}
                  </span>
                )
              }
              if (seg.type === "mention") {
                return (
                  <span key={i} className="text-blue-600 dark:text-blue-400">
                    @{seg.content}
                  </span>
                )
              }
              return <span key={i} className="text-transparent">{seg.content}</span>
            })
          })()}
        </div>
        <textarea
          ref={textareaRef}
          id={`comment-${postId}`}
          value={content}
          onChange={handleContentChange}
          onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
          onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
          rows={2}
          maxLength={maxLength}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-transparent caret-gray-900 dark:caret-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 relative z-10"
          style={{ caretColor: "inherit" }}
          placeholder="Write a comment..."
        />
        
        {/* Mention autocomplete dropdown */}
        {showMentionAutocomplete && (
          <MentionAutocomplete
            query={mentionAutocompleteQuery}
            onSelect={insertMention}
            onClose={() => setShowMentionAutocomplete(false)}
            position={{ top: 80, left: 16 }}
          />
        )}
        
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-red-600 dark:text-red-400">{error}</span>
          <span className={`${content.length > maxLength ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
            {content.length}/{maxLength}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || content.trim().length === 0}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <ButtonLoadingSpinner />}
          {isSubmitting ? "Posting..." : "Comment"}
        </button>
      </div>
    </form>
  )
}
