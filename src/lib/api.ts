"use client"

/**
 * Backend API client - calls apps/api instead of internal routes.
 */

import {
  useQuery as useTanstackQuery,
  useMutation as useTanstackMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { useAuth } from "@/lib/auth/client"
import type { ReactNode } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

function getBaseUrl(path: string): string {
  return ""
}

export type Id<_T extends string = string> = string
// eslint-disable-next-line
export type Doc<_T extends string = string> = Record<string, any>

export interface Endpoint {
  readonly _path: string
  readonly _method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
}

function ep(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET"
): Endpoint {
  return { _path: path, _method: method }
}

// ─── useQuery ────────────────────────────────────────────────────────────────
/**
 * Legacy-compatible useQuery: returns undefined while loading, data when done.
 * Pass null endpoint or "skip" args to disable fetching.
 */
export function useQuery<T = any>(
  endpoint: Endpoint | null | undefined,
  args?: Record<string, unknown> | "skip"
): T | undefined {
  const enabled = endpoint != null && args !== "skip"

  const params = new URLSearchParams()
  if (args && args !== "skip") {
    Object.entries(args).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v))
    })
  }

  const baseUrl = getBaseUrl(endpoint?._path || "")
  const url = enabled
    ? params.toString()
      ? `${baseUrl}${endpoint!._path}?${params.toString()}`
      : `${baseUrl}${endpoint!._path}`
    : ""

  const { data } = useTanstackQuery<T>({
    queryKey: [endpoint?._path, args],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || "Query failed")
      }
      return res.json() as T
    },
    enabled,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  return data
}

// ─── useMutation ─────────────────────────────────────────────────────────────
/**
 * Legacy-compatible useMutation: returns an async function that sends the request.
 */
export function useMutation<A = any, T = any>(
  endpoint: Endpoint
): (args?: A) => Promise<T> {
  const queryClient = useQueryClient()

  const mutation = useTanstackMutation<T, Error, A | undefined>({
    mutationFn: async (args) => {
      const baseUrl = getBaseUrl(endpoint._path)
      const res = await fetch(`${baseUrl}${endpoint._path}`, {
        method: endpoint._method === "GET" ? "POST" : endpoint._method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(args ?? {}),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || "Mutation failed")
      }
      return res.json() as T
    },
    onSuccess: () => {
      const pathPrefix = endpoint._path.split("/").slice(0, 3).join("/")
      queryClient.invalidateQueries({ queryKey: [pathPrefix] })
      if (endpoint._path.startsWith("/api/follows")) {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] })
        queryClient.invalidateQueries({ queryKey: ["/api/follows"] })
      }
    },
  })

  return (args?: A) => mutation.mutateAsync(args)
}

export function useAction<A = any, T = any>(endpoint: Endpoint): (args?: A) => Promise<T> {
  return async (args?: A) => {
    const baseUrl = getBaseUrl(endpoint._path)
    const res = await fetch(`${baseUrl}${endpoint._path}`, {
      method: endpoint._method === "GET" ? "POST" : endpoint._method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(args ?? {}),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || "Action failed")
    }
    return res.json() as T
  }
}

// ─── api object ─────────────────────────────────────────────────────────────

export const api = {
  // ── users ──────────────────────────────────────────────────────────────────
  users: {
    getCurrentUser: ep("/api/users/me"),
    getUserById: ep("/api/users/profile"),
    searchUsers: ep("/api/users/search"),
    updateProfile: ep("/api/users/me", "PATCH"),
    addSkill: ep("/api/users/skills", "POST"),
    removeSkill: ep("/api/users/skills", "DELETE"),
    completeOnboarding: ep("/api/users/onboarding", "POST"),
    getPrivacySettings: ep("/api/users/privacy"),
    updatePrivacySettings: ep("/api/users/privacy", "PATCH"),
    generateUploadUrl: ep("/api/media/upload-url", "POST"),
    updateProfilePicture: ep("/api/users/avatar", "POST"),
    exportUserData: ep("/api/users/export", "POST"),
    deleteAccount: ep("/api/users/me", "DELETE"),
    getNotificationPreferences: ep("/api/users/notification-preferences"),
    updateNotificationPreferences: ep(
      "/api/users/notification-preferences",
      "PATCH"
    ),
    getSubscription: ep("/api/subscriptions"),
  },

  // ── posts ──────────────────────────────────────────────────────────────────
  posts: {
    getFeedPosts: ep("/api/posts/feed"),
    getPostById: ep("/api/posts/single"),
    createPost: ep("/api/posts", "POST"),
    updatePost: ep("/api/posts/update", "PATCH"),
    deletePost: ep("/api/posts/delete", "DELETE"),
    getUserPosts: ep("/api/posts/user"),
    getExplorePosts: ep("/api/posts/explore"),
    getPostsByHashtag: ep("/api/posts/hashtag"),
    getPostsByCommunity: ep("/api/posts/community"),
    getUserActivityFeed: ep("/api/posts/activity"),
  },

  // ── comments ───────────────────────────────────────────────────────────────
  comments: {
    getPostComments: ep("/api/comments"),
    addComment: ep("/api/comments", "POST"),
    deleteComment: ep("/api/comments/delete", "DELETE"),
    getReplies: ep("/api/comments/replies"),
    getCommentsByUser: ep("/api/comments/user"),
  },

  // ── reactions ──────────────────────────────────────────────────────────────
  reactions: {
    addReaction: ep("/api/reactions", "POST"),
    removeReaction: ep("/api/reactions/remove", "DELETE"),
    getUserReaction: ep("/api/reactions/user"),
    getReactionCounts: ep("/api/reactions/counts"),
    getReactions: ep("/api/reactions"),
    getReactionUsers: ep("/api/reactions/users"),
  },

  // ── follows ────────────────────────────────────────────────────────────────
  follows: {
    followUser: ep("/api/follows", "POST"),
    unfollowUser: ep("/api/follows/unfollow", "DELETE"),
    getFollowers: ep("/api/follows/followers"),
    getFollowing: ep("/api/follows/following"),
    isFollowing: ep("/api/follows/is-following"),
    getSuggestedUsers: ep("/api/follows/suggestions"),
    getSuggestions: ep("/api/follows/suggestions"),
  },

  // ── bookmarks ──────────────────────────────────────────────────────────────
  bookmarks: {
    addBookmark: ep("/api/bookmarks", "POST"),
    removeBookmark: ep("/api/bookmarks/remove", "DELETE"),
    getBookmarks: ep("/api/bookmarks"),
    getBookmarkCollections: ep("/api/bookmarks/collections"),
    isBookmarked: ep("/api/bookmarks/check"),
  },

  // ── notifications ──────────────────────────────────────────────────────────
  notifications: {
    getNotifications: ep("/api/notifications"),
    markAsRead: ep("/api/notifications/read", "POST"),
    markAllAsRead: ep("/api/notifications/read-all", "POST"),
    getUnreadCount: ep("/api/notifications/unread-count"),
  },

  // ── messages ───────────────────────────────────────────────────────────────
  messages: {
    sendMessage: ep("/api/messages", "POST"),
    getMessages: ep("/api/messages"),
    deleteMessage: ep("/api/messages/delete", "DELETE"),
    searchMessages: ep("/api/messages/search"),
    editMessage: ep("/api/messages", "PATCH"),
    getTotalUnreadCount: ep("/api/messages/unread-count"),
    markAsRead: ep("/api/messages/read", "POST"),
    updateTypingStatus: ep("/api/messages/typing", "POST"),
    getTypingUsers: ep("/api/messages/typing"),
  },

  // ── conversations ──────────────────────────────────────────────────────────
  conversations: {
    getOrCreateConversation: ep("/api/conversations", "POST"),
    getConversations: ep("/api/conversations"),
    getConversation: ep("/api/conversations/single"),
    deleteConversation: ep("/api/conversations/delete", "DELETE"),
    createGroup: ep("/api/conversations/group", "POST"),
    getPinnedMessages: ep("/api/conversations/pinned"),
    updateGroupInfo: ep("/api/conversations/group", "PATCH"),
    addGroupMember: ep("/api/conversations/participants", "POST"),
    removeGroupMember: ep("/api/conversations/participants", "DELETE"),
    promoteToAdmin: ep("/api/conversations/admin", "POST"),
    demoteFromAdmin: ep("/api/conversations/admin", "DELETE"),
    leaveGroup: ep("/api/conversations/leave", "POST"),
    getTotalUnreadCount: ep("/api/conversations/unread"),
    muteConversation: ep("/api/conversations/mute", "POST"),
    getUnreadCount: ep("/api/conversations/unread-count"),
  },

  // ── hashtags ───────────────────────────────────────────────────────────────
  hashtags: {
    getTrending: ep("/api/hashtags/trending"),
    getByTag: ep("/api/hashtags/single"),
    searchHashtags: ep("/api/hashtags/search"),
    search: ep("/api/hashtags/search"),
    getPostsByHashtag: ep("/api/hashtags/posts"),
  },

  admin: {
    getDashboardStats: ep("/api/admin/stats"),
    getUsers: ep("/api/admin/users"),
    manageUser: ep("/api/admin/users", "POST"),
    getReportedContent: ep("/api/admin/moderation"),
    moderateContent: ep("/api/admin/moderation", "POST"),
  },
  
  // ── communities ─────────────────────────────────────────────────────────────
  communities: {
    getCommunities: ep("/api/communities"),
    getCommunityPosts: ep("/api/posts/community"),
    getCommunityBySlug: ep("/api/communities/slug"),
    createCommunity: ep("/api/communities", "POST"),
    joinCommunity: ep("/api/communities/join", "POST"),
    inviteUser: ep("/api/communities/invite", "POST"),
    getCommunityInvites: ep("/api/communities/invites"),
    respondToInvite: ep("/api/communities/invite/respond", "POST"),
    leaveCommunity: ep("/api/communities/leave", "POST"),
    updateCommunity: ep("/api/communities/update", "PATCH"),
    getCommunityMembers: ep("/api/communities/members"),
    revokeInvite: ep("/api/communities/invite/revoke", "DELETE"),
    getMyInvites: ep("/api/communities/my-invites"),
    approveMember: ep("/api/communities/members/approve", "POST"),
    removeMember: ep("/api/communities/members/remove", "POST"),
    updateMemberRole: ep("/api/communities/members/role", "PATCH"),
    getMembership: ep("/api/communities/membership"),
  },

  // ── events ─────────────────────────────────────────────────────────────────
  events: {
    getEvents: ep("/api/events"),
    getEventById: ep("/api/events/single"),
    createEvent: ep("/api/events", "POST"),
    updateEvent: ep("/api/events/update", "PATCH"),
    deleteEvent: ep("/api/events/delete", "DELETE"),
    attendEvent: ep("/api/events/attend", "POST"),
    unattendEvent: ep("/api/events/attend", "DELETE"),
    getMyEvents: ep("/api/events/my-events"),
    getUpcomingEvents: ep("/api/events/upcoming"),
  },

  // ── jobs ───────────────────────────────────────────────────────────────────
  jobs: {
    getJobs: ep("/api/jobs"),
    getJobById: ep("/api/jobs/single"),
    createJob: ep("/api/jobs", "POST"),
    updateJob: ep("/api/jobs/update", "PATCH"),
    deleteJob: ep("/api/jobs/delete", "DELETE"),
    applyToJob: ep("/api/jobs/apply", "POST"),
    getMyApplications: ep("/api/jobs/applications"),
    getJobApplications: ep("/api/jobs/job-applications"),
  },

  // ── stories ────────────────────────────────────────────────────────────────
  stories: {
    getActiveStories: ep("/api/stories"),
    getUserStories: ep("/api/stories/user"),
    createStory: ep("/api/stories", "POST"),
    viewStory: ep("/api/stories/view", "POST"),
    deleteStory: ep("/api/stories/delete", "DELETE"),
    getStoryById: ep("/api/stories/single"),
  },

  // ── questions ──────────────────────────────────────────────────────────────
  questions: {
    getQuestions: ep("/api/questions"),
    askQuestion: ep("/api/questions", "POST"),
    getQuestionById: ep("/api/questions/single"),
    updateQuestion: ep("/api/questions/update", "PATCH"),
    deleteQuestion: ep("/api/questions/delete", "DELETE"),
    answerQuestion: ep("/api/questions/answer", "POST"),
    voteOnAnswer: ep("/api/questions/vote", "POST"),
    markAnswerAccepted: ep("/api/questions/accept", "POST"),
    searchQuestions: ep("/api/questions/search"),
    getAnswers: ep("/api/questions/answers"),
    incrementViewCount: ep("/api/questions/view", "POST"),
  },

  // ── resources ──────────────────────────────────────────────────────────────
  resources: {
    getResources: ep("/api/resources"),
    getResourceById: ep("/api/resources/single"),
    uploadResource: ep("/api/resources", "POST"),
    updateResource: ep("/api/resources/update", "PATCH"),
    deleteResource: ep("/api/resources/delete", "DELETE"),
    downloadResource: ep("/api/resources/download", "POST"),
    rateResource: ep("/api/resources/rate", "POST"),
  },

  // ── research papers ────────────────────────────────────────────────────────
  papers: {
    getPapers: ep("/api/research"),
    getPaperById: ep("/api/research/single"),
    uploadPaper: ep("/api/research", "POST"),
    updatePaper: ep("/api/research/update", "PATCH"),
    deletePaper: ep("/api/research/delete", "DELETE"),
    votePaper: ep("/api/research/vote", "POST"),
    searchPapers: ep("/api/research/search"),
    addReview: ep("/api/research/review", "POST"),
  },

  // ── marketplace ────────────────────────────────────────────────────────────
  marketplace: {
    getListings: ep("/api/marketplace"),
    getListingById: ep("/api/marketplace/single"),
    createListing: ep("/api/marketplace", "POST"),
    updateListing: ep("/api/marketplace/update", "PATCH"),
    deleteListing: ep("/api/marketplace/delete", "DELETE"),
    contactSeller: ep("/api/marketplace/contact", "POST"),
    markAsSold: ep("/api/marketplace/sold", "POST"),
    getMyListings: ep("/api/marketplace/my-listings"),
    purchaseListing: ep("/api/marketplace/purchase", "POST"),
    completeTransaction: ep("/api/marketplace/complete", "POST"),
    cancelTransaction: ep("/api/marketplace/cancel", "POST"),
    getListingTransactions: ep("/api/marketplace/transactions"),
  },

  // ── polls ──────────────────────────────────────────────────────────────────
  polls: {
    getPoll: ep("/api/polls/single"),
    getUserVote: ep("/api/polls/user-vote"),
    createPoll: ep("/api/polls", "POST"),
    votePoll: ep("/api/polls/vote", "POST"),
    linkPollToPost: ep("/api/polls/link", "POST"),
  },

  // ── reposts ────────────────────────────────────────────────────────────────
  reposts: {
    repost: ep("/api/reposts", "POST"),
    undoRepost: ep("/api/reposts/undo", "DELETE"),
    isReposted: ep("/api/reposts/check"),
  },

  // ── presence ───────────────────────────────────────────────────────────────
  presence: {
    updatePresence: ep("/api/presence", "POST"),
    getUserStatuses: ep("/api/presence"),
    setOnlineStatus: ep("/api/presence/status", "POST"),
    getTypingUsers: ep("/api/presence/typing"),
    heartbeat: ep("/api/presence/heartbeat", "POST"),
    setTyping: ep("/api/presence/typing", "POST"),
  },

  // ── calls ──────────────────────────────────────────────────────────────────
  calls: {
    initiateCall: ep("/api/calls", "POST"),
    acceptCall: ep("/api/calls/accept", "POST"),
    getIncomingCalls: ep("/api/calls/incoming"),
    endCall: ep("/api/calls/end", "POST"),
    rejectCall: ep("/api/calls/reject", "POST"),
    getActiveCall: ep("/api/calls/active"),
  },

  // ── ads ────────────────────────────────────────────────────────────────────
  ads: {
    getAds: ep("/api/ads"),
    createAd: ep("/api/ads", "POST"),
    getAdDashboard: ep("/api/ads/dashboard"),
    trackImpression: ep("/api/ads/impression", "POST"),
    trackClick: ep("/api/ads/click", "POST"),
    pauseAd: ep("/api/ads/pause", "POST"),
    updateAd: ep("/api/ads/update", "PATCH"),
    deleteAd: ep("/api/ads/delete", "DELETE"),
    getAdAnalytics: ep("/api/ads/analytics"),
  },



  // ── portfolio ──────────────────────────────────────────────────────────────
  portfolio: {
    getPortfolio: ep("/api/portfolio"),
    addProject: ep("/api/portfolio/projects", "POST"),
    updateProject: ep("/api/portfolio/projects", "PATCH"),
    deleteProject: ep("/api/portfolio/projects", "DELETE"),
    addCertification: ep("/api/portfolio/certifications", "POST"),
    removeCertification: ep("/api/portfolio/certifications", "DELETE"),
    getProjects: ep("/api/portfolio/projects"),
    getTimeline: ep("/api/portfolio/timeline"),
  },

  // ── skill endorsements ─────────────────────────────────────────────────────
  skillEndorsements: {
    getEndorsements: ep("/api/skills/endorsements"),
    endorseSkill: ep("/api/skills/endorse", "POST"),
    removeEndorsement: ep("/api/skills/endorse", "DELETE"),
  },

  // ── feed_ranking ──────────────────────────────────────────────────────────
  feed_ranking: {
    getRankedFeed: ep("/api/posts/explore"),
    getTrendingFeed: ep("/api/posts/explore"),
  },

  // ── search ─────────────────────────────────────────────────────────────────
  search: {
    universalSearch: ep("/api/search"),
    searchPosts: ep("/api/search/posts"),
    searchUsers: ep("/api/search/users"),
    searchCommunities: ep("/api/search/communities"),
  },

  // ── recommendations ────────────────────────────────────────────────────────
  recommendations: {
    getPostRecommendations: ep("/api/posts/explore"),
    getSuggestedUsers: ep("/api/graph/suggestions"),
  },

  // ── suggestions ────────────────────────────────────────────────────────────
  suggestions: {
    getSuggestions: ep("/api/graph/suggestions"),
    dismissSuggestion: ep("/api/graph/suggestions/dismiss", "POST"),
    refreshSuggestions: ep("/api/graph/suggestions/refresh", "POST"),
  },

  // ── media ──────────────────────────────────────────────────────────────────
  media: {
    generateUploadUrl: ep("/api/media/upload-url", "POST"),
    confirmUpload: ep("/api/media/confirm", "POST"),
    resolveStorageUrls: ep("/api/media/resolve-urls", "POST"),
    fetchLinkPreview: ep("/api/media/link-preview", "POST"),
  },

  // ── subscriptions ──────────────────────────────────────────────────────────
  subscriptions: {
    getSubscriptionStatus: ep("/api/subscriptions"),
    createCheckoutSession: ep("/api/subscriptions/checkout", "POST"),
    cancelSubscription: ep("/api/subscriptions", "DELETE"),
    getMySubscription: ep("/api/subscriptions/my", "POST"),
  },

  // ── push notifications ─────────────────────────────────────────────────────
  pushNotifications: {
    subscribe: ep("/api/push/subscribe", "POST"),
    unsubscribe: ep("/api/push/unsubscribe", "POST"),
    getUserSubscriptions: ep("/api/push/subscriptions"),
    updatePreferences: ep("/api/push/preferences", "PATCH"),
    getEndpoint: ep("/api/push/endpoint"),
    getVapidPublicKey: ep("/api/push/vapid-key"),
  },

  // ── matching ───────────────────────────────────────────────────────────────
  matching: {
    getMatches: ep("/api/matching"),
    getMatchScore: ep("/api/matching/score"),
  },

  // ── monitoring ─────────────────────────────────────────────────────────────
  monitoring: {
    logError: ep("/api/monitoring/error", "POST"),
  },

  // ── reports ────────────────────────────────────────────────────────────────
  reports: {
    createReport: ep("/api/reports", "POST"),
    getReports: ep("/api/reports"),
  },
} as const
