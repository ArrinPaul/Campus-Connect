"use client"

import { useState, useRef, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"
import { parseHashtags } from "../../../lib/hashtag-utils"

interface PostComposerProps {
  onPostCreated?: () => void
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const createPost = useMutation(api.posts.createPost)

  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteQuery, setAutocompleteQuery] = useState("")
  const [selectedHashtagIndex, setSelectedHashtagIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const maxLength = 5000

  // Get hashtag suggestions
  const hashtagSuggestions = useQuery(
    api.hashtags.searchHashtags,
    showAutocomplete && autocompleteQuery.length > 0
      ? { query: autocompleteQuery, limit: 5 }
      : "skip"
  )

  // Detect hashtag being typed
  useEffect(() => {
    if (!textareaRef.current) return

    const position = textareaRef.current.selectionStart
    const textBeforeCursor = content.substring(0, position)
    
    // Find the last # before cursor
    const lastHashIndex = textBeforeCursor.lastIndexOf("#")
    
    if (lastHashIndex !== -1) {
      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1)
      
      // Check if we're still typing the hashtag (no spaces)
      if (!textAfterHash.includes(" ") && !textAfterHash.includes("\n")) {
        setAutocompleteQuery(textAfterHash)
        setShowAutocomplete(true)
        setSelectedHashtagIndex(0)
        return
      }
    }
    
    setShowAutocomplete(false)
  }, [content, cursorPosition])

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showAutocomplete || !hashtagSuggestions || hashtagSuggestions.length === 0) {
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedHashtagIndex((prev) => 
        prev < hashtagSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedHashtagIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === "Enter" && showAutocomplete) {
      e.preventDefault()
      insertHashtag(hashtagSuggestions[selectedHashtagIndex].tag)
    } else if (e.key === "Escape") {
      setShowAutocomplete(false)
    }
  }

  // Insert selected hashtag
  const insertHashtag = (tag: string) => {
    if (!textareaRef.current) return

    const position = textareaRef.current.selectionStart
    const textBeforeCursor = content.substring(0, position)
    const textAfterCursor = content.substring(position)
    
    // Find the last # before cursor
    const lastHashIndex = textBeforeCursor.lastIndexOf("#")
    
    if (lastHashIndex !== -1) {
      const newContent = 
        content.substring(0, lastHashIndex) + 
        `#${tag} ` + 
        textAfterCursor
      
      setContent(newContent)
      setShowAutocomplete(false)
      
      // Set cursor position after inserted hashtag
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = lastHashIndex + tag.length + 2 // +2 for # and space
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
      setError("Post content cannot be empty")
      return
    }

    if (content.length > maxLength) {
      setError(`Post content must not exceed ${maxLength} characters`)
      return
    }

    setIsSubmitting(true)

    try {
      await createPost({ content })
      
      // Clear form after successful post
      setContent("")
      
      if (onPostCreated) {
        onPostCreated()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="relative">
        <label htmlFor="postContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What&apos;s on your mind?
        </label>
        
        {/* Syntax-highlighted overlay */}
        <div className="relative mt-1">
          {/* Hidden div for syntax highlighting */}
          <div
            className="absolute inset-0 rounded-md border border-transparent px-3 py-2 text-gray-900 dark:text-gray-100 pointer-events-none whitespace-pre-wrap break-words overflow-hidden"
            style={{
              fontFamily: "inherit",
              fontSize: "inherit",
              lineHeight: "inherit",
            }}
            aria-hidden="true"
          >
            {parseHashtags(content).map((segment, index) => {
              if (segment.type === "hashtag") {
                return (
                  <span key={index} className="text-blue-600 dark:text-blue-400 font-medium">
                    {segment.content}
                  </span>
                )
              }
              return <span key={index}>{segment.content}</span>
            })}
            {/* Placeholder when empty */}
            {content.length === 0 && (
              <span className="text-gray-400 dark:text-gray-500">
                Share your thoughts, ideas, or updates...
              </span>
            )}
          </div>

          {/* Actual textarea (transparent text) */}
          <textarea
            ref={textareaRef}
            id="postContent"
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            rows={4}
            maxLength={maxLength}
            className="relative block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 caret-gray-900 dark:caret-gray-100"
            style={{
              color: "transparent",
              caretColor: "currentColor",
            }}
          />
        </div>

        {/* Autocomplete dropdown */}
        {showAutocomplete && hashtagSuggestions && hashtagSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-64 rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
            <ul className="py-1">
              {hashtagSuggestions.map((hashtag, index) => (
                <li
                  key={hashtag._id}
                  className={`px-4 py-2 cursor-pointer transition-colors ${
                    index === selectedHashtagIndex
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => insertHashtag(hashtag.tag)}
                  onMouseEnter={() => setSelectedHashtagIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">#{hashtag.tag}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {hashtag.postCount} {hashtag.postCount === 1 ? "post" : "posts"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">↑</kbd>
              <kbd className="ml-1 px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">↓</kbd> to navigate,
              <kbd className="ml-1 px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">Enter</kbd> to select
            </div>
          </div>
        )}

        <div className="mt-1 flex justify-between text-xs sm:text-sm">
          <span className="text-red-600 dark:text-red-400">{error}</span>
          <span className={`${content.length > maxLength ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
            {content.length}/{maxLength}
          </span>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting || content.trim().length === 0}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:text-base flex items-center justify-center gap-2"
          style={{ minHeight: "44px" }}
        >
          {isSubmitting && <ButtonLoadingSpinner />}
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  )
}
