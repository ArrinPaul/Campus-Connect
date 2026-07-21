"use client"

import { useState } from"react"
import { useMutation, useQuery } from"@/lib/api"
import { api } from"@/lib/api"
import { Id } from"@/lib/api"
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from"@/components/ui/tooltip"
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
 DropdownMenuLabel,
} from"@/components/ui/dropdown-menu"
import { createLogger } from"@/lib/logger"
import { toast } from"sonner"

const log = createLogger("BookmarkButton")
import { motion } from"framer-motion"
import { Bookmark, BookmarkCheck, FolderPlus } from"lucide-react"

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
  const isBookmarkedQuery = useQuery(api.bookmarks.isBookmarked, postId ? { postId } : "skip")
  const rawBookmarked =
    typeof isBookmarkedQuery === "object" && isBookmarkedQuery !== null
      ? (isBookmarkedQuery as any).isBookmarked
      : isBookmarkedQuery
  const isBookmarked = Boolean(rawBookmarked)

  const bookmarkDetails = useQuery(api.bookmarks.getBookmarks, postId ? { postId } : "skip")
 const collections = useQuery(api.bookmarks.getBookmarkCollections)

 const handleToggleBookmark = async () => {
 try {
 if (isBookmarked) {
 await removeBookmark({ postId })
 toast.success("Bookmark removed")
 } else {
 await addBookmark({ postId, collectionName:"Saved" })
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
 toast.success(`Added to"${collectionName}"`)
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
 <motion.button
 whileTap={{ scale: 0.85 }}
 whileHover={{ scale: 1.05 }}
 onClick={handleToggleBookmark}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:bg-canvas ${
 isBookmarked
 ?"text-primary"
 :"text-slate hover:text-primary"
 } ${compact ?"px-2 py-1 text-sm" :""}`}
 aria-label={isBookmarked ?"Remove bookmark" :"Bookmark post"}
 >
 {isBookmarked ? (
 <BookmarkCheck className="h-[18px] w-[18px]" />
 ) : (
 <Bookmark className="h-[18px] w-[18px]" />
 )}
 </motion.button>

 {/* Collection Menu Trigger */}
 {isBookmarked && (
 <DropdownMenuTrigger asChild>
 <button
 className="px-2 py-1.5 rounded-full text-xs text-slate hover:text-ink-deep hover:bg-canvas transition-colors"
 onClick={(e) => {
 e.stopPropagation()
 setShowCollectionMenu(true)
 }}
 >
 {bookmarkDetails?.collectionName ||"Saved"}
 </button>
 </DropdownMenuTrigger>
 )}
 </div>
 </TooltipTrigger>
 <TooltipContent>
 {isBookmarked
 ? `Saved to ${bookmarkDetails?.collectionName ||"Saved"}`
 :"Save post"}
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
 {bookmarkDetails?.collectionName ==="Saved" && (
 <span className="ml-auto text-primary">✓</span>
 )}
 </DropdownMenuItem>

 {/* Existing collections */}
 {collections
 ?.filter((c: any) => c && c.name !=="Saved")
 .map((collection: any, idx: number) => (
 <DropdownMenuItem
 key={String(collection._id || collection.id || collection.name || `col-${idx}`)}
 onClick={() => handleAddToCollection(collection.name)}
 className="cursor-pointer"
 >
 <Bookmark className="h-4 w-4 mr-2" />
 {collection.name}
 <span className="ml-auto text-xs text-slate">
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
 if (e.key ==="Enter") {
 handleCreateCollection()
 }
 }}
 className="flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
 onClick={(e) => e.stopPropagation()}
 />
 <button
 onClick={handleCreateCollection}
 disabled={!newCollectionName.trim()}
 className="px-2 py-1 text-sm bg-primary text-on-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
 aria-label="Create collection"
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
