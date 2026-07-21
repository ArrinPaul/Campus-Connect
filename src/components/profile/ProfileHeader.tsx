"use client"

import Image from"next/image"
import { useState } from"react"
import { useRouter } from"next/navigation"
import { useUser } from"@/lib/auth/client"
import { useMutation, useQuery } from"@/lib/api"
import { api } from"@/lib/api"
import { Id } from"@/lib/api"
import { ButtonLoadingSpinner } from"@/components/ui/loading-skeleton"
import { OnlineStatusDot } from"@/components/ui/OnlineStatusDot"
import { MessageSquare, Pencil, X, Share2, Globe, Github, Linkedin, Twitter, BookOpen } from"lucide-react"
import { createLogger } from"@/lib/logger"
import { toast } from"sonner"
import { ProfileForm } from"@/components/profile/ProfileForm"
import { Button } from"@/components/ui/button"
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
 const { isLoaded, isSignedIn } = useUser()
 const followUser = useMutation(api.follows.followUser)
 const unfollowUser = useMutation(api.follows.unfollowUser)
 const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation)

 const currentUser = useQuery(
 api.users.getCurrentUser,
 isLoaded && isSignedIn ? {} :"skip"
 )
 const isOwnProfile = isOwnProfileProp ?? (currentUser?._id === user._id)

 const isFollowingQuery = useQuery(
 api.follows.isFollowing,
 isLoaded && isSignedIn && !isOwnProfile ? { userId: user._id } :"skip"
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
 
 const isFollowing = optimisticFollowing !== null ? optimisticFollowing : (isFollowingQuery ?? false)
 
 const handleFollowToggle = async () => {
 try {
 setIsLoading(true)
 setOptimisticFollowing(!isFollowing)
 if (isFollowing) {
 await unfollowUser({ userId: user._id })
 } else {
 await followUser({ userId: user._id })
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
 <div className="w-full bg-canvas border-b border-hairline">
 {/* Cover Image / Gradient Area */}
 <div className="relative h-48 md:h-64 w-full bg-canvas overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-canvas/20" />
 <div className="absolute inset-0 bg-tile-black opacity-5" />
 </div>

 {/* Header Content */}
 <div className="max-w-4xl mx-auto px-4 md:px-0">
 <div className="relative flex flex-col items-center md:items-start -mt-20 md:-mt-24 pb-8">
 {/* Avatar */}
 <div className="relative h-40 w-40 rounded-lg border-4 border-canvas bg-canvas shadow-product overflow-hidden flex-shrink-0 z-10">
 {user.profilePicture ? (
 <Image
 src={user.profilePicture}
 alt={user.name}
 fill
 sizes="160px"
 className="object-cover"
 priority
 />
 ) : (
 <div className="h-full w-full flex items-center justify-center text-ink/20 font-display text-6xl">
 {user.name.charAt(0).toUpperCase()}
 </div>
 )}
 {!isOwnProfile && (
 <OnlineStatusDot
 userId={user._id}
 size="lg"
 overlay
 />
 )}
 </div>

 {/* User Info Section */}
 <div className="mt-6 w-full flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
 <div className="flex-1 text-center md:text-left space-y-2">
 <h1 className="text-display-lg md:text-hero-display text-ink leading-tight">
 {user.name}
 </h1>
 
 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate uppercase tracking-wider">
 <span className="text-primary">{user.role}</span>
 <span className="border-l border-hairline pl-4">{user.university ||"Global Academic"}</span>
 <span className="border-l border-hairline pl-4">{user.experienceLevel}</span>
 </div>

 {user.bio && (
 <p className="text-body text-slate max-w-2xl mt-4 leading-relaxed italic">
 &ldquo;{user.bio}&rdquo;
 </p>
 )}

 {/* Stats & Socials Row */}
 <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-6 pt-6 border-t border-hairline w-full">
 <div className="flex gap-4">
 <div className="text-center md:text-left">
 <p className="text-tagline font-bold text-ink-deep">{user.followerCount}</p>
 <p className="text-[10px] text-slate uppercase font-semibold">Followers</p>
 </div>
 <div className="text-center md:text-left border-l border-hairline pl-4">
 <p className="text-tagline font-bold text-ink-deep">{user.followingCount}</p>
 <p className="text-[10px] text-slate uppercase font-semibold">Following</p>
 </div>
 </div>

 <div className="flex items-center gap-3 ml-auto">
 {user.socialLinks?.website && (
 <a href={user.socialLinks.website} target="_blank" className="p-2 rounded-full hover:bg-canvas text-slate transition-colors"><Globe size={18} /></a>
 )}
 {user.socialLinks?.github && (
 <a href={user.socialLinks.github} target="_blank" className="p-2 rounded-full hover:bg-canvas text-slate transition-colors"><Github size={18} /></a>
 )}
 {user.socialLinks?.linkedin && (
 <a href={user.socialLinks.linkedin} target="_blank" className="p-2 rounded-full hover:bg-canvas text-slate transition-colors"><Linkedin size={18} /></a>
 )}
 {user.socialLinks?.twitter && (
 <a href={user.socialLinks.twitter} target="_blank" className="p-2 rounded-full hover:bg-canvas text-slate transition-colors"><Twitter size={18} /></a>
 )}
 </div>
 </div>
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
 try {
 setIsMessageLoading(true)
 const conversationId = await getOrCreateConversation({ otherUserId: user._id })
 router.push(`/messages?c=${conversationId}`)
 } catch (error) { log.error("Failed to open conversation", error) }
 finally { setIsMessageLoading(false) }
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
       variant="secondary"
       size="lg"
       className="flex items-center gap-2"
     >
       <BookOpen size={18} /> Add Course
     </Button>
     <Button
       onClick={() => setShowEditModal(true)}
       variant="primary"
       size="lg"
       className="flex items-center gap-2"
     >
       <Pencil size={18} /> Edit Profile
     </Button>
   </>
 )}
 </div>
 </div>
 </div>

 {/* Tabs - Apple Style */}
 <div className="w-full flex items-center justify-center md:justify-start gap-8 h-12 border-t border-hairline overflow-x-auto scrollbar-none">
 <button className="relative h-full flex items-center text-xs text-slate font-semibold text-primary whitespace-nowrap">
 Posts
 <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
 </button>
 <button className="h-full flex items-center text-xs text-slate font-semibold hover:text-ink-deep transition-colors whitespace-nowrap">
 Activity
 </button>
 <button className="h-full flex items-center text-xs text-slate font-semibold hover:text-ink-deep transition-colors whitespace-nowrap">
 Portfolio
 </button>
 <button className="h-full flex items-center text-xs text-slate font-semibold hover:text-ink-deep transition-colors whitespace-nowrap">
 Skills
 </button>
 </div>
 </div>

 {/* Edit Profile Modal */}
 {showEditModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEditModal(false)}>
 <div
 className="bg-surface-soft border border-hairline rounded-lg shadow-sm w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between p-lg border-b border-hairline">
 <h2 className="text-display-md text-ink-deep">Edit Profile</h2>
 <button onClick={() => setShowEditModal(false)} className="p-2 rounded-full hover:bg-canvas text-slate transition-colors">
 <X className="h-5 w-5" />
 </button>
 </div>
 <div className="p-lg">
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
 </div>
 </div>
 </div>
 )}

  {/* Add Course Modal */}
  {showAddCourseModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddCourseModal(false)}>
      <div
        className="bg-surface-soft border border-hairline rounded-lg shadow-sm w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-display-md text-ink-deep">Add Course</h2>
          <button onClick={() => setShowAddCourseModal(false)} className="p-2 rounded-full hover:bg-canvas text-slate transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-body-sm text-steel mb-4">
          Enter your course code (e.g., CS101, BIO205) to automatically join its community and connect with classmates.
        </p>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Course Code"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
            className="w-full px-4 h-12 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-fb-blue transition-colors"
          />
          <Button
            onClick={handleAddCourse}
            disabled={isAddingCourse || !courseCode.trim()}
            variant="primary"
            className="w-full h-12 flex justify-center items-center"
          >
            {isAddingCourse ? "Adding..." : "Add Course"}
          </Button>
        </div>
      </div>
    </div>
  )}
 </div>
 )
}
