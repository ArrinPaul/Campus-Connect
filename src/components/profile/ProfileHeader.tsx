"use client"

import Image from"next/image"
import { useState } from"react"
import Link from"next/link"
import { useRouter, usePathname } from"next/navigation"
import { useUser } from"@/lib/auth/client"
import { useMutation, useQuery } from"@/lib/api"
import { api } from"@/lib/api"
import { Id } from"@/lib/api"
import { ButtonLoadingSpinner } from"@/components/ui/loading-skeleton"
import { OnlineStatusDot } from"@/components/ui/OnlineStatusDot"
import { MessageSquare, Pencil, Share2, Globe, Github, Linkedin, Twitter, BookOpen, Trophy, Award, CheckCircle, Sparkles } from"lucide-react"
import { createLogger } from"@/lib/logger"
import { toast } from"sonner"
import { ProfileForm } from"@/components/profile/ProfileForm"
import { Button } from"@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from"@/components/ui/dialog"
import { cn } from"@/lib/utils"

const log = createLogger("ProfileHeader")

interface User {
 _id: Id<"users">
 name: string
 profilePicture?: string
 bio?: string
 role:"Student" |"Research Scholar" |"Faculty"
 university?: string
 experienceLevel:"Beginner" |"Intermediate" |"Advanced" |"Expert"
 followerCount: number
 followingCount: number
 socialLinks?: {
 github?: string
 linkedin?: string
 twitter?: string
 website?: string
 }
}

interface ProfileHeaderProps {
 user: User
 isOwnProfile?: boolean
}

export function ProfileHeader({ user, isOwnProfile: isOwnProfileProp }: ProfileHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoaded, isSignedIn } = useUser()
  const followUser = useMutation(api.follows.followUser)
  const unfollowUser = useMutation(api.follows.unfollowUser)
  const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation)

  const targetUserId = user._id || (user as any).id || (user as any).userId
  const profileTabs = [
    { label: "Posts", href: `/profile/${targetUserId}` },
    { label: "Activity", href: `/profile/${targetUserId}/activity` },
    { label: "Portfolio", href: `/profile/${targetUserId}/portfolio` },
  ]
  const profilePicture = user.profilePicture || (user as any).profile_picture || (user as any).avatar_url
  const followerCount = user.followerCount ?? (user as any).follower_count ?? (user as any).followersCount ?? 0
  const followingCount = user.followingCount ?? (user as any).following_count ?? 0

  const currentUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && isSignedIn ? {} : "skip"
  )
  const currentUserId = currentUser?._id || (currentUser as any)?.id
  const isOwnProfile = isOwnProfileProp ?? (Boolean(currentUserId && targetUserId) && String(currentUserId) === String(targetUserId))

  const isFollowingQuery = useQuery(
    api.follows.isFollowing,
    isLoaded && isSignedIn && !isOwnProfile && targetUserId ? { userId: targetUserId } : "skip"
  )

  const reputation = useQuery(
    api.gamification?.getUserReputation,
    targetUserId ? { userId: targetUserId } : "skip"
  )
  
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMessageLoading, setIsMessageLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [courseCode, setCourseCode] = useState("")
  const [isAddingCourse, setIsAddingCourse] = useState(false)

  const handleAddCourse = async () => {
    if (!courseCode.trim()) return;
    setIsAddingCourse(true);
    try {
      const res = await fetch("/api/courses/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseCode: courseCode.trim() })
      });
      if (!res.ok) throw new Error("Failed to add course");
      toast.success("Successfully added to course!");
      setShowAddCourseModal(false);
      setCourseCode("");
      router.refresh(); // Refresh page to see new course
    } catch (error) {
      toast.error("Failed to add course. Please try again.");
    } finally {
      setIsAddingCourse(false);
    }
  }
  
  const rawFollowing =
    typeof isFollowingQuery === "object" && isFollowingQuery !== null
      ? (isFollowingQuery as any).isFollowing
      : isFollowingQuery
  const isFollowing = optimisticFollowing !== null ? optimisticFollowing : Boolean(rawFollowing)
  
  const handleFollowToggle = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to follow users")
      return
    }
    if (!targetUserId) {
      toast.error("Invalid user ID")
      return
    }
    try {
      setIsLoading(true)
      const nextFollowingState = !isFollowing
      setOptimisticFollowing(nextFollowingState)
      if (isFollowing) {
        await unfollowUser({ userId: targetUserId })
        toast.success("Unfollowed user")
      } else {
        await followUser({ userId: targetUserId })
        toast.success("Followed user")
      }
      setOptimisticFollowing(null)
    } catch (error) {
      setOptimisticFollowing(null)
      log.error("Failed to toggle follow", error)
      toast.error("Failed to update follow status")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full bg-card border-b border-border shadow-sm">
      {/* Cover Image / Gradient Area */}
      <div className="relative h-48 md:h-80 w-full max-w-[1096px] mx-auto bg-muted overflow-hidden md:rounded-b-lg">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-canvas/20" />
        <div className="absolute inset-0 bg-black opacity-5" />
      </div>

      {/* Header Content */}
      <div className="max-w-[1024px] mx-auto px-4 md:px-8 pb-4">
        <div className="relative flex flex-col md:flex-row md:items-end -mt-20 md:-mt-8 md:mb-4">
          {/* Avatar */}
          <div className="relative h-[168px] w-[168px] rounded-full border-4 border-card bg-card shadow-sm overflow-hidden flex-shrink-0 z-10 md:mr-6 mx-auto md:mx-0">
            {profilePicture ? (
              <Image
                src={profilePicture}
                alt={user.name}
                fill
                sizes="160px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-foreground/20 font-display text-6xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            {!isOwnProfile && targetUserId && (
              <OnlineStatusDot
                userId={targetUserId}
                size="lg"
                overlay
              />
            )}
          </div>

          {/* User Info Section */}
          <div className="mt-2 md:mt-0 w-full flex flex-col md:flex-row justify-between md:items-end gap-4 md:pb-4">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-[32px] font-bold text-foreground leading-tight">
                {user.name}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="text-primary">{user.role}</span>
                <span className="border-l border-border pl-4">{user.university || "Global Academic"}</span>
                <span className="border-l border-border pl-4">{user.experienceLevel}</span>
              </div>

              {user.bio && (
                <p className="text-body-md text-muted-foreground max-w-2xl mt-4 leading-relaxed italic">
                  &ldquo;{user.bio}&rdquo;
                </p>
              )}

              {/* Stats & Socials Row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-4 pt-4 w-full">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-center md:text-left">
                    <p className="text-subtitle-md font-bold text-foreground">{followerCount}</p>
                    <p className="text-micro text-muted-foreground uppercase font-semibold">Followers</p>
                  </div>
                  <div className="text-center md:text-left border-l border-border pl-4">
                    <p className="text-subtitle-md font-bold text-foreground">{followingCount}</p>
                    <p className="text-micro text-muted-foreground uppercase font-semibold">Following</p>
                  </div>
                  <div className="text-center md:text-left border-l border-border pl-4">
                    <p className="text-subtitle-md font-bold text-primary flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{reputation?.points ?? (user as any).reputation ?? 0}</span>
                    </p>
                    <p className="text-micro text-muted-foreground uppercase font-semibold">Reputation (Lvl {reputation?.level ?? 1})</p>
                  </div>
                  <div className="text-center md:text-left border-l border-border pl-4">
                    <p className="text-subtitle-md font-bold text-warning flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{reputation?.rank ? `#${reputation.rank}` : "â€”"}</span>
                    </p>
                    <p className="text-micro text-muted-foreground uppercase font-semibold">Campus Rank</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  {user.socialLinks?.website && (
                    <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-card text-muted-foreground transition-colors"><Globe size={18} /></a>
                  )}
                  {user.socialLinks?.github && (
                    <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-card text-muted-foreground transition-colors"><Github size={18} /></a>
                  )}
                  {user.socialLinks?.linkedin && (
                    <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-card text-muted-foreground transition-colors"><Linkedin size={18} /></a>
                  )}
                  {user.socialLinks?.twitter && (
                    <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-card text-muted-foreground transition-colors"><Twitter size={18} /></a>
                  )}
                </div>
              </div>

              {/* Achievement Badges Row */}
              {reputation?.badges && reputation.badges.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-4 w-full">
                  <span className="text-micro font-bold text-muted-foreground uppercase tracking-wider mr-1">Badges:</span>
                  {reputation.badges.map((b: any) => (
                    <div
                      key={b.id}
                      title={`${b.name}: ${b.description}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 border border-warning/20 text-warning text-xs font-semibold"
                    >
                      {b.id === "top_researcher" && <BookOpen className="w-3.5 h-3.5" />}
                      {b.id === "helpful_peer" && <CheckCircle className="w-3.5 h-3.5" />}
                      {b.id === "campus_leader" && <Trophy className="w-3.5 h-3.5" />}
                      <span>{b.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button variant="pearl" size="icon" className="shadow-sm">
                <Share2 size={20} />
              </Button>
 
 {!isOwnProfile && (
 <>
 <Button
 onClick={async () => {
   if (!isSignedIn) {
     toast.error("Please sign in to message users");
     return;
   }
   if (!targetUserId) {
     toast.error("Invalid user profile");
     return;
   }
   try {
     setIsMessageLoading(true)
     const res = await getOrCreateConversation({ participantId: targetUserId, otherUserId: targetUserId })
     const conversationId = typeof res === "string" ? res : (res?._id || res?.id)
     if (conversationId) {
       router.push(`/messages?c=${conversationId}`)
     } else {
       router.push("/messages")
     }
   } catch (error) { 
     log.error("Failed to open conversation", error)
     toast.error("Failed to start conversation. Please try again.")
   } finally { 
     setIsMessageLoading(false) 
   }
 }}
 disabled={isMessageLoading}
 variant="secondary"
 size="lg"
 >
 {isMessageLoading ?"..." :"Message"}
 </Button>
 <Button
 onClick={handleFollowToggle}
 disabled={isLoading}
 variant={isFollowing ?"secondary" :"primary"}
 size="lg"
 className="min-w-[120px]"
 >
 {isLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
 </Button>
 </>
 )}

 {isOwnProfile && (
   <>
     <Button
       onClick={() => setShowAddCourseModal(true)}
       variant="primary" size="lg" className="flex items-center gap-2 font-semibold"><BookOpen size={18} /> Add course
     </Button>
     <Button
       onClick={() => setShowEditModal(true)}
       variant="secondary" size="lg" className="flex items-center gap-2 font-semibold bg-muted hover:bg-muted/80 text-foreground border-none shadow-none"><Pencil size={18} /> Edit profile
     </Button>
   </>
 )}
 </div>
 </div>
 </div>

 {/* Profile sections */}
          <nav aria-label="Profile sections" className="w-full flex items-center justify-center md:justify-start gap-2 h-12 border-t border-border mt-4 overflow-x-auto scrollbar-none">
            {profileTabs.map((tab) => {
              const active = pathname === tab.href
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative h-full flex items-center px-4 text-[15px] font-semibold whitespace-nowrap transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    active ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {active && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />}
                </Link>
              )
            })}
          </nav>
        </div>

 {/* Edit Profile Modal */}
 <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
 <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Edit Profile</DialogTitle>
 <DialogDescription className="sr-only">Update your profile details.</DialogDescription>
 </DialogHeader>
 <ProfileForm
 initialData={{
 bio: user.bio,
 university: user.university,
 role: user.role,
 experienceLevel: user.experienceLevel,
 profilePicture: user.profilePicture,
 socialLinks: user.socialLinks,
 }}
 onSave={() => setShowEditModal(false)}
 />
 </DialogContent>
 </Dialog>

  {/* Add Course Modal */}
  <Dialog open={showAddCourseModal} onOpenChange={setShowAddCourseModal}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Add Course</DialogTitle>
        <DialogDescription>
          Enter your course code (e.g., CS101, BIO205) to automatically join its community and connect with classmates.
        </DialogDescription>
      </DialogHeader>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!isAddingCourse && courseCode.trim()) handleAddCourse()
        }}
      >
        <input
          type="text"
          aria-label="Course code"
          placeholder="Course Code"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
          className="w-full px-4 h-12 bg-card border border-border rounded-lg text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
        />
        <Button
          type="submit"
          disabled={isAddingCourse || !courseCode.trim()}
          variant="primary"
          className="w-full h-12 flex justify-center items-center"
        >
          {isAddingCourse ? "Adding..." : "Add Course"}
        </Button>
      </form>
    </DialogContent>
  </Dialog>
 </div>
 )
}


