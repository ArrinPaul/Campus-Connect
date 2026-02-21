"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { createLogger } from "@/lib/logger"
import { toast } from "sonner"

const log = createLogger("BookmarkButton")
import { Bookmark, BookmarkCheck, FolderPlus } from "lucide-react"

interface BookmarkButtonProps {
  postId: Id<"posts">
  compact?: boolean
  onBookmarked?: () => void
}

export function BookmarkButton({
  postId,
  compact = false,
  onBookmarked,
}: BookmarkButtonProps) {
  const [showCollectionMenu, setShowCollectionMenu] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")

  const addBookmark = useMutation(api.bookmarks.addBookmark)
  const removeBookmark = useMutation(api.bookmarks.removeBookmark)
  const isBookmarked = useQuery(api.bookmarks.isBookmarked, { postId })
  const bookmarkDetails = useQuery(api.bookmarks.getBookmarkDetails, { postId })
  const collections = useQuery(api.bookmarks.getCollections)

  const handleToggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await removeBookmark({ postId })
        toast.success("Bookmark removed")
      } else {
        await addBookmark({ postId, collectionName: "Saved" })
        toast.success("Post bookmarked")
        onBookmarked?.()
      }
    } catch (error) {
      log.error("Failed to toggle bookmark", error)
      toast.error("Failed to update bookmark")
    }
  }

  const handleAddToCollection = async (collectionName: string) => {
    try {
      await addBookmark({ postId, collectionName })
      setShowCollectionMenu(false)
      toast.success(`Added to "${collectionName}"`)
      onBookmarked?.()
    } catch (error) {
      log.error("Failed to add to collection", error)
      toast.error("Failed to add to collection")
    }
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return
    await handleAddToCollection(newCollectionName.trim())
    setNewCollectionName("")
  }

  return (
    <div className="relative inline-block">
      <DropdownMenu open={showCollectionMenu} onOpenChange={setShowCollectionMenu}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleToggleBookmark}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:bg-accent ${
                    isBookmarked
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  } ${compact ? "px-2 py-1 text-sm" : ""}`}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-5 w-5" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </button>

                {/* Collection Menu Trigger */}
                {isBookmarked && (
                  <DropdownMenuTrigger asChild>
                    <button
                      className="px-2 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowCollectionMenu(true)
                      }}
                    >
                      {bookmarkDetails?.collectionName || "Saved"}
                    </button>
                  </DropdownMenuTrigger>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isBookmarked
                ? `Saved to ${bookmarkDetails?.collectionName || "Saved"}`
                : "Save post"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Move to collection</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Default collection */}
          <DropdownMenuItem
            onClick={() => handleAddToCollection("Saved")}
            className="cursor-pointer"
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Saved
            {bookmarkDetails?.collectionName === "Saved" && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>

          {/* Existing collections */}
          {collections
            ?.filter((c) => c.name !== "Saved")
            .map((collection) => (
              <DropdownMenuItem
                key={collection.name}
                onClick={() => handleAddToCollection(collection.name)}
                className="cursor-pointer"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                {collection.name}
                <span className="ml-auto text-xs text-muted-foreground">
                  {collection.count}
                </span>
                {bookmarkDetails?.collectionName === collection.name && (
                  <span className="ml-2 text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}

          <DropdownMenuSeparator />

          {/* Create new collection */}
          <div className="px-2 py-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New collection..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateCollection()
                  }
                }}
                className="flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className="px-2 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
