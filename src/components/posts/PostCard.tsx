"use client"

import { useState, memo, useRef, useEffect } from "react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
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

  const [isDeleting, setIsDeleting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showReactionModal, setShowReactionModal] = useState(false)
  const [showShareDropdown, setShowShareDropdown] = useState(false)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [shareSuccess, setShareSuccess] = useState<string | null>(null)
  
  const shareDropdownRef = useRef<HTMLDivElement>(null)
  const createRepost = useMutation(api.reposts.createRepost)

  const isOwnPost = currentUser?._id === post.authorId

  // Only fetch comments when expanded
  const comments = useQuery(
    api.comments.getPostComments,
    showComments ? { postId: post._id } : "skip"
  )

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
      className: "bg-accent-sky/10 text-accent-sky dark:bg-accent-sky/15",
    },
    Faculty: {
      label: "Faculty",
      className: "bg-accent-amber/10 text-accent-amber dark:bg-accent-amber/15",
    },
    "Research Scholar": {
      label: "Scholar",
      className: "bg-accent-violet/10 text-accent-violet dark:bg-accent-violet/15",
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

  const role = roleConfig[author.role] ?? roleConfig.Student

  return (
    <article className="group/post animate-fade-rise rounded-xl bg-card border border-border/60 p-4 shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2 hover:border-border sm:p-6">
      {/* Author Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Avatar */}
          <AvatarWithStatus userId={author._id} size="sm">
            <div className="relative h-9 w-9 flex-shrink-0 sm:h-10 sm:w-10">
              {author.profilePicture ? (
                <Image
                  src={author.profilePicture}
                  alt={author.name}
                  fill
                  sizes="(max-width: 640px) 36px, 40px"
                  className="rounded-full object-cover ring-2 ring-border/30"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent-rose text-xs font-bold text-white sm:h-10 sm:w-10 sm:text-sm">
                  {author.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </AvatarWithStatus>

          {/* Name, Role Badge, and Timestamp */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate sm:text-base">{author.name}</p>
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                role.className
              )}>
                {role.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70 sm:text-[13px]">{formatTimestamp(post.createdAt)}</p>
          </div>
        </div>

        {/* Post Menu (own posts) */}
        {isOwnPost && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-2 text-muted-foreground/50 opacity-0 group-hover/post:opacity-100 hover:bg-muted hover:text-foreground transition-all duration-150"
              aria-label="Post options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {/* Delete Confirmation Dropdown */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-card border border-border rounded-xl shadow-elevation-2 overflow-hidden animate-fade-in-scale">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2.5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete post</span>
                  </button>
                ) : (
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Delete this post?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
                      >
                        {isDeleting ? "..." : "Delete"}
                      </button>
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setShowMenu(false) }}
                        className="flex-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80"
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
      <div className="mt-3 sm:mt-4">
        <PostContent
          content={post.content}
          className="text-sm text-foreground sm:text-base"
        />
      </div>

      {/* Media Gallery */}
      {post.mediaUrls && post.mediaUrls.length > 0 && post.mediaType && post.mediaType !== "link" && (
        <MediaGallery
          mediaUrls={post.mediaUrls}
          mediaType={post.mediaType as "image" | "video" | "file"}
          mediaFileNames={post.mediaFileNames}
          altPrefix={`${author.name}'s post media`}
        />
      )}

      {/* Link Preview */}
      {post.linkPreview && (
        <LinkPreviewCard
          url={post.linkPreview.url}
          title={post.linkPreview.title}
          description={post.linkPreview.description}
          image={post.linkPreview.image}
          favicon={post.linkPreview.favicon}
        />
      )}

      {/* Poll */}
      {post.pollId && (
        <PollCard pollId={post.pollId} />
      )}

      {/* Engagement Stats and Actions */}
      <div className="mt-3 flex items-center gap-1 border-t border-border/40 pt-3 sm:mt-4 sm:pt-4">
        {/* Reaction Picker */}
        {currentUser && (
          <ReactionPicker
            targetId={post._id}
            targetType="post"
          />
        )}
        
        {/* Reaction Summary - Click to see who reacted */}
        <ReactionSummary
          targetId={post._id}
          targetType="post"
          onClick={() => setShowReactionModal(true)}
        />

        {/* Comment Toggle Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted-foreground transition-all duration-150 hover:bg-accent-sky/10 hover:text-accent-sky sm:gap-2",
            showComments && "bg-accent-sky/10 text-accent-sky"
          )}
          aria-label={showComments ? "Hide comments" : "Show comments"}
          style={{ minWidth: "44px", minHeight: "44px" }}
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          <span className="text-xs font-medium sm:text-sm">{post.commentCount}</span>
        </button>

        {/* Share Button with Dropdown */}
        <div className="relative" ref={shareDropdownRef}>
          <button
            onClick={() => setShowShareDropdown(!showShareDropdown)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted-foreground transition-all duration-150 hover:bg-accent-emerald/10 hover:text-accent-emerald sm:gap-2"
            aria-label="Share post"
            style={{ minWidth: "44px", minHeight: "44px" }}
          >
            <Share2 className="h-[18px] w-[18px]" />
            {post.shareCount > 0 && (
              <span className="text-xs font-medium sm:text-sm">{post.shareCount}</span>
            )}
          </button>

          {/* Share Dropdown Menu */}
          {showShareDropdown && (
            <div className="absolute top-full mt-2 left-0 z-50 w-48 bg-card border border-border rounded-xl shadow-elevation-2 overflow-hidden animate-fade-in-scale">
              {currentUser && !isOwnPost && (
                <>
                  <button
                    onClick={handleDirectRepost}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-accent-emerald/10 flex items-center gap-3 transition-colors"
                  >
                    <Repeat2 className="w-4 h-4 text-accent-emerald" />
                    <span>Repost</span>
                  </button>
                  <button
                    onClick={handleQuotePost}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-accent-emerald/10 flex items-center gap-3 border-t border-border/40 transition-colors"
                  >
                    <Repeat2 className="w-4 h-4 text-accent-violet" />
                    <span>Quote Post</span>
                  </button>
                </>
              )}
              <button
                onClick={handleCopyLink}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted flex items-center gap-3 border-t border-border/40 transition-colors"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
                <span>Copy Link</span>
              </button>
              {typeof window !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleWebShare}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted flex items-center gap-3 border-t border-border/40 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                  <span>Share via...</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bookmark Button */}
        {currentUser && (
          <BookmarkButton postId={post._id} />
        )}
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
        onSuccess={() => {
          // Optionally refresh the feed or show success message
        }}
      />

      {/* Inline Comments Section */}
      {showComments && (
        <div className="mt-3 border-t border-border/40 pt-3 sm:mt-4 sm:pt-4 space-y-4">
          <CommentList postId={post._id} comments={comments} isLoading={comments === undefined} />
          <CommentComposer postId={post._id} />
        </div>
      )}
    </article>
  )
})
