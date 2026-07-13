"use client"

import { useState, memo, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { useUser } from "@/lib/auth/client"
import { useMutation, useQuery } from "@/lib/api"
import { api } from "@/lib/api"
import { Id } from "@/lib/api"
import { Share2, Copy, Repeat2, MessageCircle, Trash2, MoreHorizontal } from "lucide-react"
import { CommentList } from "@/components/posts/CommentList"
import { CommentComposer } from "@/components/posts/CommentComposer"
import { ReactionPicker, ReactionSummary } from "@/components/posts/ReactionPicker"
import { ReactionModal } from "@/components/posts/ReactionModal"
import { BookmarkButton } from "@/components/posts/BookmarkButton"
import { PostContent } from "@/components/posts/PostContent"
import { RepostModal } from "@/components/posts/RepostModal"
import { MediaGallery } from "@/components/posts/MediaGallery"
import { LinkPreviewCard } from "@/components/posts/LinkPreviewCard"
import { PollCard } from "@/components/posts/PollCard"
import { AvatarWithStatus } from "@/components/ui/OnlineStatusDot"
import { createLogger } from "@/lib/logger"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ReactionCounts } from "@/types"

const log = createLogger("PostCard")

interface User {
  _id: Id<"users">
  name: string
  profilePicture?: string
  role: "Student" | "Research Scholar" | "Faculty"
}

interface Post {
  _id: Id<"posts">
  authorId: Id<"users">
  content: string
  likeCount: number
  commentCount: number
  shareCount: number
  createdAt: number
  updatedAt: number
  reactionCounts?: ReactionCounts
  mediaUrls?: string[]
  mediaType?: "image" | "video" | "file" | "link"
  mediaFileNames?: string[]
  linkPreview?: {
    url: string
    title?: string
    description?: string
    image?: string
    favicon?: string
  }
  pollId?: Id<"polls">
}

interface PostCardProps {
  post: Post
  author: User
}

export const PostCard = memo(function PostCard({ post, author }: PostCardProps) {
  const { isLoaded, isSignedIn } = useUser()
  const deletePost = useMutation(api.posts.deletePost)
  
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && isSignedIn ? {} : "skip"
  )

  const router = useRouter()
  const shareDropdownRef = useRef<HTMLDivElement>(null)
  const createRepost = useMutation(api.reposts.repost)

  const isOwnPost = currentUser?._id === post.authorId

  const [isDeleting, setIsDeleting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showReactionModal, setShowReactionModal] = useState(false)
  const [showShareDropdown, setShowShareDropdown] = useState(false)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [shareSuccess, setShareSuccess] = useState<string | null>(null)
  const [commentSort, setCommentSort] = useState<"old" | "new" | "best" | "controversial">("old")
  const [commentCursor, setCommentCursor] = useState<string | undefined>(undefined)
  const [allComments, setAllComments] = useState<any[]>([])
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false)

  // Only fetch comments when expanded — paginated
  const commentsData = useQuery(
    api.comments.getPostComments,
    showComments ? { postId: post._id, sortBy: commentSort, limit: 20 } : "skip"
  )

  const moreCommentsData = useQuery(
    api.comments.getPostComments,
    showComments && isLoadingMoreComments && commentCursor
      ? { postId: post._id, sortBy: commentSort, limit: 20, cursor: commentCursor }
      : "skip"
  )

  // Initialize comments from first page
  useEffect(() => {
    if (commentsData && !isLoadingMoreComments) {
      setAllComments(commentsData.comments)
      setCommentCursor(commentsData.nextCursor ?? undefined)
    }
  }, [commentsData, isLoadingMoreComments])

  // Append more comments
  useEffect(() => {
    if (moreCommentsData && isLoadingMoreComments) {
      setAllComments((prev) => {
        const existingIds = new Set(prev.map((c: any) => c._id))
        const newComments = moreCommentsData.comments.filter((c: any) => !existingIds.has(c._id))
        return [...prev, ...newComments]
      })
      setCommentCursor(moreCommentsData.nextCursor ?? undefined)
      setIsLoadingMoreComments(false)
    }
  }, [moreCommentsData, isLoadingMoreComments])

  // Reset pagination when sort changes
  useEffect(() => {
    setAllComments([])
    setCommentCursor(undefined)
    setIsLoadingMoreComments(false)
  }, [commentSort])

  const handleLoadMoreComments = () => {
    if (commentCursor && !isLoadingMoreComments) {
      setIsLoadingMoreComments(true)
    }
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMenu])

  const handleDelete = async () => {
    setIsDeleting(true)
    setShowDeleteConfirm(false)
    setShowMenu(false)
    try {
      await deletePost({ postId: post._id })
      toast.success("Post deleted")
    } catch (error) {
      log.error("Failed to delete post", error, { postId: post._id })
      toast.error("Failed to delete post. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const roleConfig: Record<string, { label: string; className: string }> = {
    Student: {
      label: "Student",
      className: "text-ink-muted-48 border-ink-muted-48",
    },
    Faculty: {
      label: "Faculty",
      className: "text-primary border-primary",
    },
    "Research Scholar": {
      label: "Scholar",
      className: "text-primary border-primary",
    },
  }

  // Close share dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
        setShowShareDropdown(false)
      }
    }

    if (showShareDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showShareDropdown])

  const handleDirectRepost = async () => {
    if (isOwnPost) {
      toast.error("You cannot repost your own post")
      return
    }

    try {
      await createRepost({ originalPostId: post._id })
      toast.success("Post reposted!")
      setShowShareDropdown(false)
      setTimeout(() => setShareSuccess(null), 3000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to repost")
    }
  }

  const handleQuotePost = () => {
    if (isOwnPost) {
      alert("You cannot repost your own post")
      return
    }
    setShowShareDropdown(false)
    setShowRepostModal(true)
  }

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/feed#post-${post._id}`
      await navigator.clipboard.writeText(url)
      setShareSuccess("Link copied!")
      setShowShareDropdown(false)
      setTimeout(() => setShareSuccess(null), 3000)
    } catch (err) {
      alert("Failed to copy link")
    }
  }

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${author.name}`,
          text: post.content.substring(0, 100) + (post.content.length > 100 ? "..." : ""),
          url: `${window.location.origin}/feed#post-${post._id}`,
        })
        setShowShareDropdown(false)
      } catch (err) {
        // User cancelled or error occurred
        log.warn("Share via navigator.share failed", { error: String(err) })
      }
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return "just now"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const handlePostClick = (e: React.MouseEvent) => {
    // If clicking on interactive elements, don't navigate
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('.no-nav')) {
      return
    }
    router.push(`/post/${post._id}`)
  }

  const role = roleConfig[author.role] ?? roleConfig.Student

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={handlePostClick}
      className="group/post w-full bg-canvas/70 dark:bg-canvas/40 backdrop-blur-md border-b border-hairline py-lg md:py-xl transition-all hover:bg-canvas-soft/50 cursor-pointer"
    >
      <div className="max-w-2xl mx-auto px-4 md:px-5 flex gap-3 md:gap-4">
        {/* Left Column: Avatar */}
        <div className="shrink-0 mt-1">
          <AvatarWithStatus userId={author._id} size="sm">
            <div className="relative h-10 w-10 flex-shrink-0">
              {author.profilePicture ? (
                <OptimizedImage
                  src={author.profilePicture}
                  alt={author.name}
                  fill
                  isAvatar
                  sizes="40px"
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas-soft text-sm font-semibold text-ink border border-hairline">
                  {author.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </AvatarWithStatus>
        </div>

        {/* Right Column: Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-body-strong text-ink truncate hover:underline cursor-pointer">{author.name}</p>
                <span className={cn(
                  "inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide",
                  role.className
                )}>
                  {role.label}
                </span>
                <span className="text-ink-muted-48">·</span>
                <Link href={`/post/${post._id}`} className="hover:underline">
                  <p className="text-caption text-ink-muted-48">{formatTimestamp(post.createdAt)}</p>
                </Link>
              </div>
            </div>

            {/* Post Menu (own posts) */}
            {isOwnPost && (
              <div className="relative shrink-0 ml-2" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="btn-press rounded-full p-2 text-ink-muted-48 opacity-0 group-hover/post:opacity-100 hover:bg-canvas-soft hover:text-ink transition-all"
                  aria-label="Post options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {/* Delete Confirmation Dropdown */}
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-canvas border border-hairline rounded-md shadow-product overflow-hidden">
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full px-4 py-2.5 text-left text-caption text-destructive hover:bg-destructive/5 flex items-center gap-2.5 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete post</span>
                      </button>
                    ) : (
                      <div className="p-3 space-y-2">
                        <p className="text-[10px] text-ink-muted-48 uppercase font-semibold">Confirm Delete?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 rounded-sm bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
                          >
                            {isDeleting ? "..." : "Delete"}
                          </button>
                          <button
                            onClick={() => { setShowDeleteConfirm(false); setShowMenu(false) }}
                            className="flex-1 rounded-sm bg-canvas-soft px-3 py-1.5 text-xs font-semibold text-ink hover:bg-hairline"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="mt-1">
            <PostContent
              content={post.content}
              className="text-[15px] text-ink leading-relaxed"
            />
          </div>

          {/* Media Gallery */}
          {post.mediaUrls && post.mediaUrls.length > 0 && post.mediaType && post.mediaType !== "link" && (
            <div className="mt-3 rounded-xl overflow-hidden border border-hairline bg-canvas-soft">
              <MediaGallery
                mediaUrls={post.mediaUrls}
                mediaType={post.mediaType as "image" | "video" | "file"}
                mediaFileNames={post.mediaFileNames}
                altPrefix={`${author.name}'s post media`}
              />
            </div>
          )}

          {/* Link Preview */}
          {post.linkPreview && (
            <div className="mt-3 rounded-xl overflow-hidden border border-hairline hover:bg-canvas-soft/50 transition-colors">
              <LinkPreviewCard
                url={post.linkPreview.url}
                title={post.linkPreview.title}
                description={post.linkPreview.description}
                image={post.linkPreview.image}
                favicon={post.linkPreview.favicon}
              />
            </div>
          )}

          {/* Poll */}
          {post.pollId && (
            <div className="mt-3 rounded-xl border border-hairline p-md bg-canvas-soft/50">
              <PollCard pollId={post.pollId} />
            </div>
          )}

          {/* Engagement Stats and Actions */}
          <div className="mt-3 flex items-center justify-between pr-4">
            {/* Reaction Picker */}
            {currentUser && (
              <ReactionPicker
                targetId={post._id}
                targetType="post"
              />
            )}
            
            {/* Reaction Summary */}
            <ReactionSummary
              targetId={post._id}
              targetType="post"
              onClick={() => setShowReactionModal(true)}
            />

          <div className="flex-1" />

          {/* Comment Toggle Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowComments(!showComments)}
            className={cn(
              "btn-press flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ink-muted-48 transition-colors hover:bg-canvas-soft hover:text-primary",
              showComments && "text-primary bg-canvas-soft"
            )}
            aria-label={showComments ? "Hide comments" : "Show comments"}
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            <span className="text-caption font-semibold">{post.commentCount}</span>
          </motion.button>

          {/* Share Button with Dropdown */}
          <div className="relative" ref={shareDropdownRef}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowShareDropdown(!showShareDropdown)}
              className="btn-press flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ink-muted-48 transition-colors hover:bg-canvas-soft hover:text-primary"
              aria-label="Share post"
            >
              <Share2 className="h-[18px] w-[18px]" />
              {post.shareCount > 0 && (
                <span className="text-caption font-semibold">{post.shareCount}</span>
              )}
            </motion.button>

            {/* Share Dropdown Menu */}
            {showShareDropdown && (
              <div className="absolute top-full mt-2 left-0 z-50 w-48 bg-canvas border border-hairline rounded-md shadow-product overflow-hidden">
                {currentUser && !isOwnPost && (
                  <>
                    <button
                      onClick={handleDirectRepost}
                      className="w-full px-4 py-2.5 text-left text-caption hover:bg-canvas-parchment flex items-center gap-3 transition-colors text-ink"
                    >
                      <Repeat2 className="w-4 h-4 text-primary" />
                      <span>Repost</span>
                    </button>
                    <button
                      onClick={handleQuotePost}
                      className="w-full px-4 py-2.5 text-left text-caption hover:bg-canvas-parchment flex items-center gap-3 border-t border-hairline transition-colors text-ink"
                    >
                      <Repeat2 className="w-4 h-4 text-primary" />
                      <span>Quote Post</span>
                    </button>
                  </>
                )}
                <button
                  onClick={handleCopyLink}
                  className="w-full px-4 py-2.5 text-left text-caption hover:bg-canvas-parchment flex items-center gap-3 border-t border-hairline transition-colors text-ink"
                >
                  <Copy className="w-4 h-4 text-ink-muted-48" />
                  <span>Copy Link</span>
                </button>
                {typeof window !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={handleWebShare}
                    className="w-full px-4 py-2.5 text-left text-caption hover:bg-canvas-parchment flex items-center gap-3 border-t border-hairline transition-colors text-ink"
                  >
                    <Share2 className="w-4 h-4 text-ink-muted-48" />
                    <span>Share via...</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bookmark Button */}
          {currentUser && (
            <BookmarkButton postId={post._id} />
          )}
        </div>

        {/* Inline Comments Section */}
        {showComments && (
          <div className="mt-md border-t border-hairline pt-md animate-in">
            <CommentList
              postId={post._id}
              comments={allComments.length > 0 ? allComments : commentsData?.comments}
              isLoading={commentsData === undefined}
              sortBy={commentSort}
              onSortChange={setCommentSort}
              hasMore={commentsData?.hasMore ?? false}
              isLoadingMore={isLoadingMoreComments}
              onLoadMore={handleLoadMoreComments}
            />
            <div className="mt-sm">
              <CommentComposer postId={post._id} />
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Reaction Modal */}
      <ReactionModal
        targetId={post._id}
        targetType="post"
        open={showReactionModal}
        onOpenChange={setShowReactionModal}
      />

      {/* Repost Modal */}
      <RepostModal
        post={{
          ...post,
          author: author,
        }}
        isOpen={showRepostModal}
        onClose={() => setShowRepostModal(false)}
        onSuccess={() => {}}
      />
    </motion.article>
  )
})
