npx convex run seed:seedAll    # Populate all tables
npx convex run seed:clearAll   # Wipe everything (for re-seeding)# Convex Backend — Comprehensive Audit Report

> **Generated:** 2025  
> **Scope:** All 43 files in `convex/`  
> **Frontend cross-reference:** `src/app/` and `src/components/`

---

## Table of Contents

- [A. Schema Analysis](#a-schema-analysis)
- [B. API Surface](#b-api-surface)
- [C. Auth Audit](#c-auth-audit)
- [D. Data Integrity Risks](#d-data-integrity-risks)
- [E. Missing Features / Incomplete Implementations](#e-missing-features--incomplete-implementations)
- [F. Frontend Linkage](#f-frontend-linkage)
- [G. Dead / Unreferenced Code](#g-dead--unreferenced-code)
- [H. Security Concerns](#h-security-concerns)
- [I. Indexing Gaps](#i-indexing-gaps)

---

## A. Schema Analysis

### Tables (34 total)

| # | Table | Indexes | File |
|---|-------|---------|------|
| 1 | `users` | `by_clerkId`, `by_email`, `by_username`, `by_lastSeenAt` | schema.ts:5 |
| 2 | `posts` | `by_author`, `by_createdAt`, `by_community` | schema.ts:84 |
| 3 | `likes` | `by_user`, `by_post`, `by_user_and_post` | schema.ts:127 |
| 4 | `reactions` | `by_target`, `by_user_target`, `by_user` | schema.ts:134 |
| 5 | `bookmarks` | `by_user`, `by_user_and_post`, `by_user_and_collection` | schema.ts:151 |
| 6 | `comments` | `by_post`, `by_author`, `by_parent` | schema.ts:158 |
| 7 | `follows` | `by_follower`, `by_following`, `by_follower_and_following` | schema.ts:183 |
| 8 | `hashtags` | `by_tag`, `by_post_count`, `by_trending_score` | schema.ts:190 |
| 9 | `postHashtags` | `by_post`, `by_hashtag`, `by_hashtag_created` | schema.ts:198 |
| 10 | `notifications` | `by_recipient`, `by_recipient_unread`, `by_recipient_created` | schema.ts:205 |
| 11 | `reposts` | `by_user`, `by_original_post`, `by_user_and_post`, `by_createdAt` | schema.ts:220 |
| 12 | `conversations` | `by_last_message`, `by_participant` | schema.ts:230 |
| 13 | `messages` | `by_conversation`, `by_sender` | schema.ts:246 |
| 14 | `conversationParticipants` | `by_user`, `by_conversation`, `by_user_conversation` | schema.ts:268 |
| 15 | `typingIndicators` | `by_conversation`, `by_user_conversation` | schema.ts:302 |
| 16 | `calls` | `by_conversation`, `by_caller`, `by_status` | schema.ts:312 |
| 17 | `stories` | `by_author`, `by_expiry` | schema.ts:349 |
| 18 | `storyViews` | `by_story`, `by_viewer`, `by_story_viewer` | schema.ts:361 |
| 19 | `polls` | `by_post`, `by_author` | schema.ts:369 |
| 20 | `pollVotes` | `by_poll`, `by_user_poll` | schema.ts:388 |
| 21 | `suggestions` | `by_user`, `by_user_dismissed` | schema.ts:395 |
| 22 | `skillEndorsements` | `by_user_skill`, `by_endorser`, `by_user_skill_endorser` | schema.ts:405 |
| 23 | `communities` | `by_slug`, `by_category`, `by_member_count` | schema.ts:413 |
| 24 | `communityMembers` | `by_community`, `by_user`, `by_community_user` | schema.ts:429 |
| 25 | `events` | `by_start_date`, `by_organizer`, `by_community` | schema.ts:439 |
| 26 | `eventRSVPs` | `by_event`, `by_user`, `by_event_user` | schema.ts:458 |
| 27 | `papers` | `by_uploaded_by`, `by_created` | schema.ts:500 |
| 28 | `paperAuthors` | `by_paper`, `by_user` | schema.ts:513 |
| 29 | `projects` | `by_user` | schema.ts:518 |
| 30 | `timeline` | `by_user` | schema.ts:530 |
| 31 | `jobs` | `by_posted_by`, `by_created` | schema.ts:542 |
| 32 | `jobApplications` | `by_job`, `by_user`, `by_user_job` | schema.ts:556 |
| 33 | `resources` | `by_course`, `by_uploaded_by` | schema.ts:570 |
| 34 | `questions` | `by_asked_by`, `by_created` | schema.ts:582 |
| 35 | `answers` | `by_question`, `by_answered_by` | schema.ts:596 |
| 36 | `questionVotes` | `by_target`, `by_user_target` | schema.ts:605 |
| 37 | `achievements` | `by_user` | schema.ts:614 |
| 38 | `subscriptions` | `by_user`, `by_stripe_sub` | schema.ts:621 |
| 39 | `ads` | `by_advertiser`, `by_status` | schema.ts:639 |
| 40 | `adImpressions` | `by_ad`, `by_user_ad` | schema.ts:654 |
| 41 | `adClicks` | `by_ad` | schema.ts:661 |
| 42 | `listings` | `by_seller`, `by_category`, `by_status` | schema.ts:667 |
| 43 | `pushSubscriptions` | `by_user` | schema.ts:691 |

### Schema Design Issues

1. **`likes` table is orphaned.** The table is defined (schema.ts:127) but no backend code reads or writes it. `likePost`/`unlikePost` in posts.ts use it, but those functions are never called from the frontend (see [Section G](#g-dead--unreferenced-code)). The newer `reactions` table has superseded it.

2. **`targetId` is `v.string()` in `reactions` (schema.ts:137) and `questionVotes` (schema.ts:607).** These should be typed IDs (`v.id("posts")`) or at minimum a `v.union` of IDs. Using plain strings loses Convex's referential integrity guarantees and requires unsafe `as Id<>` casts throughout.

3. **`conversations.participantIds` (schema.ts:237)** is an array stored on the document for quick lookup, but the `by_participant` index on an array field doesn't support compound lookups like "find the DM between user A and user B." This forces `getOrCreateConversation` (conversations.ts:~30) to scan all participant records.

4. **`notifications.type` (schema.ts:211)** only allows 5 types: `reaction`, `comment`, `mention`, `follow`, `reply`. But events.ts uses `type: "comment"` for event reminders and messages.ts uses `type: "mention"` for DM notifications — both semantically wrong.

5. **No `updatedAt` on many tables** that support editing: `comments`, `communities`, `events`, `jobs`, `resources`, `questions`, `answers`. This makes change detection and cache invalidation harder.

---

## B. API Surface

### Complete function inventory (all 43 files)

#### users.ts (1,140 lines)
| Export | Type | Line |
|--------|------|------|
| `createUserFromWebhook` | internalMutation | ~25 |
| `updateUserFromWebhook` | internalMutation | ~80 |
| `deleteUserFromWebhook` | internalMutation | ~120 |
| `getCurrentUser` | query | ~170 |
| `getUserById` | query | ~210 |
| `searchUsers` | query | ~250 |
| `searchUsersByUsername` | query | ~310 |
| `getUserByUsername` | query | ~370 |
| `getUserByIdOrUsername` | query | ~430 |
| `updateProfile` | mutation | ~500 |
| `addSkill` | mutation | ~620 |
| `removeSkill` | mutation | ~660 |
| `updateNotificationPreferences` | mutation | ~700 |
| `generateUploadUrl` | mutation | ~750 |
| `updateProfilePicture` | mutation | ~780 |
| `exportUserData` | mutation | ~830 |
| `deleteAccount` | mutation | ~950 |
| `completeOnboarding` | mutation | ~1050 |
| `getOnboardingStatus` | query | ~1100 |

#### posts.ts (621 lines)
| Export | Type | Line |
|--------|------|------|
| `getFeedPosts` | query | ~30 |
| `getPostById` | query | ~100 |
| `createPost` | mutation | ~150 |
| `deletePost` | mutation | ~260 |
| `hasUserLikedPost` | query | ~340 |
| `likePost` | mutation | ~370 |
| `unlikePost` | mutation | ~430 |
| `getUnifiedFeed` | query | ~480 |

#### comments.ts (328 lines)
| Export | Type | Line |
|--------|------|------|
| `getPostComments` | query | ~20 |
| `getCommentReplies` | query | ~80 |
| `createComment` | mutation | ~120 |
| `deleteComment` | mutation | ~250 |

#### reactions.ts (339 lines)
| Export | Type | Line |
|--------|------|------|
| `addReaction` | mutation | ~20 |
| `removeReaction` | mutation | ~100 |
| `getReactions` | query | ~170 |
| `getUserReaction` | query | ~220 |
| `getReactionUsers` | query | ~260 |

#### follows.ts (~200 lines)
| Export | Type | Line |
|--------|------|------|
| `followUser` | mutation | ~20 |
| `unfollowUser` | mutation | ~80 |
| `isFollowing` | query | ~130 |
| `getFollowers` | query | ~150 |
| `getFollowing` | query | ~180 |

#### bookmarks.ts (~230 lines)
| Export | Type | Line |
|--------|------|------|
| `addBookmark` | mutation | ~20 |
| `removeBookmark` | mutation | ~60 |
| `getBookmarks` | query | ~90 |
| `getCollections` | query | ~140 |
| `isBookmarked` | query | ~170 |
| `getBookmarkDetails` | query | ~190 |

#### notifications.ts (369 lines)
| Export | Type | Line |
|--------|------|------|
| `createNotification` | internalMutation | ~20 |
| `getNotifications` | query | ~80 |
| `markAsRead` | mutation | ~150 |
| `markAllAsRead` | mutation | ~180 |
| `getUnreadCount` | query | ~220 |
| `deleteNotification` | mutation | ~260 |
| `getRecentNotifications` | query | ~300 |

#### messages.ts (514 lines)
| Export | Type | Line |
|--------|------|------|
| `sendMessage` | mutation | ~20 |
| `getMessages` | query | ~120 |
| `deleteMessage` | mutation | ~200 |
| `markAsRead` | mutation | ~250 |
| `editMessage` | mutation | ~300 |
| `getReadReceipts` | query | ~360 |
| `searchMessages` | query | ~400 |
| `reactToMessage` | mutation | ~450 |

#### conversations.ts (985 lines)
| Export | Type | Line |
|--------|------|------|
| `getOrCreateConversation` | mutation | ~20 |
| `getConversations` | query | ~100 |
| `getConversation` | query | ~200 |
| `muteConversation` | mutation | ~280 |
| `deleteConversation` | mutation | ~320 |
| `getTotalUnreadCount` | query | ~380 |
| `searchConversations` | query | ~430 |
| `createGroup` | mutation | ~500 |
| `addGroupMember` | mutation | ~580 |
| `removeGroupMember` | mutation | ~650 |
| `leaveGroup` | mutation | ~710 |
| `updateGroupInfo` | mutation | ~770 |
| `promoteToAdmin` | mutation | ~820 |
| `demoteFromAdmin` | mutation | ~860 |
| `pinMessage` | mutation | ~900 |
| `getPinnedMessages` | query | ~950 |

#### communities.ts (676 lines)
| Export | Type | Line |
|--------|------|------|
| `createCommunity` | mutation | ~30 |
| `joinCommunity` | mutation | ~100 |
| `requestToJoin` | mutation | ~150 |
| `approveJoinRequest` | mutation | ~200 |
| `leaveCommunity` | mutation | ~250 |
| `updateCommunity` | mutation | ~300 |
| `deleteCommunity` | mutation | ~360 |
| `addMember` | mutation | ~400 |
| `removeMember` | mutation | ~430 |
| `updateMemberRole` | mutation | ~480 |
| `getCommunity` | query | ~520 |
| `getCommunities` | query | ~540 |
| `getMyCommunities` | query | ~570 |
| `getCommunityMembers` | query | ~600 |
| `getCommunityPosts` | query | ~640 |

#### events.ts (506 lines)
| Export | Type | Line |
|--------|------|------|
| `createEvent` | mutation | ~20 |
| `updateEvent` | mutation | ~100 |
| `deleteEvent` | mutation | ~160 |
| `rsvpEvent` | mutation | ~200 |
| `sendEventReminders` | internalMutation | ~260 |
| `getEvent` | query | ~340 |
| `getUpcomingEvents` | query | ~370 |
| `getPastEvents` | query | ~400 |
| `getUserEvents` | query | ~430 |
| `getCommunityEvents` | query | ~460 |
| `getEventAttendees` | query | ~490 |

#### jobs.ts (386 lines)
| Export | Type | Line |
|--------|------|------|
| `postJob` | mutation | ~20 |
| `updateJob` | mutation | ~80 |
| `deleteJob` | mutation | ~130 |
| `applyToJob` | mutation | ~170 |
| `updateApplicationStatus` | mutation | ~230 |
| `getJob` | query | ~270 |
| `searchJobs` | query | ~300 |
| `getJobApplications` | query | ~340 |
| `getUserApplications` | query | ~370 |

#### marketplace.ts (~280 lines)
| Export | Type | Line |
|--------|------|------|
| `createListing` | mutation | ~30 |
| `updateListing` | mutation | ~80 |
| `deleteListing` | mutation | ~130 |
| `markAsSold` | mutation | ~160 |
| `getListings` | query | ~190 |
| `getListing` | query | ~230 |
| `getMyListings` | query | ~250 |

#### papers.ts (303 lines)
| Export | Type | Line |
|--------|------|------|
| `uploadPaper` | mutation | ~20 |
| `updatePaper` | mutation | ~80 |
| `deletePaper` | mutation | ~130 |
| `getPaper` | query | ~160 |
| `searchPapers` | query | ~190 |
| `getUserPapers` | query | ~240 |
| `getCollaborationOpportunities` | query | ~270 |

#### resources.ts (~250 lines)
| Export | Type | Line |
|--------|------|------|
| `uploadResource` | mutation | ~20 |
| `deleteResource` | mutation | ~70 |
| `rateResource` | mutation | ~100 |
| `downloadResource` | mutation | ~140 |
| `getResources` | query | ~170 |
| `getResource` | query | ~220 |

#### questions.ts (395 lines)
| Export | Type | Line |
|--------|------|------|
| `askQuestion` | mutation | ~20 |
| `deleteQuestion` | mutation | ~70 |
| `answerQuestion` | mutation | ~120 |
| `acceptAnswer` | mutation | ~180 |
| `vote` | mutation | ~230 |
| `getQuestions` | query | ~290 |
| `getQuestion` | query | ~330 |
| `incrementViewCount` | mutation | ~380 |

#### stories.ts (328 lines)
| Export | Type | Line |
|--------|------|------|
| `createStory` | mutation | ~20 |
| `getStories` | query | ~80 |
| `getStoryById` | query | ~150 |
| `viewStory` | mutation | ~200 |
| `getStoryViewers` | query | ~240 |
| `deleteStory` | mutation | ~270 |
| `deleteExpiredStoriesInternal` | internalMutation | ~300 |

#### polls.ts (~300 lines)
| Export | Type | Line |
|--------|------|------|
| `createPoll` | mutation | ~20 |
| `linkPollToPost` | mutation | ~80 |
| `vote` | mutation | ~120 |
| `deletePoll` | mutation | ~190 |
| `getPollResults` | query | ~230 |
| `getUserVote` | query | ~270 |

#### reposts.ts (~240 lines)
| Export | Type | Line |
|--------|------|------|
| `createRepost` | mutation | ~20 |
| `deleteRepost` | mutation | ~80 |
| `getReposts` | query | ~130 |
| `hasUserReposted` | query | ~170 |
| `getUserReposts` | query | ~200 |

#### search.ts (472 lines)
| Export | Type | Line |
|--------|------|------|
| `universalSearch` | query | ~20 |
| `searchPosts` | query | ~100 |
| `searchUsersEnhanced` | query | ~340 |
| `searchHashtags` | query | ~420 |
| *Helpers:* `editDistance`, `fuzzyMatch`, `searchRelevanceScore` | function | ~200–290 |

#### feed_ranking.ts (456 lines)
| Export | Type | Line |
|--------|------|------|
| `getRankedFeed` | query | ~100 |
| `getChronologicalFeed` | query | ~300 |
| `getTrendingFeed` | query | ~400 |
| *Helpers:* `recencyScore`, `relevanceScore`, `engagementScore`, `relationshipScore`, `computeFeedScore`, `freshnessBoost`, `enforceAuthorDiversity` | function | various |

#### suggestions.ts (539 lines)
| Export | Type | Line |
|--------|------|------|
| `computeSuggestionsForUser` | internalMutation | ~80 |
| `computeAllSuggestions` | internalMutation | ~140 |
| `getSuggestions` | query | ~430 |
| `dismissSuggestion` | mutation | ~490 |
| `refreshSuggestions` | mutation | ~510 |
| *Helpers:* `jaccardSimilarity`, `skillComplementarity`, `buildReasons`, `WEIGHTS` | exported | ~530 |

#### recommendations.ts (505 lines)
| Export | Type | Line |
|--------|------|------|
| `getRecommendedPosts` | query | ~20 |
| `getSimilarPosts` | query | ~120 |
| `getTrendingInSkill` | query | ~340 |
| `getPopularInUniversity` | query | ~430 |
| *Helper:* `freshnessBoost` | function | ~10 |

#### hashtags.ts (~270 lines)
| Export | Type | Line |
|--------|------|------|
| `extractHashtags` | function | ~10 |
| `normalizeHashtag` | function | ~22 |
| `linkHashtagsToPost` | async function | ~30 |
| `getTrending` | query | ~85 |
| `getPostsByHashtag` | query | ~110 |
| `searchHashtags` | query | ~175 |
| `updateTrendingScores` | internalMutation | ~210 |
| `getHashtagStats` | query | ~250 |

#### gamification.ts (~290 lines)
| Export | Type | Line |
|--------|------|------|
| `REPUTATION_RULES` | const | ~25 |
| `calculateLevel` | function | ~40 |
| `ACHIEVEMENT_DEFINITIONS` | const | ~50 |
| `awardReputation` | internalMutation | ~75 |
| `unlockAchievement` | internalMutation | ~100 |
| `checkAchievements` | internalMutation | ~130 |
| `getAchievements` | query | ~180 |
| `getLeaderboard` | query | ~210 |
| `getMyReputation` | query | ~260 |

#### subscriptions.ts (~280 lines)
| Export | Type | Line |
|--------|------|------|
| `PRO_FEATURES` | const | ~25 |
| `PRICING` | const | ~35 |
| `upgradeToPro` | mutation | ~45 |
| `cancelPro` | mutation | ~100 |
| `handleStripeWebhook` | internalMutation | ~140 |
| `checkProStatus` | query | ~190 |
| `isUserPro` | query | ~240 |

#### ads.ts (~260 lines)
| Export | Type | Line |
|--------|------|------|
| `createAd` | mutation | ~80 |
| `updateAd` | mutation | ~120 |
| `deleteAd` | mutation | ~150 |
| `recordImpression` | mutation | ~170 |
| `recordClick` | mutation | ~200 |
| `getAds` | query | ~220 |
| `getAdAnalytics` | query | ~250 |
| *Helpers:* `validateAdTitle`, `validateAdContent`, `validateBudget`, `validateLinkUrl`, `calcCtr`, `matchesTargeting` | function | ~25–65 |

#### portfolio.ts (~300 lines)
| Export | Type | Line |
|--------|------|------|
| `addProject` | mutation | ~25 |
| `updateProject` | mutation | ~70 |
| `deleteProject` | mutation | ~130 |
| `getProjects` | query | ~145 |
| `addTimelineItem` | mutation | ~160 |
| `deleteTimelineItem` | mutation | ~190 |
| `getTimeline` | query | ~205 |
| `getContributionData` | query | ~220 |

#### presence.ts (370 lines)
| Export | Type | Line |
|--------|------|------|
| `setTyping` | mutation | ~30 |
| `getTypingUsers` | query | ~80 |
| `clearStaleTyping` | internalMutation | ~115 |
| `cleanupTypingIndicators` | internalMutation | ~140 |
| `updateStatus` | mutation | ~165 |
| `setCustomStatus` | mutation | ~190 |
| `heartbeat` | mutation | ~215 |
| `getOnlineUsers` | query | ~240 |
| `getUserPresence` | query | ~290 |
| `updateOnlineStatusVisibility` | mutation | ~355 |

#### calls.ts (466 lines)
| Export | Type | Line |
|--------|------|------|
| `initiateCall` | mutation | ~30 |
| `acceptCall` | mutation | ~100 |
| `rejectCall` | mutation | ~150 |
| `endCall` | mutation | ~200 |
| `getCallHistory` | query | ~320 |
| `getActiveCall` | query | ~370 |
| `getIncomingCalls` | query | ~430 |

#### media.ts (~300 lines)
| Export | Type | Line |
|--------|------|------|
| `generateUploadUrl` | mutation | ~35 |
| `getFileUrl` | query | ~100 |
| `deleteUpload` | mutation | ~120 |
| `resolveStorageUrls` | mutation | ~145 |
| `fetchLinkPreview` | action | ~170 |
| *Helpers:* `extractMetaContent`, `extractTitle`, `escapeRegex`, `decodeHtmlEntities` | function | ~250–290 |
| *Constants:* `IMAGE_TYPES`, `VIDEO_TYPES`, `FILE_TYPES`, `MAX_IMAGE_SIZE`, `MAX_VIDEO_SIZE`, `MAX_FILE_SIZE`, `MAX_IMAGES_PER_POST` | const | ~5–18 |

#### matching.ts (345 lines)
| Export | Type | Line |
|--------|------|------|
| `skillOverlap` | function | ~15 |
| `complementarity` | function | ~25 |
| `experienceLevelValue` | function | ~40 |
| `expertScore` | function | ~55 |
| `partnerScore` | function | ~75 |
| `findExperts` | query | ~100 |
| `findStudyPartners` | query | ~175 |
| `findMentors` | query | ~250 |

#### skill_endorsements.ts (~240 lines)
| Export | Type | Line |
|--------|------|------|
| `endorseSkill` | mutation | ~15 |
| `removeEndorsement` | mutation | ~75 |
| `getEndorsements` | query | ~105 |
| `getMyEndorsements` | query | ~200 |

#### pushNotifications.ts (~280 lines)
| Export | Type | Line |
|--------|------|------|
| `subscribeToPush` | mutation | ~115 |
| `unsubscribeFromPush` | mutation | ~145 |
| `updateEmailPreferences` | mutation | ~165 |
| `getUserSubscriptions` | query | ~185 |
| `getEmailPreferences` | query | ~210 |
| *Helpers:* `validatePushSubscription`, `validateEmailFrequency`, `buildPushPayload`, `shouldSendDigest`, `formatDigestSubject` | function | ~30–100 |

#### http.ts (~180 lines)
| Export | Type | Line |
|--------|------|------|
| `default` (httpRouter) | httpRouter | ~180 |
| Clerk webhook handler (`POST /clerk-webhook`) | httpAction | ~65 |
| CORS preflight (`OPTIONS /clerk-webhook`) | httpAction | ~50 |

#### crons.ts (~50 lines)
| Export | Type | Line |
|--------|------|------|
| `default` (cronJobs) | — | ~45 |
| Cron: delete expired stories | interval: 1h | ~12 |
| Cron: compute friend suggestions | interval: 6h | ~20 |
| Cron: send event reminders | interval: 1h | ~28 |
| Cron: cleanup typing indicators | interval: 5m | ~36 |

#### monitoring.ts (~180 lines)
| Export | Type | Line |
|--------|------|------|
| `getSystemStats` | query | ~7 |
| `getTopContributors` | query | ~80 |
| `getRecentIssues` | query | ~120 |
| `getPerformanceMetrics` | query | ~135 |

#### Utility Files (no Convex functions)
| File | Exports | Lines |
|------|---------|-------|
| `logger.ts` | `createLogger`, `Logger`, `LogLevel`, `LogContext` | 102 |
| `sanitize.ts` | `sanitizeText`, `sanitizeMarkdown`, `isValidSafeUrl` | ~130 |
| `mentionUtils.ts` | `MENTION_REGEX`, `extractMentions` | ~40 |
| `math_utils.ts` | `jaccardSimilarity` | ~28 |
| `validation_constants.ts` | `POST_MAX_LENGTH`, `COMMENT_MAX_LENGTH`, etc. (14 constants) | ~35 |

### Summary Counts

- **Queries:** ~75
- **Mutations:** ~75
- **Internal Mutations:** ~10
- **Actions:** 1 (`media.fetchLinkPreview`)
- **HTTP routes:** 2 (POST + OPTIONS `/clerk-webhook`)
- **Cron jobs:** 4
- **Utility functions (non-Convex):** ~35

---

## C. Auth Audit

### Authentication Pattern

All authenticated functions follow the same pattern:
```ts
const identity = await ctx.auth.getUserIdentity()
if (!identity) throw new Error("Unauthorized")
const user = await ctx.db.query("users")
  .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
  .unique()
```

Many files duplicate this as a local `getAuthUser()` or `getCurrentUser()` helper. There is **no shared auth helper module** — each file has its own copy.

### Functions Missing Auth Checks

| Function | File | Severity | Notes |
|----------|------|----------|-------|
| `getReactions` | reactions.ts:~170 | Low | Returns reactions without requiring login. Public data, but inconsistent with other queries. |
| `getReactionUsers` | reactions.ts:~260 | Low | Same — no auth required. |
| `getHashtagStats` | hashtags.ts:~250 | Low | No auth check. |
| `getTrending` | hashtags.ts:~85 | Low | No auth check. |
| `getPostsByHashtag` | hashtags.ts:~110 | Low | No auth check. |
| `getSystemStats` | monitoring.ts:~7 | **HIGH** | No auth check — exposes system metrics to unauthenticated users. |
| `getTopContributors` | monitoring.ts:~80 | **HIGH** | No auth check — exposes user data. |
| `getPerformanceMetrics` | monitoring.ts:~135 | **HIGH** | No auth check — exposes operational data. |
| `getRecentIssues` | monitoring.ts:~120 | Medium | No auth check, but currently returns `[]`. |
| `getAds` | ads.ts:~220 | Low | Intentionally unauthenticated (public ads). |
| `getAchievements` | gamification.ts:~180 | Low | Takes `userId` arg — public data. |
| `isUserPro` | subscriptions.ts:~240 | Low | Public status check. |

### Authorization Missing / Insufficient

| Function | File | Issue |
|----------|------|-------|
| `monitoring.getSystemStats` | monitoring.ts:7 | **No admin role check.** Any user (or public) can view system stats. Should require admin role. |
| `monitoring.getTopContributors` | monitoring.ts:80 | Same — no admin gate. |
| `monitoring.getPerformanceMetrics` | monitoring.ts:135 | Same — no admin gate. |
| `ads.updateAd` | ads.ts:~120 | Uses `.toString()` for ID comparison instead of direct equality. |
| `ads.deleteAd` | ads.ts:~150 | Same `.toString()` comparison. |
| `communities.addMember` | communities.ts:~400 | Only checks if adder is admin/owner, but doesn't verify the target user exists or consents. |
| `media.deleteUpload` | media.ts:~120 | **No ownership verification.** Any authenticated user can delete any storage file if they know the `storageId`. |
| `questions.incrementViewCount` | questions.ts:~380 | Authenticated but no rate limiting — a user can inflate view counts trivially. |
| `resources.rateResource` | resources.ts:~100 | No per-user rating tracking — same user can rate unlimited times. |

---

## D. Data Integrity Risks

### 1. Race Conditions on Counter Fields

**Severity: HIGH**

Every counter update in the codebase uses a read-then-write pattern:
```ts
const current = await ctx.db.get(id)
await ctx.db.patch(id, { count: current.count + 1 })
```

Concurrent mutations can cause lost updates. Affected counters:

| Counter | Table | File | Functions |
|---------|-------|------|-----------|
| `likeCount` | posts | posts.ts | `likePost`, `unlikePost` |
| `commentCount` | posts | comments.ts | `createComment`, `deleteComment` |
| `shareCount` | posts | reposts.ts | `createRepost`, `deleteRepost` |
| `reactionCounts.*` | posts, comments | reactions.ts | `addReaction`, `removeReaction` |
| `followerCount` | users | follows.ts | `followUser`, `unfollowUser` |
| `followingCount` | users | follows.ts | `followUser`, `unfollowUser` |
| `memberCount` | communities | communities.ts | `joinCommunity`, `leaveCommunity`, `addMember`, etc. |
| `attendeeCount` | events | events.ts | `rsvpEvent` |
| `applicantCount` | jobs | jobs.ts | `applyToJob` |
| `postCount` | hashtags | hashtags.ts | `linkHashtagsToPost` |
| `totalVotes`, `options[n].voteCount` | polls | polls.ts | `vote` |
| `upvotes`, `downvotes` | questions, answers | questions.ts | `vote` |
| `answerCount` | questions | questions.ts | `answerQuestion` |
| `viewCount` | questions, stories | questions.ts, stories.ts | `incrementViewCount`, `viewStory` |
| `rating`, `ratingCount` | resources | resources.ts | `rateResource` |
| `downloadCount` | resources | resources.ts | `downloadResource` |
| `impressions`, `clicks` | ads | ads.ts | `recordImpression`, `recordClick` |
| `citationCount` | papers | papers.ts | (not incremented anywhere!) |
| `replyCount` | comments | comments.ts | `createComment` |

> **Note:** Convex serializes mutations on overlapping document reads, so true "lost updates" are rare, but concurrent writes to the same document will cause OCC retries and potential performance issues under load.

### 2. Cascade Deletion Gaps

| Delete Operation | File | Missing Cleanup |
|-----------------|------|-----------------|
| `deletePost` | posts.ts:~260 | Does **not** delete: `reactions` targeting the post, `reposts` of the post, `bookmarks` for the post, `postHashtags` linking the post, `pollVotes` for the post's poll. Only deletes comments, likes, and the poll. |
| `deleteAccount` | users.ts:~950 | Deletes posts/comments/follows/likes/reactions/notifications/conversations/stories/bookmarks/reposts/suggestions. Does **not**: update `followerCount`/`followingCount` on other users, delete `skillEndorsements` (given or received), delete `paperAuthors` entries, delete `jobApplications`, delete `communityMembers` records, delete `eventRSVPs`, delete `pushSubscriptions`, delete `achievements`, delete `subscriptions`, delete `ads`/`adImpressions`/`adClicks`, delete `projects`/`timeline`, delete `pollVotes`, delete `questionVotes`, delete `listings`. |
| `deleteCommunity` | communities.ts:~360 | Deletes `communityMembers` but does **not** null-out `communityId` on posts or delete events linked to the community. |
| `deleteQuestion` | questions.ts:~70 | Deletes `answers` and `questionVotes` with `targetType: "question"`. Does **not** delete `questionVotes` targeting the answers (`targetType: "answer"`). |
| `deletePaper` | papers.ts:~130 | Deletes `paperAuthors` but does not clean up any references from other tables. |

### 3. Invariant Violations

| Issue | Location | Description |
|-------|----------|-------------|
| `deleteAccount` follower counts | users.ts:~950 | When user A is deleted, users who follow A still have inflated `followingCount`, and users that A follows still have inflated `followerCount`. |
| `reactToMessage` type mismatch | messages.ts:~450 | Stores message reactions with `targetType: "comment"` — semantically wrong. Should be `"message"` (but schema doesn't define it). |
| `sendMessage` notification type | messages.ts:~100 | DM notifications use `type: "mention"` instead of a proper `"message"` type. |
| Event notifications wrong type | events.ts:~260 | Event reminder notifications use `type: "comment"` instead of an `"event_reminder"` type. |
| `rateResource` allows duplicates | resources.ts:~100 | No per-user rating tracking. A user can call `rateResource` repeatedly to manipulate the average. |

### 4. Full Table Scans (Performance)

**Severity: MEDIUM-HIGH at scale**

| Function | File | Pattern | Rows Scanned |
|----------|------|---------|-------------|
| `getUserByUsername` fallback | users.ts:~370 | `ctx.db.query("users").collect()` | All users |
| `getUserByIdOrUsername` fallback | users.ts:~430 | `ctx.db.query("users").collect()` | All users |
| `searchUsers` | users.ts:~250 | `.take(500)` then filter | 500 users |
| `searchHashtags` | hashtags.ts:~175 | `ctx.db.query("hashtags").collect()` | All hashtags |
| `searchJobs` | jobs.ts:~300 | Full table scan with filter | All jobs |
| `searchPapers` | papers.ts:~190 | Full table scan with filter | All papers |
| `getQuestions` | questions.ts:~290 | Full table scan | All questions |
| `getLeaderboard` | gamification.ts:~210 | `ctx.db.query("users").collect()` | All users |
| `getOnlineUsers` | presence.ts:~240 | `ctx.db.query("users").collect()` | All users |
| `getSystemStats` | monitoring.ts | 8 separate `.collect()` calls | All posts, users, comments, messages, communities, reactions, bookmarks |
| `getTopContributors` | monitoring.ts:~80 | `ctx.db.query("posts").collect()` | All posts |
| `updateTrendingScores` | hashtags.ts:~210 | `ctx.db.query("hashtags").collect()` + nested queries per hashtag | All hashtags × associated links |
| `computeSuggestionsForUser` | suggestions.ts | Multiple `.collect()` and nested queries per follower | O(followers × their-followers) |
| `findExperts` / `findStudyPartners` / `findMentors` | matching.ts | `ctx.db.query("users").take(1000)` | 1000 users |
| `getContributionData` | portfolio.ts:~220 | Collects all user posts + comments, then filters in JS | All user posts + comments |
| `getTrending` | hashtags.ts:~85 | Full table scan with date filter | All hashtags |
| `getMessages` | messages.ts:~120 | Collects ALL messages for conversation, then slices | All messages in conversation |
| `getConversations` unread counts | conversations.ts:~100 | For each conversation, collects all messages to count unread | N conversations × M messages each |
| `getTotalUnreadCount` | conversations.ts:~380 | Same N×M pattern as above | All conversations × all messages |

### 5. N+1 Query Patterns

| Function | File | Description |
|----------|------|-------------|
| `getConversations` | conversations.ts:~100 | For each conversation: fetch participants, fetch last message, count unread messages. |
| `getTotalUnreadCount` | conversations.ts:~380 | For each conversation: fetch all messages, filter unread. |
| `getRankedFeed` | feed_ranking.ts:~100 | For each post: fetch author, fetch follow relationship, fetch reactions. |
| `getChronologicalFeed` | feed_ranking.ts:~300 | For each post + repost: fetch author, fetch reposter, fetch original post. |
| `getTrendingFeed` | feed_ranking.ts:~400 | For each post: fetch author. |
| `getRecommendedPosts` | recommendations.ts:~20 | For each post: fetch author. |
| `findExperts` / `findMentors` | matching.ts | For each candidate: query `skillEndorsements`. |
| `computeSuggestionsForUser` | suggestions.ts | For each followed user: query their follows. For each post: query reactions and comments. |
| `getEndorsements` | skill_endorsements.ts:~105 | For each endorser (top 3 per skill): `ctx.db.get(endorserId)`. |

---

## E. Missing Features / Incomplete Implementations

### 1. Gamification Not Wired

`gamification.awardReputation`, `gamification.unlockAchievement`, and `gamification.checkAchievements` are `internalMutation` functions. However, **no mutation in the codebase calls them.** The gamification system is fully defined but never triggered:

- `posts.createPost` does not call `awardReputation("post_created")`
- `comments.createComment` does not call `awardReputation("comment_created")`
- `reactions.addReaction` does not call `awardReputation("receive_like")`
- `questions.acceptAnswer` does not call `awardReputation("answer_accepted")`
- `papers.uploadPaper` does not call `awardReputation("paper_uploaded")`
- `resources.uploadResource` does not call `awardReputation("resource_uploaded")`

### 2. `updateTrendingScores` Not in Crons

`hashtags.updateTrendingScores` is an `internalMutation` but is **not registered** in `crons.ts`. The `trendingScore` field on hashtags is always 0 (only set at insert).

### 3. `clearStaleTyping` Not in Crons

`presence.clearStaleTyping` is defined but only `presence.cleanupTypingIndicators` is registered in crons. `clearStaleTyping` sets `isTyping: false` on stale records while `cleanupTypingIndicators` deletes old records. Both exist but only one is used — the other is dead code.

### 4. Push Notifications Not Sent

`pushNotifications.ts` defines `buildPushPayload()` and `validatePushSubscription()` but there is **no function that actually sends push notifications**. The `subscribeToPush` mutation stores subscriptions, but no code reads them to deliver notifications. An `action` using the Web Push protocol is needed.

### 5. Email Digest Not Implemented

`pushNotifications.ts` defines `shouldSendDigest()` and `formatDigestSubject()` helpers, plus `updateEmailPreferences` stores the user's frequency setting. But **no cron job or function actually sends email digests.**

### 6. `papers.citationCount` Never Updated

The `papers` table has `citationCount: v.number()` (schema.ts:~510) initialized to 0 in `uploadPaper`, but no function ever increments it.

### 7. Stripe Integration Incomplete

`subscriptions.upgradeToPro` has a comment: "In production, verify stripeSessionId..." — the actual Stripe session verification is commented out. `handleStripeWebhook` queries by `by_stripe_sub` index but `stripeSubscriptionId` is never set during `upgradeToPro`. The webhook handler can't find any subscription records.

### 8. `likes` Table Unused by Frontend

The `likes` table and `likePost`/`unlikePost`/`hasUserLikedPost` functions exist in posts.ts but are **never called from the frontend**. The frontend exclusively uses `reactions.addReaction` / `reactions.removeReaction`. The likes system appears to be legacy code superseded by reactions.

### 9. Missing `editPost` Function

Users can create and delete posts, but there is no `editPost` mutation. The `posts` table has `updatedAt` field suggesting editing was planned.

### 10. Missing `editComment` Function

Similar to posts — `createComment` and `deleteComment` exist but no edit capability.

### 11. Missing Conversation Read Status for DMs

`messages.markAsRead` updates `conversationParticipants.lastReadMessageId` but `getMessages` doesn't use this to return read/unread status per message for the conversation view.

---

## F. Frontend Linkage

### Frontend → Backend Mapping

Every `useQuery` and `useMutation` call from the frontend is mapped below. Entries marked ✅ are in active use; ❌ indicates the backend function has no frontend consumer.

#### users.ts
| Backend Function | Frontend Consumer | Status |
|-----------------|-------------------|--------|
| `getCurrentUser` | BottomNav, StoryRow, layout, stories, portfolio | ✅ |
| `getUserById` | profile README (documentation only) | ⚠️ |
| `searchUsers` | GroupInfoPanel, CreateGroupModal, discover/page | ✅ |
| `searchUsersByUsername` | MentionAutocomplete | ✅ |
| `getUserByUsername` | — | ❌ |
| `getUserByIdOrUsername` | profile/[id]/page | ✅ |
| `updateProfile` | ProfileForm | ✅ |
| `addSkill` / `removeSkill` | SkillsManager | ✅ |
| `updateNotificationPreferences` | settings/page | ✅ |
| `generateUploadUrl` | ProfileForm | ✅ |
| `updateProfilePicture` | ProfileForm | ✅ |
| `exportUserData` | settings/privacy | ✅ |
| `deleteAccount` | settings/privacy | ✅ |
| `completeOnboarding` | onboarding/page | ✅ |
| `getOnboardingStatus` | onboarding/page, feed/page | ✅ |

#### posts.ts
| Backend Function | Frontend Consumer | Status |
|-----------------|-------------------|--------|
| `getFeedPosts` | — | ❌ Dead |
| `getPostById` | — (may be used elsewhere) | ⚠️ |
| `createPost` | PostComposer | ✅ |
| `deletePost` | PostCard | ✅ |
| `hasUserLikedPost` | — | ❌ Dead |
| `likePost` | — | ❌ Dead |
| `unlikePost` | — | ❌ Dead |
| `getUnifiedFeed` | FeedContainer, VirtualizedFeed | ✅ |

#### comments.ts
| Backend Function | Frontend Consumer | Status |
|-----------------|-------------------|--------|
| `getPostComments` | — (via CommentList) | ⚠️ |
| `getCommentReplies` | — | ⚠️ |
| `createComment` | CommentList, CommentComposer | ✅ |
| `deleteComment` | CommentList | ✅ |

#### reactions.ts
| Backend Function | Frontend Consumer | Status |
|-----------------|-------------------|--------|
| `addReaction` | ReactionPicker | ✅ |
| `removeReaction` | ReactionPicker | ✅ |
| `getReactions` | ReactionModal, ReactionPicker | ✅ |
| `getUserReaction` | ReactionPicker | ✅ |
| `getReactionUsers` | ReactionModal | ✅ |

#### follows.ts
| Backend Function | Frontend Consumer | Status |
|-----------------|-------------------|--------|
| `followUser` | ProfileHeader, SuggestedUsers, discover/suggested | ✅ |
| `unfollowUser` | ProfileHeader | ✅ |
| `isFollowing` | — (may be inlined in profile) | ⚠️ |
| `getFollowers` | — | ❌ |
| `getFollowing` | — | ❌ |

#### bookmarks.ts — All used ✅

#### notifications.ts
| Backend Function | Frontend Consumer | Status |
|-----------------|-------------------|--------|
| `createNotification` | — (internal only) | N/A |
| `getNotifications` | notifications/page | ✅ |
| `markAsRead` | NotificationItem | ✅ |
| `markAllAsRead` | notifications/page | ✅ |
| `getUnreadCount` | NotificationBell, notifications/page | ✅ |
| `deleteNotification` | — | ❌ |
| `getRecentNotifications` | NotificationBell | ✅ |

#### messages.ts
| Backend Function | Frontend Consumer | Status |
|-----------------|-------------------|--------|
| `sendMessage` | MessageComposer | ✅ |
| `getMessages` | ChatArea | ✅ |
| `deleteMessage` | MessageBubble | ✅ |
| `markAsRead` | ChatArea | ✅ |
| `editMessage` | MessageBubble | ✅ |
| `getReadReceipts` | — | ❌ |
| `searchMessages` | ChatArea | ✅ |
| `reactToMessage` | — | ❌ |

#### conversations.ts — All used ✅ (16 functions, all have frontend consumers)

#### communities.ts
| Backend Function | Frontend Consumer | Status |
|-----------------|-------------------|--------|
| `createCommunity` | communities/new | ✅ |
| `joinCommunity` | CommunityCard, c/[slug] | ✅ |
| `requestToJoin` | — | ❌ |
| `approveJoinRequest` | — | ❌ |
| `leaveCommunity` | CommunityCard, c/[slug] | ✅ |
| `updateCommunity` | c/[slug]/settings | ✅ |
| `deleteCommunity` | c/[slug]/settings | ✅ |
| `addMember` | — | ❌ |
| `removeMember` | c/[slug]/members | ✅ |
| `updateMemberRole` | c/[slug]/members | ✅ |
| `getCommunity` | — (via c/[slug]) | ⚠️ |
| `getCommunities` | communities/page | ✅ |
| `getMyCommunities` | communities/page | ✅ |
| `getCommunityMembers` | — | ⚠️ |
| `getCommunityPosts` | — | ⚠️ |

#### events.ts
| Backend Function | Frontend Consumer | Status |
|-----------------|-------------------|--------|
| `createEvent` | CreateEventModal | ✅ |
| `updateEvent` | — | ❌ |
| `deleteEvent` | — | ❌ |
| `rsvpEvent` | events/[id] | ✅ |
| `getUpcomingEvents` | events/page | ✅ |
| `getPastEvents` | events/page | ✅ |
| `getUserEvents` | events/page | ✅ |
| `getCommunityEvents` | — | ❌ |
| `getEventAttendees` | events/[id] | ✅ |

#### Remaining files — see pattern above. Key unused functions:

| Backend Function | File | Status |
|-----------------|------|--------|
| `reposts.getReposts` | reposts.ts | ❌ |
| `reposts.hasUserReposted` | reposts.ts | ❌ |
| `reposts.getUserReposts` | reposts.ts | ❌ |
| `feed_ranking.getChronologicalFeed` | feed_ranking.ts | ❌ |
| `recommendations.getSimilarPosts` | recommendations.ts | ❌ |
| `subscriptions.isUserPro` | subscriptions.ts | ❌ |
| `monitoring.getRecentIssues` | monitoring.ts | ❌ |
| `presence.clearStaleTyping` | presence.ts | ❌ |
| `skill_endorsements.removeEndorsement` | skill_endorsements.ts | ❌ |
| `skill_endorsements.getMyEndorsements` | skill_endorsements.ts | ❌ |
| `users.getUserByUsername` | users.ts | ❌ |
| `notifications.deleteNotification` | notifications.ts | ❌ |
| `messages.getReadReceipts` | messages.ts | ❌ |
| `messages.reactToMessage` | messages.ts | ❌ |
| `communities.requestToJoin` | communities.ts | ❌ |
| `communities.approveJoinRequest` | communities.ts | ❌ |
| `communities.addMember` | communities.ts | ❌ |
| `events.updateEvent` | events.ts | ❌ |
| `events.deleteEvent` | events.ts | ❌ |
| `events.getCommunityEvents` | events.ts | ❌ |
| `papers.getUserPapers` | papers.ts | ❌ |
| `marketplace.getMyListings` | marketplace.ts | ❌ |

---

## G. Dead / Unreferenced Code

### Completely Dead Backend Functions (no frontend consumer, no internal caller)

1. **`posts.getFeedPosts`** (posts.ts:~30) — Superseded by `getUnifiedFeed` and `feed_ranking.getRankedFeed`.
2. **`posts.hasUserLikedPost`** (posts.ts:~340) — Legacy like system, superseded by reactions.
3. **`posts.likePost`** (posts.ts:~370) — Same, writes to `likes` table that nothing reads.
4. **`posts.unlikePost`** (posts.ts:~430) — Same.
5. **`users.getUserByUsername`** (users.ts:~370) — Never called. `getUserByIdOrUsername` covers this use case.
6. **`presence.clearStaleTyping`** (presence.ts:~115) — Not in crons, not called anywhere. `cleanupTypingIndicators` handles cleanup instead.
7. **`monitoring.getRecentIssues`** (monitoring.ts:~120) — Returns empty array, placeholder only.
8. **`feed_ranking.getChronologicalFeed`** (feed_ranking.ts:~300) — Defined but frontend only uses `getRankedFeed` and `getTrendingFeed`.

### Dead Data

- **`likes` table** (schema.ts:127) — The entire table is orphaned. `likePost` writes to it but is never called from frontend. The `reactions` system has fully replaced it.
- **`posts.likeCount`** (schema.ts:87) — Labeled "Legacy" in a comment. Frontend and feed ranking read `reactionCounts` instead. However, `likePost`/`unlikePost` still update it, and some feed/search functions fall back to it when `reactionCounts` is missing.

### Duplicated Code

- **Auth helper** (`getAuthUser` / `getCurrentUser`): Duplicated in 15+ files. Should be extracted to a shared module.
- **`extractHashtags`**: Defined in `hashtags.ts:10` and also used in `posts.createPost` which calls `linkHashtagsToPost`.
- **`fuzzyMatch` in search.ts**: Implements edit-distance fuzzy matching. `matching.ts` uses `jaccardSimilarity` from `math_utils.ts` for a different purpose. No duplication, but naming overlap.
- **`recencyScore` / `freshnessBoost`**: Defined in both `feed_ranking.ts` and `recommendations.ts` with slightly different implementations.

---

## H. Security Concerns

### Critical

1. **Monitoring endpoints completely unprotected** — `monitoring.getSystemStats`, `getTopContributors`, `getPerformanceMetrics` (monitoring.ts:7, 80, 135) have no auth checks. Anyone can query system metrics. **Fix: Add auth check + admin role gate.**

2. **`media.deleteUpload` has no ownership check** (media.ts:~120) — Any authenticated user can delete any file from Convex storage if they know the `storageId`. The comment acknowledges this: "In production, maintain a separate table linking storageIds to uploaders." **Fix: Add a `media_uploads` table mapping `storageId` → `userId`.**

3. **`subscriptions.upgradeToPro` bypasses Stripe** (subscriptions.ts:~45) — The mutation activates Pro without verifying the `stripeSessionId`. The verification code is commented out. In production this lets any user self-upgrade for free. **Fix: Uncomment and implement Stripe session verification.**

### High

4. **No rate limiting on any mutation.** Particularly sensitive targets:
   - `questions.incrementViewCount` — view count inflation
   - `resources.rateResource` — duplicate ratings
   - `ads.recordImpression` — frequency cap is daily but still per-user-per-ad, no global rate limit
   - `presence.heartbeat` — called every 60s, acceptable but no abuse protection
   - `messages.sendMessage` — no throttle on message spam

5. **`ads.updateAd` uses `.toString()` for ID comparison** (ads.ts:~130) — `ad.advertiserId.toString() !== user._id.toString()`. While functionally equivalent to direct comparison in Convex, this is a code smell. Direct ID comparison (`ad.advertiserId === user._id`) is preferred but works only if both are the same reference. In Convex, IDs from `ctx.db.get()` are value-equal with `===`, making `.toString()` unnecessary.

### Medium

6. **XSS vectors in `comments.createComment` fallback** (comments.ts:~200) — Mention resolution falls back to `ctx.db.query("users").collect()`, iterating all users. The mention username is taken from user input and matched against DB records. While `sanitizeText` is applied to content, the fallback itself is a performance issue, not a direct XSS risk.

7. **`http.ts` CORS configuration** (http.ts:~13) — Includes `http://localhost:3000` and `http://localhost:3001` in development. The check uses `process.env.NODE_ENV` which may not be correctly set in the Convex runtime. **Fix: Use Convex environment variables.**

8. **`media.fetchLinkPreview` has SSRF potential** (media.ts:~170) — The action fetches arbitrary URLs. While it has a 5s timeout and protocol check, it doesn't block private/internal IP ranges (e.g., `169.254.x.x`, `10.x.x.x`, `192.168.x.x`, `127.0.0.1`). **Fix: Add IP blocklist or use a proxy.**

9. **`sanitize.ts` order-of-operations for `&` encoding** (sanitize.ts:~40) — The `&` → `&amp;` replacement runs after tag stripping. If tag stripping produces `&`, it will be double-encoded. This is technically safe but can produce `&amp;amp;` sequences. Minor.

### Low

10. **`pushNotifications.subscribeToPush`** (pushNotifications.ts:~115) — Validates the endpoint starts with `https://` but doesn't validate it's a valid push service URL. An attacker could register arbitrary HTTPS endpoints.

---

## I. Indexing Gaps

### Missing Indexes

| Query Pattern | File:Line | Current Behavior | Recommended Index |
|--------------|-----------|------------------|-------------------|
| `conversations` lookup for DMs between two users | conversations.ts:~30 | Scans all `conversationParticipants` for user, then filters. | Compound index on `conversationParticipants`: `["userId", "conversationId"]` already exists, but need to also look up by `conversationId + type="direct"` on conversations. |
| `reactions` by `userId + targetId + targetType` for existence check | reactions.ts:~30 | Uses `by_user_target` ✅ | OK |
| `skillEndorsements` by `userId` (without `skillName`) | matching.ts:~160, skill_endorsements.ts:~130 | Uses `.filter(q => q.eq(q.field("userId"), ...))` — full scan | Add index `by_user` on `["userId"]` (currently only `by_user_skill` which requires `skillName` for prefix match). |
| `messages` count for unread calculation | conversations.ts:~100 | Collects all messages in conversation, counts those after `lastReadAt` | Add index `by_conversation_createdAt` — already exists as `["conversationId", "createdAt"]`, but the code collects ALL then filters. Should use `.filter()` with the index range. |
| `questions` ordered by upvotes or answerCount | questions.ts:~290 | Full table scan + in-memory sort | Add indexes: `by_upvotes` on `["upvotes"]`, `by_answerCount` on `["answerCount"]` |
| `jobs` filtered by type, location, remote | jobs.ts:~300 | Full table scan with in-memory filter | Add indexes: `by_type` on `["type"]`, or use search index |
| `papers` filtered by tags | papers.ts:~190 | Full table scan | Consider search index on `tags` |
| `resources` filtered by subject | resources.ts:~170 | Uses `by_course` index, but `subject` filter is in memory | Add index `by_subject` on `["subject"]` |
| `adClicks` by user+ad | ads.ts:~200 | No dedup check, inserts every click | Add index `by_user_ad` on `["userId", "adId"]` (like `adImpressions` has). |
| `users` ordered by reputation | gamification.ts:~210 | Full table scan + sort by reputation | Add index `by_reputation` on `["reputation"]` on users table. |
| `hashtags` full scan for search | hashtags.ts:~175 | `ctx.db.query("hashtags").collect()` + prefix filter | Use the existing `by_tag` index with a range query, or add a Convex search index. |
| `users` full scan for online status | presence.ts:~240 | `ctx.db.query("users").collect()` + filter by `lastSeenAt` | The `by_lastSeenAt` index exists but is unused! Use `.withIndex("by_lastSeenAt")` with a range filter. |
| `posts` for community feed | communities.ts:~640 | Uses `by_community` index ✅ | OK |
| `conversations` for DM lookup | conversations.ts | `by_participant` index on array field — Convex array indexes match if ANY element matches, not exact array equality | Consider normalized participant lookup via `conversationParticipants` table (already done, but lookup is sequential). |

### Unused Indexes

| Index | Table | Notes |
|-------|-------|-------|
| `by_lastSeenAt` | users | Defined but never used in any query. `getOnlineUsers` does full table scan instead. |
| `by_trending_score` | hashtags | Defined but never used. `trendingScore` is never updated in production (cron not registered). |
| `by_post_count` | hashtags | Used only by `search.searchHashtags` (search.ts:~420). |

### Search Index Recommendations

Convex supports full-text search indexes. The following tables would benefit:

1. **`posts`**: Search on `content` field — currently uses fuzzy matching on `.take(200)` results.
2. **`users`**: Search on `name`, `username`, `bio` — currently prefix-matching on `.take(500)`.
3. **`papers`**: Search on `title`, `abstract`, `tags` — currently full table scan.
4. **`jobs`**: Search on `title`, `description`, `company` — currently full table scan.
5. **`questions`**: Search on `title`, `content`, `tags` — currently full table scan.
6. **`resources`**: Search on `title`, `description` — currently filtered by course index only.

---

## Summary of Top Priorities

### 🔴 Critical (fix immediately)

1. **Add auth + admin gate to `monitoring.ts`** — all 4 queries expose system data publicly.
2. **Add ownership check to `media.deleteUpload`** — any user can delete any file.
3. **Disable direct Pro activation** in `subscriptions.upgradeToPro` — users can self-upgrade without payment.

### 🟠 High (fix before scaling)

4. **Wire gamification system** — `awardReputation`/`unlockAchievement` are never called.
5. **Fix cascade deletions** — `deletePost` and `deleteAccount` leave orphaned records.
6. **Fix notification types** — events use `"comment"`, DMs use `"mention"`.
7. **Eliminate full table scans** — at least in `getLeaderboard`, `getOnlineUsers`, `getSystemStats`, `searchJobs`, `getQuestions`.
8. **Add `updateTrendingScores` to crons**.
9. **Remove or migrate `likes` table** — dead data.

### 🟡 Medium (quality improvements)

10. **Extract shared auth helper** to eliminate 15+ copies.
11. **Type `targetId` properly** in `reactions` and `questionVotes` tables.
12. **Add per-user rate tracking** for `rateResource`.
13. **Fix N+1 patterns** in conversations unread counts.
14. **Implement push notification delivery** — subscriptions are stored but never used.
15. **Use `by_lastSeenAt` index** in `getOnlineUsers` instead of full table scan.
16. **Add search indexes** for posts, users, papers, jobs, questions.

### 🟢 Low (nice to have)

17. Add `editPost` and `editComment` mutations.
18. Add `updatedAt` fields to tables that support editing.
19. Implement email digest sending.
20. Add SSRF protection to `fetchLinkPreview`.
21. Clean up dead functions (`getFeedPosts`, `likePost`, `unlikePost`, `hasUserLikedPost`, `getUserByUsername`, `clearStaleTyping`).
