# Campus Connect — Development TODO

> Actionable task list derived from FEATURE_ROADMAP.md
> Last Updated: February 18, 2026

---

## 📋 Quick Navigation

- [Phase 1 — Core Social (Weeks 1-6)](#phase-1--core-social-expansion-weeks-1-6)
- [Phase 2 — Real-Time Communication (Weeks 7-12)](#phase-2--real-time-communication-weeks-7-12)
- [Phase 3 — Content & Media (Weeks 13-18)](#phase-3--content--media-platform-weeks-13-18)
- [Phase 4 — AI & Recommendations (Weeks 19-24)](#phase-4--recommendation--ai-engines-weeks-19-24)
- [Phase 5 — Communities (Weeks 25-30)](#phase-5--community--groups-weeks-25-30)
- [Phase 6 — Academic Tools (Weeks 31-36)](#phase-6--professional--academic-tools-weeks-31-36)
- [Phase 7 — Monetization (Weeks 37-42)](#phase-7--monetization--growth-weeks-37-42)
- [Infrastructure & DevOps](#infrastructure--devops)

---

## Legend

- 🔴 **Critical** — Core functionality, high user impact
- 🟡 **High Priority** — Important but not blocking
- 🟢 **Medium Priority** — Nice to have, enhances experience
- 🔵 **Low Priority** — Future consideration
- ⏱️ **Effort**: S (Small: <1 week) | M (Medium: 1-2 weeks) | L (Large: 2-4 weeks) | XL (Extra Large: 4+ weeks)

---

## Phase 1 — Core Social Expansion (Weeks 1-6)

### 1.1 Reactions System 🔴 ⏱️ M ✅ COMPLETED

**Schema:**
- [x] Create `reactions` table in `convex/schema.ts`
  - [x] Add fields: userId, targetId, targetType, type, createdAt
  - [x] Add indexes: by_target, by_user_target

**Backend (Convex):**
- [x] Create `convex/reactions.ts`
  - [x] `addReaction` mutation — validate reaction type, prevent duplicates, upsert
  - [x] `removeReaction` mutation — authorization check
  - [x] `getReactions` query — for a post/comment, group by type with counts
  - [x] `getUserReaction` query — check what user reacted with

**Frontend:**
- [x] Create `src/components/posts/ReactionPicker.tsx`
  - [x] 6 reaction buttons: 👍 Like, ❤️ Love, 😂 Laugh, 😮 Wow, 😢 Sad, 🎓 Scholarly
  - [x] Animated hover/popup picker
  - [x] Show on hover for desktop, long-press for mobile
- [x] Update `PostCard.tsx`
  - [x] Replace like button with reaction picker
  - [x] Show reaction summary bar (top 3 emoji + count)
  - [x] Click summary → modal showing who reacted with what
- [x] Create `src/components/posts/ReactionModal.tsx` — list of users per reaction type

**Updates:**
- [x] Update `posts` table: add `reactionCounts` object
- [x] Update `comments` table: add `reactionCounts` object

**Tests:**
- [x] `src/components/posts/ReactionPicker.test.tsx` — interaction tests

---

### 1.2 Bookmarks / Save Posts 🟡 ⏱️ S ✅ COMPLETED

**Schema:**
- [x] Create `bookmarks` table in `convex/schema.ts`
  - [x] Add fields: userId, postId, collectionName, createdAt
  - [x] Add indexes: by_user, by_user_and_post, by_user_and_collection

**Backend:**
- [x] Create `convex/bookmarks.ts`
  - [x] `addBookmark` mutation — save post to collection (default: "Saved")
  - [x] `removeBookmark` mutation
  - [x] `getBookmarks` query — fetch user's bookmarks, paginated
  - [x] `getCollections` query — list unique collection names for user
  - [x] `isBookmarked` query — check if user bookmarked a post
  - [x] `getBookmarkDetails` query — get bookmark details

**Frontend:**
- [x] Create `src/app/(dashboard)/bookmarks/page.tsx`
  - [x] Collection tabs/filter
  - [x] Grid of bookmarked posts
  - [x] Empty state with CTA
- [x] Create `src/components/posts/BookmarkButton.tsx`
  - [x] Bookmark icon button with collection selector dropdown
  - [x] Toggle bookmark functionality
  - [x] Create new collection inline
- [x] Update `PostCard.tsx`
  - [x] Add bookmark button integration
- [x] Add "Bookmarks" to sidebar navigation (desktop and mobile)
- [x] Create `src/components/ui/dropdown-menu.tsx` — Radix UI wrapper

**Dependencies:**
- [x] Install `@radix-ui/react-dropdown-menu`

**Tests:**
- [x] `convex/bookmarks.test.ts` — comprehensive backend tests
- [x] `src/app/(dashboard)/bookmarks/page.test.tsx` — page component tests

---

### 1.3 Hashtags & Trending 🔴 ⏱️ L ✅ COMPLETED

**Schema:**
- [x] Create `hashtags` table
  - [x] Fields: tag (lowercase, normalized), postCount, lastUsedAt, trendingScore
  - [x] Indexes: by_tag, by_post_count, by_trending_score
- [x] Create `postHashtags` table (many-to-many)
  - [x] Fields: postId, hashtagId, createdAt
  - [x] Indexes: by_post, by_hashtag, by_hashtag_created

**Backend:**
- [x] Create `convex/hashtags.ts`
  - [x] `extractHashtags(content: string)` utility — regex to find #tags
  - [x] `linkHashtagsToPost()` internal function — create/update hashtags
  - [x] Update `posts.ts` → `createPost` mutation to extract & create hashtags
  - [x] `getTrending` query — top hashtags by post count in last 24h
  - [x] `getPostsByHashtag` query — paginated posts with a specific tag
  - [x] `searchHashtags` query — autocomplete for hashtag input
  - [x] `updateTrendingScores` mutation — for cron job (future)
  - [x] `getHashtagStats` query — hashtag details

**Frontend:**
- [x] Create `src/app/(dashboard)/hashtag/[tag]/page.tsx` — hashtag feed page
  - [x] Display hashtag name and post count
  - [x] Show posts using this hashtag
  - [x] Empty state
- [x] Create `src/components/trending/TrendingHashtags.tsx` widget
  - [x] Show top 10 trending hashtags with post counts
  - [x] Rank indicator for top 3
  - [x] Click → navigate to hashtag page
- [x] Add trending sidebar to feed page (desktop only)
- [x] Update `PostCard.tsx` — make hashtags in content clickable links
  - [x] Create `PostContent.tsx` component

**Utilities:**
- [x] `lib/hashtag-utils.ts`
  - [x] `normalizeHashtag(tag: string)` — lowercase, trim
  - [x] `extractHashtags(content: string)` — find all hashtags
  - [x] `parseHashtags(content: string)` — split into segments for rendering
  - [x] `getHashtagDisplay(tag: string)` — format with #
  - [x] `isValidHashtag(tag: string)` — validation

**PostComposer Enhancements:**
- [x] Update `PostComposer.tsx` with hashtag features
  - [x] Real-time syntax highlighting — hashtags shown in blue as user types
  - [x] Autocomplete dropdown — suggestions based on existing hashtags
  - [x] Keyboard navigation — ↑↓ to navigate suggestions, Enter to select
  - [x] Automatic hashtag insertion with proper cursor positioning
  - [x] Popularity display — show post count for each suggestion

**Tests:**
- [x] `convex/hashtags.test.ts` — comprehensive backend API tests
- [x] `lib/hashtag-utils.test.ts` — utility function tests with edge cases

---

### 1.4 Notification System 🔴 ⏱️ XL ✅ COMPLETED

**Schema:**
- [x] Create `notifications` table
  - [x] Fields: recipientId, actorId, type, referenceId, message, isRead, createdAt
  - [x] Indexes: by_recipient, by_recipient_unread, by_recipient_created

**Backend:**
- [x] Create `convex/notifications.ts`
  - [x] `createNotification` mutation — called by other mutations
  - [x] `getNotifications` query — paginated, with filters (All/Mentions/Reactions/Comments/Follows)
  - [x] `markAsRead` mutation — single notification with authorization
  - [x] `markAllAsRead` mutation — bulk update for user's notifications
  - [x] `getUnreadCount` query — real-time subscription for badge
  - [x] `deleteNotification` mutation — with authorization check
  - [x] `getRecentNotifications` query — limit 5 for dropdown
- [x] Update existing mutations to trigger notifications:
  - [x] `reactions.ts` → `addReaction` → notify post/comment author (via scheduler)
  - [x] `comments.ts` → `createComment` → notify post author (via scheduler)
  - [x] `follows.ts` → `followUser` → notify followed user (via scheduler)

**Frontend:**
- [x] Create `src/components/notifications/NotificationBell.tsx`
  - [x] Bell icon in navbar (desktop and mobile)
  - [x] Unread badge count (shows 9+ for >9, hidden when 0)
  - [x] Dropdown with recent 5 notifications on click
  - [x] "View All" link to notifications page
  - [x] Close on outside click
- [x] Create `src/app/(dashboard)/notifications/page.tsx`
  - [x] Page title with unread count badge
  - [x] Tabs: All / Mentions / Reactions / Comments / Follows
  - [x] Notification list with NotificationItem components
  - [x] "Mark all as read" button (only shows when unread > 0)
  - [x] Load more button with pagination (cursor-based)
  - [x] Empty states per filter type
- [x] Create `src/components/notifications/NotificationItem.tsx`
  - [x] Different icons per notification type (Heart, MessageCircle, AtSign, UserPlus, MessageSquare)
  - [x] Click → navigate to referenced post/profile and mark as read
  - [x] Unread indicator (blue dot on left)
  - [x] Timestamps with formatDistanceToNow
- [x] Add notification preferences to Settings page
  - [x] Toggle each notification type (Reactions, Comments, Mentions, New Followers)
  - [x] All defaultChecked (backend preferences not yet implemented)
- [x] Add NotificationBell to dashboard layout navbar
- [x] Add "Notifications" link to mobile navigation

**Tests:**
- [x] `convex/notifications.test.ts` — 11 backend tests (all passing)
- [x] `src/components/notifications/NotificationBell.test.tsx` — 6 component tests (all passing)
- [x] `src/app/(dashboard)/notifications/page.test.tsx` — 11 page tests (all passing)
- [x] Update layout tests to mock NotificationBell component

---

### 1.5 Mentions & Tagging 🟡 ⏱️ M ✅ COMPLETED

**Backend:**
- [x] Create `lib/mention-utils.ts`
  - [x] `extractMentions(content: string)` — regex to find @username
  - [x] `parseMentionsToLinks(content: string)` — convert to clickable links
- [x] Create `convex/mention-utils.ts` (backend version for Convex functions)
- [x] Add `username` field to `users` schema with index
- [x] Update `posts.ts` → `createPost` mutation
  - [x] Extract mentions, trigger notifications for mentioned users
- [x] Update `comments.ts` → `createComment` mutation (same)
- [x] Create `convex/users.ts` → `searchUsersByUsername` query for autocomplete
- [x] Create `convex/users.ts` → `getUserByUsername` query for resolving @mentions

**Frontend:**
- [x] Create `src/components/posts/MentionAutocomplete.tsx`
  - [x] Detect `@` character in textarea
  - [x] Show dropdown with matching users (search as you type)
  - [x] Arrow keys + Enter to select
  - [x] Insert `@username` on selection
- [x] Update `PostComposer.tsx` — integrate mention autocomplete
  - [x] Real-time syntax highlighting for mentions (blue text)
  - [x] Autocomplete dropdown
  - [x] Keyboard navigation
- [x] Update `CommentComposer.tsx` — integrate mention autocomplete
- [x] Update `PostContent.tsx` (used by PostCard) — render mentions as blue clickable links to /profile/{username}
- [x] Update `CommentList.tsx` — render mentions as blue clickable links

**Styling:**
- [x] Blue text color for mentions: `text-blue-600 dark:text-blue-400`
- [x] Hover underline

**Tests:**
- [x] `lib/mention-utils.test.ts` — 35 passing tests (regex, extraction, parsing, validation)
- [x] `src/components/posts/MentionAutocomplete.test.tsx` — comprehensive component tests

**Production:**
- [x] `npx convex dev --once` — added username field and by_username index
- [x] `npx next build` — successful compilation, all types valid

---

### 1.6 Share / Repost 🟡 ⏱️ M ✅ COMPLETED

**Schema:**
- [x] Create `reposts` table
  - [x] Fields: userId, originalPostId, quoteContent, createdAt
  - [x] Indexes: by_user, by_original_post, by_user_and_post, by_createdAt
- [x] Add `shareCount` field to `posts` table (initialized to 0 for new posts)

**Backend:**
- [x] Create `convex/reposts.ts`
  - [x] `createRepost` mutation — plain repost or quote post (500 char limit)
  - [x] `deleteRepost` mutation — own reposts only, decrements shareCount
  - [x] `getReposts` query — get reposts of a post with user data
  - [x] `hasUserReposted` query — check if user reposted
  - [x] `getUserReposts` query — get all reposts by a user
- [x] Update `posts.ts` → added `getUnifiedFeed` query to include reposts in feed
- [x] Update `bookmarks.ts` and `hashtags.ts` to include shareCount in responses

**Frontend:**
- [x] Update `PostCard.tsx`
  - [x] Add share button with count (shows when shareCount > 0)
  - [x] Share dropdown: "Repost" | "Quote Post" | "Copy Link" | "Share via..." (Web Share API)
  - [x] Direct repost functionality (no modal)
  - [x] Success toast notification after sharing
  - [x] Click-outside detection for dropdown
- [x] Create `src/components/posts/RepostModal.tsx`
  - [x] For quote posts — show original post preview + textarea for comment
  - [x] Character limit: 500 chars with counter
  - [x] Two buttons: "Repost" (plain) and "Quote Post" (with comment)
  - [x] Loading states, error handling
- [x] Update `FeedContainer.tsx` to use unified feed
  - [x] Display reposts with "🔁 [User] reposted" header
  - [x] Show quote content if present
  - [x] Show original post card nested
  - [x] Merge posts and reposts chronologically

**Tests:**
- [x] `convex/reposts.test.ts` — 28 passing tests (validation, state management, feed integration)
- [x] `src/components/posts/RepostModal.test.tsx` — 11 passing tests (rendering, character limits, actions)

**Production:**
- [x] Renamed `convex/mention-utils.ts` to `convex/mentionUtils.ts` (Convex naming requirement)
- [x] Updated imports in `posts.ts` and `comments.ts`
- [x] `npx convex dev --once` — added reposts table with 4 indexes, shareCount field
- [x] `npx next build` — successful production build

---

## Phase 2 — Real-Time Communication (Weeks 7-12)

### 2.1 Direct Messaging 🔴 ⏱️ XL ✅ COMPLETED

**Schema:**
- [x] Create `conversations` table
  - [x] Fields: participantIds (sorted array), lastMessageId, lastMessageAt, lastMessagePreview, createdAt
  - [x] Indexes: by_last_message, by_participant
- [x] Create `messages` table
  - [x] Fields: conversationId, senderId, content, messageType, attachmentUrl, attachmentName, replyToId, status, isDeleted, deletedForUserIds, isPinned, createdAt, updatedAt
  - [x] Indexes: by_conversation, by_sender
- [x] Create `conversationParticipants` table
  - [x] Fields: conversationId, userId, role, lastReadMessageId, lastReadAt, isMuted, joinedAt
  - [x] Indexes: by_user, by_conversation, by_user_conversation
- [x] Create `typingIndicators` table
  - [x] Fields: conversationId, userId, isTyping, updatedAt
  - [x] Indexes: by_conversation, by_user_conversation

**Backend:**
- [x] Create `convex/conversations.ts`
  - [x] `getOrCreateConversation` mutation — find existing DM or create new with participant records
  - [x] `getConversations` query — list user's conversations with preview, unread count, other user info
  - [x] `getConversation` query — full conversation details with participant info
  - [x] `muteConversation` mutation — toggle mute state
  - [x] `deleteConversation` mutation (soft delete — removes participant record)
  - [x] `getTotalUnreadCount` query — across all non-muted conversations
  - [x] `searchConversations` query — by user name/username or group name
- [x] Create `convex/messages.ts`
  - [x] `sendMessage` mutation — text, image, file types with validation (5000 char limit)
  - [x] `getMessages` query — paginated desc with cursor, filtered, enriched with sender info/reply info, chronological display
  - [x] `deleteMessage` mutation — for me (deletedForUserIds) / for everyone (15-min window)
  - [x] `markAsRead` mutation — update lastReadMessageId, mark earlier messages as read
  - [x] `editMessage` mutation — sender only, text only, 15-min window
  - [x] `getReadReceipts` query — which participants read past a message
  - [x] `searchMessages` query — text search within conversation
  - [x] `reactToMessage` mutation — emoji reactions via reactions table
- [x] Create `convex/presence.ts`
  - [x] `setTyping` mutation — upsert typing indicator for user+conversation
  - [x] `getTypingUsers` query — active typing users (excludes self, stale >10s)
  - [x] `clearStaleTyping` mutation — cleanup stale indicators

**Frontend:**
- [x] Create `src/app/(dashboard)/messages/page.tsx`
  - [x] Two-column layout (conversation list + chat area)
  - [x] Mobile: stack views, back button
- [x] Create `src/components/messages/ConversationList.tsx`
  - [x] List of conversations with search filter
  - [x] Avatar with initials fallback, name, last message preview, timestamp, unread badge
  - [x] Muted indicator, group member count
- [x] Create `src/components/messages/ChatArea.tsx`
  - [x] Header: recipient avatar, name, member count for groups
  - [x] Message list with auto-scroll on new messages
  - [x] Message composer at bottom with reply support
  - [x] Typing indicator, search bar, mute/delete menu
  - [x] Auto-mark-as-read, GroupInfoPanel toggle for groups
- [x] Create `src/components/messages/MessageBubble.tsx`
  - [x] Sent (right, blue) vs received (left, gray)
  - [x] Timestamp, read receipts (✓ sent, ✓✓ delivered, blue ✓✓ read)
  - [x] Support text, images, files
  - [x] Reply quote indicator if replyToId exists
  - [x] System messages (centered, italic), deleted messages (🚫)
  - [x] Context menu: Reply, Copy, Delete for me, Delete for everyone (15-min)
  - [x] Pinned indicator (📌), edited indicator, group sender name
- [x] Create `src/components/messages/MessageComposer.tsx`
  - [x] Auto-resizing textarea with emoji picker (12 common emojis)
  - [x] Attachment button placeholder
  - [x] Send button (blue when content present)
  - [x] Typing indicator trigger (debounced 3s timeout)
  - [x] Reply indicator bar with cancel
- [x] Create `src/components/messages/TypingIndicator.tsx`
  - [x] Animated bounce dots (staggered delay)
  - [x] "[User] is typing" / "[User] and [User] are typing" / "[User] and N others are typing"
- [x] Add "Messages" to navbar (desktop + mobile) with unread count badge
- [x] Implement message notifications (via notification scheduler for non-muted participants)
- [x] Real-time subscription for new messages (Convex reactive queries)

**File Upload:**
- [ ] Integrate Convex file storage or S3 for attachments (deferred to Phase 3.1)
- [ ] Image preview before send (deferred to Phase 3.1)
- [ ] File size validation (max 25MB) (deferred to Phase 3.1)

**Tests:**
- [x] `convex/conversations.test.ts` — 78 tests covering conversation CRUD, search, unread counts, muting, deletion
- [x] `convex/messages.test.ts` — 48 tests covering send/receive, pagination, delete, edit, read receipts, search, reactions, typing indicators

---

### 2.2 Group Chat 🟡 ⏱️ L ✅ COMPLETED

**Schema Updates:**
- [x] Add `type` field to `conversations` table: "direct" | "group"
- [x] Add `name`, `avatar`, `description`, `createdBy` fields to `conversations` (for groups)
- [x] Add `role` field to `conversationParticipants`: "owner" | "admin" | "member"

**Backend:**
- [x] Update `convex/conversations.ts`
  - [x] `createGroup` mutation — name, description, initial members (max 256), deduplication, system message
  - [x] `addGroupMember` mutation — admin/owner only, capacity check, system message
  - [x] `removeGroupMember` mutation — admin/owner only, can't remove owner, only owner removes admins
  - [x] `leaveGroup` mutation — ownership transfer to admin or oldest member
  - [x] `updateGroupInfo` mutation — edit name, description, avatar (admin/owner only)
  - [x] `promoteToAdmin` / `demoteFromAdmin` mutations (owner only)
  - [x] `pinMessage` mutation — admin/owner only, groups only
  - [x] `getPinnedMessages` query — pinned non-deleted messages with sender info

**Frontend:**
- [x] Create `src/components/messages/CreateGroupModal.tsx`
  - [x] Group name input (max 100 chars)
  - [x] Description textarea
  - [x] Add members (multi-select with search from api.users.searchUsers)
  - [x] Selected members as pill chips with remove
  - [x] Validation (name required, ≥1 member)
- [x] Update `ChatArea.tsx` to handle group context
  - [x] Show member count in header
  - [x] Group info sidebar toggle
- [x] Create `src/components/messages/GroupInfoPanel.tsx`
  - [x] Member list with role badges (Crown=owner, ShieldCheck=admin)
  - [x] Admin actions on hover (promote, demote, remove)
  - [x] Add member search (admin only)
  - [x] Editable name/description form (admin/owner)
  - [x] Pinned messages section (collapsible)
  - [x] Leave group button with ownership transfer
- [x] Update `MessageBubble.tsx` — show sender name + avatar in groups

**Tests:**
- [x] `convex/conversations.test.ts` — group operations (createGroup, addMember, removeMember, leaveGroup, promote/demote, pinMessage, updateGroupInfo)
- [x] `convex/messages.test.ts` — group notification messages

---

### 2.3 Presence & Activity Status ✅ ⏱️ M

**Schema:**
- [x] Add to `users` table:
  - [x] `status`: "online" | "away" | "dnd" | "invisible"
  - [x] `customStatus`: string (optional)
  - [x] `lastSeenAt`: number
  - [x] `showOnlineStatus`: boolean (privacy toggle)

**Backend:**
- [x] Update `convex/presence.ts`
  - [x] `updateStatus` mutation — set status (online/away/dnd/invisible)
  - [x] `setCustomStatus` mutation — custom message (max 100 chars, clear on empty)
  - [x] Heartbeat mechanism — update `lastSeenAt` every 60s (client-side interval)
  - [x] `getOnlineUsers` query — users online in the last 5 minutes (respects privacy/invisible)
  - [x] `getUserPresence` query — per-user presence info (privacy-aware)
  - [x] `updateOnlineStatusVisibility` mutation — toggle privacy setting

**Frontend:**
- [x] Add online status indicator (green dot) to:
  - [x] User avatars in chat (ChatArea header)
  - [x] User cards on profiles (ProfileHeader)
  - [x] Conversation list (DM avatars in ConversationList)
- [x] Create `src/components/ui/OnlineStatusDot.tsx` — reusable component with sm/md/lg sizes, overlay mode, last seen text
- [x] Create `src/components/ui/StatusSelector.tsx` — status picker with custom status input
- [x] Add status selector in Settings
  - [x] Online / Away / Do Not Disturb / Invisible with icons and descriptions
  - [x] Custom status input field (save on Enter/blur)
- [x] Add "Last seen [time]" in profile headers and chat header (privacy-aware, respects invisible)
- [x] Create `src/hooks/useHeartbeat.ts` — heartbeat hook with visibility change detection
- [x] Integrate heartbeat in dashboard layout — active when user is logged in

**Privacy:**
- [x] Add privacy setting: "Show online status" toggle in Settings
- [x] Invisible users appear offline to others, self always sees own status

**Tests:**
- [x] `convex/presence.test.ts` (51 tests covering status, heartbeat, filtering, privacy, formatLastSeen)
- [x] Updated `__mocks__/convex/api.js` with new presence functions

---

### 2.4 Voice & Video Calls ✅ ⏱️ XL

> **Note:** Signaling and call state management implemented via Convex. WebRTC media integration is a stretch goal — current UI provides full call flow with placeholders for WebRTC streams.

**Research & Planning:**
- [x] Design call flow: initiate → ring → accept/reject → in-call → end
- [x] Call state machine: ringing → active → ended/missed/rejected/busy

**Schema:**
- [x] Create `calls` table with:
  - [x] `conversationId`, `callerId`, `type` (audio/video)
  - [x] `status`: ringing | active | ended | missed | rejected | busy
  - [x] `participants`: array of { userId, joinedAt, leftAt, status }
  - [x] `startedAt`, `endedAt`, `duration` (seconds)
  - [x] Indexes: by_conversation, by_caller, by_status

**Backend:**
- [x] Create `convex/calls.ts` (7 exported functions)
  - [x] `initiateCall` mutation — create call record, verify participant, check for existing active call
  - [x] `acceptCall` mutation — update participant status, set call to active
  - [x] `rejectCall` mutation — decline call, auto-end if all declined
  - [x] `endCall` mutation — leave call, auto-end when no connected remain, handle missed
  - [x] `getCallHistory` query — paginated call history with caller info
  - [x] `getActiveCall` query — find active/ringing call for a conversation with participant info
  - [x] `getIncomingCalls` query — global incoming call detection for current user

**Frontend:**
- [x] Create `src/components/calls/CallModal.tsx` — full-screen call UI
  - [x] Caller avatar with animated ring (pulse for ringing, green for active)
  - [x] Call duration timer (auto-incrementing mm:ss / hh:mm:ss)
  - [x] Controls: mute, video toggle, screen share, end call
  - [x] Video placeholder areas (remote + PIP local) ready for WebRTC
  - [x] Accept/Reject buttons for incoming calls
  - [x] Auto-close on call end (2s delay)
  - [x] Reactive state sync via `getActiveCall` query
- [x] Create `src/components/calls/IncomingCallNotification.tsx`
  - [x] Global incoming call toast notification (top-right)
  - [x] Caller info, call type icon, accept/decline buttons
  - [x] Gradient header strip, animated avatar
  - [x] Dismissed call tracking (Set-based)
  - [x] Opens CallModal on accept
- [x] Add audio & video call buttons to DM chat header (ChatArea.tsx)
- [x] Add IncomingCallNotification to dashboard layout (global listener)

**Infrastructure (deferred):**
- [ ] Set up TURN/STUN server or API keys
- [ ] Integrate WebRTC media streams (simple-peer / livekit-client)
- [ ] Handle NAT traversal and firewall issues
- [ ] Implement call quality indicators

**Tests:**
- [x] `convex/calls.test.ts` (39 tests covering call types, status transitions, participants, duration, filtering, validation)
- [x] Updated `__mocks__/convex/api.js` with calls functions
- [x] Updated `convex/_generated/api.d.ts` with calls module

---

## Phase 3 — Content & Media Platform (Weeks 13-18)

### 3.1 Rich Media Posts ✅ ⏱️ XL

**Schema:**
- [x] Add to `posts` table:
  - [x] `mediaUrls`: array of strings (image/video URLs)
  - [x] `mediaType`: "image" | "video" | "file" | "link"
  - [x] `mediaFileNames`: array of strings (original filenames)
  - [x] `linkPreview`: object (url, title, description, image, favicon)

**Backend:**
- [x] Update `convex/posts.ts` → `createPost` mutation to handle media uploads
- [x] Create `convex/media.ts`
  - [x] `generateUploadUrl` mutation — presigned URL for Convex file storage
  - [x] `getFileUrl` query — resolve storage ID to public URL
  - [x] `deleteUpload` mutation — delete files from Convex storage
  - [x] `resolveStorageUrls` mutation — batch resolve storage IDs to URLs
  - [x] `fetchLinkPreview` action — fetch Open Graph metadata from URL
- [x] File validation:
  - [x] Image: JPEG, PNG, GIF, WebP, max 10MB each, max 10 images
  - [x] Video: MP4, WebM, max 100MB, max 1 video per post
  - [x] File: PDF, DOCX, PPTX, DOC, TXT, max 25MB

**Frontend:**
- [x] Update `PostComposer.tsx`
  - [x] Media upload area with drag-and-drop
  - [x] Multiple file selection (images/video/file toolbar buttons)
  - [x] Image preview grid with remove button
  - [x] Video preview with icon + filename
  - [x] File preview list with size indicator
  - [x] Automatic link detection → fetch Open Graph preview (debounced)
  - [x] Upload progress bar
- [x] Create `src/components/posts/MediaGallery.tsx`
  - [x] Grid layout for multiple images (1-4 images: different grid templates, +N overlay)
  - [x] Single video player with controls
  - [x] File download list
- [x] Create `src/components/posts/ImageLightbox.tsx` (inside MediaGallery.tsx)
  - [x] Full-screen image viewer
  - [x] Arrow navigation through gallery
  - [x] Zoom in/out toggle
  - [x] Dot indicator + close button + keyboard support
- [x] Create `src/components/posts/LinkPreviewCard.tsx`
  - [x] Show favicon, title, description, image
  - [x] Click → open link in new tab
- [x] Update `PostCard.tsx` to render MediaGallery + LinkPreviewCard
- [x] Update `PostContent.tsx` — parse fenced code blocks and block/inline LaTeX segments
- [x] Create `src/components/posts/CodeBlock.tsx` — syntax highlighting with Prism.js (10+ languages, copy button)
- [x] LaTeX rendering integration:
  - [x] Installed `katex`
  - [x] Created `src/components/posts/LaTeXRenderer.tsx`
  - [x] Parse inline `$...$` and block `$$...$$` in post content
  - [x] Import KaTeX + Prism CSS in globals.css

**Infrastructure:**
- [ ] Migrate from Convex file storage to Cloudflare R2 or AWS S3 (for large files) — deferred
- [ ] Set up CDN for media delivery — deferred
- [ ] Implement image optimization pipeline — deferred

**Tests:**
- [x] `convex/media.test.ts` — 17 tests (auth guards, storage logic, OG parsing, file constants)
- [x] `src/components/posts/MediaGallery.test.tsx` — 8 tests (render, lightbox, gallery grid)
- [x] `src/components/posts/PostComposer.test.tsx` — updated for media mutations
- [x] `src/components/responsive.test.tsx` — updated for new lucide icons

---

### 3.2 Stories / Ephemeral Content ✅

**Schema:**
- [x] Create `stories` table
  - [x] Fields: authorId, content, mediaUrl, backgroundColor, expiresAt, viewCount, createdAt
  - [x] Indexes: by_author, by_expiry
- [x] Create `storyViews` table
  - [x] Fields: storyId, viewerId, viewedAt
  - [x] Indexes: by_story, by_viewer

**Backend:**
- [x] Create `convex/stories.ts`
  - [x] `createStory` mutation — upload image or text-on-color
  - [x] `getStories` query — from followed users, not expired, not viewed by current user
  - [x] `getStoryById` query
  - [x] `viewStory` mutation — increment view count, record view
  - [x] `getStoryViewers` query — who viewed (for author only)
  - [x] `deleteStory` mutation — own stories only
- [x] Convex cron job (every hour) → delete expired stories

**Frontend:**
- [x] Create `src/app/(dashboard)/stories/page.tsx` — story viewer
  - [x] Full-screen story display
  - [x] Tap left/right or swipe to navigate
  - [x] Progress bars at top (one per story)
  - [x] Auto-advance after 5 seconds
  - [x] Swipe up/down to skip user
  - [x] Close button
- [x] Create `src/components/stories/StoryRing.tsx`
  - [x] Circular avatar with gradient ring (blue if unseen, gray if seen)
  - [x] Show on top of feed, profiles, navbar
- [x] Create `src/components/stories/StoryComposer.tsx`
  - [x] Camera/gallery upload
  - [x] Text-on-color mode (background picker, text input)
  - [x] Preview before posting
  - [x] "Add to Story" button in navbar
- [x] Create story creator flow:
  - [x] Click "+" on story ring → open composer modal
  - [x] Select image or text mode
  - [x] Post → creates story with 24h expiry
- [x] Show story rings:
  - [x] Horizontal scroll row at top of feed
  - [x] On profile header (own profile)
  - [x] In navbar (if user has active stories)

**Tests:**
- [x] `convex/stories.test.ts`
- [x] `src/app/(dashboard)/stories/page.test.tsx`
- [x] Story expiry cron job test (deleteExpiredStoriesInternal covered in stories.test.ts)

---

### 3.3 Polls & Surveys ✅

**Schema:**
- [x] Create `polls` table
  - [x] Fields: postId, options (array of {id, text, voteCount}), totalVotes, endsAt, isAnonymous, createdAt
  - [x] Indexes: by_post, by_author
- [x] Create `pollVotes` table
  - [x] Fields: pollId, userId, optionId, createdAt
  - [x] Indexes: by_poll, by_user_poll
- [x] Add `pollId` optional field to `posts` table

**Backend:**
- [x] Create `convex/polls.ts`
  - [x] `createPoll` mutation — 2-6 options, optional duration, anonymous flag
  - [x] `linkPollToPost` mutation — set two-way reference after post creation
  - [x] `vote` mutation — validate not expired, upsert vote (allow change)
  - [x] `getPollResults` query — get vote counts per option + isExpired flag
  - [x] `getUserVote` query — check what user voted for
  - [x] `deletePoll` mutation — own polls only, cascades votes
- [x] Update `posts.ts` → `createPost` to accept optional `pollId`

**Frontend:**
- [x] Update `PostComposer.tsx`
  - [x] "Poll" toolbar button (BarChart2 icon, toggles UI)
  - [x] Poll creation UI: add/remove options (2-6), duration dropdown, anonymous checkbox
  - [x] Inline preview of options before posting
  - [x] Poll created before post, then linked via `linkPollToPost`
- [x] Create `src/components/posts/PollCard.tsx`
  - [x] Show options as clickable buttons (before voting)
  - [x] Show results as animated progress bars (after voting or after poll ends)
  - [x] Display total votes and time remaining
  - [x] Highlight user's vote with checkmark icon
  - [x] "Final Results" badge if expired
  - [x] Loading skeleton while data loads
  - [x] Anonymous badge when applicable
- [x] Embed poll in PostCard when post has pollId

**Tests:**
- [x] `convex/polls.test.ts` (25 tests)
- [x] `src/components/posts/PollCard.test.tsx` (12 tests)

---

### 3.4 Markdown & Rich Text Editor ✅ COMPLETED

**Dependencies:**
- [x] Choose editor library: `@tiptap/react` (v3.20.0) selected
- [x] Install markdown parser: `react-markdown` (v10.1.0), `remark-gfm`, `remark-math`
- [x] Install syntax highlighter: `highlight.js` (via `rehype-highlight`)

**Backend:**
- [x] No schema changes needed
- [x] Update sanitization — added `sanitizeMarkdown()` to `convex/sanitize.ts`

**Frontend:**
- [x] Replace `PostComposer.tsx` textarea with `RichTextEditor`
  - [x] Toolbar: Bold, Italic, Strikethrough, Code, H1/H2/H3, Bullet/Ordered lists, Blockquote, Code block, HR, Link
  - [x] Markdown preview toggle (Edit mode / Preview markdown)
  - [x] Keyboard shortcuts (Ctrl/⌘+B, Ctrl/⌘+I, Ctrl/⌘+E)
- [x] Created `src/components/editor/RichTextEditor.tsx`
  - [x] TipTap v3 integration with bidirectional markdown↔HTML converter
  - [x] `CompactRichTextEditor` export for comment composers
  - [x] Character count + limit enforcement
  - [x] BubbleMenu for selection-based formatting
- [x] Created `src/components/editor/MarkdownRenderer.tsx`
  - [x] React-markdown with remark-gfm, remark-math, rehype-katex, rehype-highlight, rehype-raw
  - [x] Syntax highlighting for code blocks (highlight.js / github-dark theme)
  - [x] LaTeX rendering for math (KaTeX, block + inline)
  - [x] Auto-link URLs (GFM autolinks)
  - [x] Auto-embed YouTube/Vimeo videos (iframe detection)
- [x] Updated `PostContent.tsx` to delegate to `MarkdownRenderer`
- [x] Updated `CommentComposer.tsx` with `CompactRichTextEditor`

**Tests:**
- [x] `src/components/editor/RichTextEditor.test.tsx` — 11 tests
- [x] `src/components/editor/MarkdownRenderer.test.tsx` — 7 tests

---

## Phase 4 — Recommendation & AI Engines (Weeks 19-24)

### 4.1 Friend Suggestion Engine 🔴 ⏱️ XL ✅ COMPLETED

**Schema:**
- [x] Create `suggestions` table
  - [x] Fields: userId, suggestedUserId, score, reasons (array), isDismissed, computedAt
  - [x] Indexes: by_user, by_user_dismissed

**Backend:**
- [x] Create `convex/suggestions.ts`
  - [x] `computeSuggestionsForUser` internalMutation — complex computation
    - [x] Find 2nd-degree connections (friends of friends)
    - [x] Calculate scores using weighted formula (see roadmap)
    - [x] Store top 20 suggestions per user
  - [x] `computeAllSuggestions` internalMutation — batch all active users
  - [x] `getSuggestions` query — fetch pre-computed suggestions
  - [x] `dismissSuggestion` mutation — mark as dismissed
  - [x] `refreshSuggestions` mutation — trigger re-computation for user
- [x] Convex cron job (every 6 hours) → batch compute suggestions for all active users
- [x] Scoring algorithm implementation:
  - [x] Mutual follows: 0.30 weight
  - [x] Shared skills (Jaccard similarity): 0.20 weight
  - [x] Same university: 0.15 weight
  - [x] Same role: 0.05 weight
  - [x] Interaction history (likes/comments): 0.20 weight
  - [x] Skill complementarity: 0.10 weight

**Frontend:**
- [x] Create `src/components/discover/SuggestedUsers.tsx` widget
  - [x] Show 3-5 suggestions
  - [x] Quick follow button
  - [x] "Why suggested" tooltip with reasons
  - [x] Dismiss button (X icon)
  - [x] "See all" link
- [x] Create `src/app/(dashboard)/discover/suggested/page.tsx`
  - [x] Full list of suggestions with reason badges
  - [x] Refresh button
  - [x] UserCard-style layout with score display
- [x] Add suggestions widget to Discover page sidebar

**Optimization:**
- [x] Index optimization for fast 2nd-degree queries
- [ ] Incremental updates (only recompute for users with new follows) — deferred
- [ ] Cache suggestion scores in Redis (Phase 5 infra) — deferred

**Tests:**
- [x] `convex/suggestions.test.ts` — 29 tests: scoring algorithm, Jaccard, complementarity, weights, reasons
- [x] Score range validation (0-1) — property-style tests
- [x] Mock API updated with suggestions endpoints

---

### 4.2 Feed Ranking Algorithm ✅ COMPLETED

**Backend:**
- [x] Create `convex/feed-ranking.ts`
  - [x] `computeFeedScore` function — ranking formula (weights: recency 0.35, relevance 0.20, engagement 0.25, relationship 0.20)
    - [x] Recency score: exponential decay with 24h half-life, max 168h (7 days)
    - [x] Relevance score: Jaccard similarity of viewer/author skills
    - [x] Engagement score: log2(1 + reactions + 2×comments + 3×shares) / log2(101), capped at 1
    - [x] Relationship score: min(1, interactionCount / 10)
  - [x] `getRankedFeed` query — "For You" feed with intelligent scoring, 200 candidate posts, offset pagination
  - [x] `getChronologicalFeed` query — "Following" feed (posts + reposts from followed users)
  - [x] `getTrendingFeed` query — hot posts from last 48h, 70% engagement + 30% recency
- [x] Diversify feed:
  - [x] Time-based injection (7-day max age for candidates)
  - [x] Author diversity (max 2 posts per author in first 20 results)
- [x] Cold start handling:
  - [x] New users → getRankedFeed falls back to engagement-heavy scoring when no skills/follows

**Frontend:**
- [x] Update `src/app/(dashboard)/feed/page.tsx`
  - [x] Tab switcher: "For You" | "Following" | "Trending" with active state styling
  - [x] User preference persisted in localStorage (key: `campus-connect-feed-type`)
  - [x] Default to "for-you" for all users
- [x] Update `FeedContainer.tsx` to handle different feed types
  - [x] 3 parallel conditional `useQuery` hooks (one per feed type, others skip)
  - [x] State reset on feedType change
  - [x] Contextual empty state messages per feed type
- [x] Added SuggestedUsers widget in feed sidebar

**Tests:**
- [x] `convex/feed-ranking.test.ts` — 30 tests all passing
  - [x] recencyScore: 7 tests (brand-new, 24h half-life, 48h, 7d+, future, ordering, monotonicity)
  - [x] relevanceScore: 5 tests (no overlap, identical, case-insensitive, partial Jaccard, empty sets)
  - [x] engagementScore: 6 tests (zero, increase, comment weighting, share weighting, cap, range)
  - [x] relationshipScore: 4 tests (zero, 10+, proportional, monotonicity)
  - [x] computeFeedScore: 4 tests (all-zero, all-one, recency weight, composite ranking)
  - [x] FEED_WEIGHTS: 2 tests (sum to 1.0, recency highest)
  - [x] Property test: score monotonicity (newer posts + higher engagement → higher scores)

---

### 4.3 Content Recommendation ✅ COMPLETED

**Backend:**
- [x] Create `convex/recommendations.ts`
  - [x] `getRecommendedPosts` query — content-based filtering
    - [x] Topic affinity: Jaccard similarity of viewer's hashtag fingerprint vs post hashtags
    - [x] Author affinity: interaction frequency normalised (15 interactions → 1.0)
    - [x] Freshness boost: exponential decay with 48h half-life, max 14 days
    - [x] Engagement quality ratio: log2(1 + reactions + 3×comments) / log2(201), capped at 1
  - [x] `getSimilarPosts` query — collaborative filtering ("Users who liked X also liked Y")
    - [x] Co-reaction graph traversal across up to 30 reactors × 100 reactions each
  - [x] `getTrendingInSkill` query — posts trending in user's skill areas
    - [x] Filters by author skill match, scores 70% engagement + 30% recency
  - [x] `getPopularInUniversity` query — engagement-ranked posts from same university

**Frontend:**
- [x] Create `src/components/feed/RecommendedPosts.tsx` widget
  - [x] `RecommendedPosts` — "Posts you might like" with author avatars, truncated content, engagement stats
  - [x] `TrendingInSkill` — "Trending in [skills]" compact list
  - [x] `PopularInUniversity` — "Popular at [university]" compact list
  - [x] All widgets: loading skeleton, empty state, link to Explore page
- [x] Added `TrendingInSkill` to feed sidebar
- [x] Added `PopularInUniversity` to Discover sidebar
- [x] Created `src/app/(dashboard)/explore/page.tsx` — dedicated recommendations page
  - [x] Tab switcher: "For You" | "Trending in Skills" | "Your University"
  - [x] Full PostCard rendering per tab with loading and empty states
  - [x] SuggestedUsers + RecommendedPosts in sidebar

**Tests:**
- [x] `convex/recommendations.test.ts` — 30 tests all passing
  - [x] topicAffinity: 6 tests (no overlap, identical, partial Jaccard, empty, one-empty, superset)
  - [x] authorAffinity: 4 tests (zero, max, proportional, monotonicity)
  - [x] freshnessBoost: 5 tests (brand-new, 48h half-life, 14d+, future, monotonicity)
  - [x] engagementQuality: 5 tests (zero, comment weighting, increase, cap, range)
  - [x] computeRecommendationScore: 4 tests (all-zero, all-one, weight ordering, composite)
  - [x] REC_WEIGHTS: 3 tests (sum to 1.0, topicAffinity highest, non-negative)
  - [x] Property tests: 3 tests (freshness monotonicity, topic overlap monotonicity, score range)

---

### 4.4 Search Upgrades ✅ COMPLETED ⏱️ XL

**Infrastructure:**
- [x] Implemented fuzzy search with Levenshtein edit distance (no external dependency needed)
- [x] Built-in typo tolerance with proportional edit distance threshold (`floor(wordLen/3)`)
- [x] Relevance scoring engine: exact (1.0), prefix (0.9), substring (0.7), word-level (up to 0.6)

**Backend — `convex/search.ts`:**
- [x] `editDistance(a, b)` — Levenshtein distance helper
- [x] `fuzzyMatch(query, target, maxDistance)` — substring + word-level fuzzy matching
- [x] `searchRelevanceScore(query, text)` — [0, 1] relevance scorer
- [x] `universalSearch` query — searches across Users, Posts, Hashtags with scoring
- [x] `searchPosts` query — full-text search with date range, media type, engagement filters, pagination
- [x] `searchUsersEnhanced` query — fuzzy matching + role/university/skills filters, pagination
- [x] `searchHashtags` query — relevance + popularity ranking

**Frontend:**
- [x] `src/components/navigation/UniversalSearchBar.tsx` — Universal search bar in navbar
  - [x] Autocomplete dropdown with categorized results (People / Posts / Hashtags)
  - [x] Shows top 3 results per category with live debounced search (300ms)
  - [x] "See all results" link to `/search?q=...`
  - [x] Keyboard shortcut Ctrl+K / Cmd+K to focus
  - [x] Click-outside to close dropdown
  - [x] Loading spinner, empty state, clear button
- [x] Integrated search bar into `src/app/(dashboard)/layout.tsx` navbar (desktop only)
- [x] `src/app/(dashboard)/search/page.tsx` — Full search results page
  - [x] Tabs: All | Users | Posts | Hashtags
  - [x] Filter panels: date range, media type, engagement threshold, user role, university
  - [x] Results display with `PostCard` and `UserCard` components
  - [x] Pagination (offset-based via cursor)
  - [x] `HighlightText` component for search term highlighting in results
- [x] Recent searches stored in localStorage (`campus-connect-recent-searches`, max 10)
  - [x] Shown in search dropdown and search page when no query
  - [x] Clear all option

**Tests — `convex/search.test.ts` (41 tests):**
- [x] editDistance: 8 tests (identical, empty, kitten/sitting, single diff, case-sensitive, whitespace)
- [x] fuzzyMatch: 9 tests (substring, case-insensitive, word-level, multi-word, maxDistance)
- [x] searchRelevanceScore: 19 tests (exact, prefix, substring, word-level, ordering, edge cases)
- [x] Property tests: 5 tests (symmetry, triangle inequality, substring guarantee, ordering, determinism)

---

### 4.5 Skill-Based Matching ✅ COMPLETED

**Schema:**
- [x] Create `skillEndorsements` table
  - [x] Fields: skillName, userId, endorserId, createdAt
  - [x] Indexes: by_user_skill, by_endorser, by_user_skill_endorser

**Backend:**
- [x] Create `convex/skill-endorsements.ts`
  - [x] `endorseSkill` mutation — validates self-endorsement, skill ownership, duplicate
  - [x] `removeEndorsement` mutation
  - [x] `getEndorsements` query — returns skill list with counts, top 3 endorser names, endorsed-by-viewer flag
  - [x] `getMyEndorsements` query — all endorsements given by current user
- [x] Create `convex/matching.ts`
  - [x] `findExperts` query — search by skill + optional experience level, scored results
  - [x] `findStudyPartners` query — complementary skills with shared/complementary breakdown
  - [x] `findMentors` query — match users with more experience in your skills
  - [x] Exported scoring helpers: skillOverlap, complementarity, experienceLevelValue, expertScore, partnerScore

**Frontend:**
- [x] Create `src/components/profile/SkillEndorsements.tsx`
  - [x] Endorse/remove button per skill (non-own profiles)
  - [x] Endorsement count badge with Award icon
  - [x] "Endorsed by [names]" tooltip via title attribute
  - [x] Loading skeletons
- [x] Update `src/app/(dashboard)/profile/[id]/page.tsx` — swap plain skill pills for SkillEndorsements component
- [x] Create `src/app/(dashboard)/find-experts/page.tsx`
  - [x] Multi-skill search input with tag chips
  - [x] Experience level filter dropdown
  - [x] Results: UserCard grid with matched skills + endorsement count overlay
- [x] Create `src/app/(dashboard)/find-partners/page.tsx`
  - [x] Study Partners tab — complementary skills breakdown (can-teach / shared)
  - [x] Mentors tab — experience gap scoring, mentor skill overlays
  - [x] "Find a Mentor" CTA banner for Beginner-level users

**Tests:**
- [x] `convex/skill-endorsements.test.ts` — 22 tests (normalization, validation, aggregation)
- [x] `convex/matching.test.ts` — 25 tests (skillOverlap, complementarity, experienceLevelValue, expertScore, partnerScore, integration)

**Test Results:** 47 new tests, all passing (total: 79/80 suites, 1256 tests)

---

## Phase 5 — Community & Groups (Weeks 25-30)

### 5.1 Communities / Groups ✅ COMPLETED

**Schema:**
- [x] Create `communities` table
  - [x] Fields: name, slug, description, avatar, banner, type (public/private/secret), category, rules (array), memberCount, createdBy, createdAt
  - [x] Indexes: by_slug, by_category, by_member_count
- [x] Create `communityMembers` table
  - [x] Fields: communityId, userId, role (owner/admin/moderator/member/pending), joinedAt
  - [x] Indexes: by_community, by_user, by_community_user
- [x] Add `communityId` field to `posts` table (optional, with by_community index)

**Backend:**
- [x] Create `convex/communities.ts`
  - [x] `createCommunity` mutation — validates name (3-100 chars), auto-generates unique slug, category validation, creator becomes owner
  - [x] `getCommunity` query — by slug, includes viewer's role
  - [x] `getCommunities` query — list all (excluding secret), filtered by category/search, includes viewer role
  - [x] `getMyCommunities` query — user's joined communities (non-pending)
  - [x] `getCommunityMembers` query — with roles, optional pending filter for admins
  - [x] `getCommunityPosts` query — posts with author info, respects secret community access
  - [x] `joinCommunity` mutation — public: direct join, private: pending, secret: blocked
  - [x] `leaveCommunity` mutation — owner cannot leave
  - [x] `requestToJoin` mutation (for private)
  - [x] `approveJoinRequest` mutation (admin/owner only)
  - [x] `updateCommunity` mutation (admin/owner only) — edit name, description, type, category, rules, avatar, banner
  - [x] `deleteCommunity` mutation — owner only, cascades member deletion
  - [x] `addMember` mutation (admin/owner only — for secret communities)
  - [x] `removeMember` mutation (admin/owner only — cannot remove owner)
  - [x] `updateMemberRole` mutation — owner only (cannot change owner's role)
- [x] Update `posts.ts`
  - [x] Add `communityId` parameter to `createPost`

**Frontend:**
- [x] Create `src/app/(dashboard)/communities/page.tsx` — discover communities
  - [x] Category tabs: All | Academic | Research | Social | Sports | Clubs | Technology | Arts | Other
  - [x] Search bar (real-time filter on name/description)
  - [x] "My Communities" horizontal scroll strip at top
  - [x] Community cards with avatar, name, description, member count, category badge
  - [x] "Join" / "Request" / "Leave" / "Pending" buttons
  - [x] "Create Community" link/CTA
- [x] Create `src/app/(dashboard)/communities/new/page.tsx` — community creation form
  - [x] Name, description, category, type fields
  - [x] Rules builder (add/remove)
  - [x] Submit creates and redirects to new community page
- [x] Create `src/app/(dashboard)/c/[slug]/page.tsx` — community page
  - [x] Banner image (gradient fallback), avatar with gradient fallback
  - [x] Member count, category, type icon (globe/lock/eye-off)
  - [x] "Join" / "Leave" / "Request to Join" / "Pending" buttons
  - [x] "Settings" link for admin/owner
  - [x] Tabs: Posts | About | Members
  - [x] Posts tab: community feed, loading skeleton + empty state
  - [x] About tab: CommunityInfoSidebar with rules
  - [x] Members tab: grid of members with roles, "View all" link
- [x] Create `src/components/communities/CommunityCard.tsx`
  - [x] Avatar with gradient fallback, name, category badge, type icon
  - [x] Member count, description (2-line clamp)
  - [x] Join/Leave/Request/Pending button
- [x] Create `src/components/communities/CommunityInfoSidebar.tsx`
  - [x] Numbered rules list
  - [x] Moderators list with links to profiles
  - [x] Creation date
  - [x] "Report Community" button
- [x] Create `src/app/(dashboard)/c/[slug]/members/page.tsx`
  - [x] Full member list with role badges and icons
  - [x] Search members by name/username
  - [x] Role selector + Remove button for admin/owner
- [x] Create `src/app/(dashboard)/c/[slug]/settings/page.tsx` — community settings (admin only)
  - [x] Edit name, description, category, type (owner/admin)
  - [x] Rules builder (add/remove rules)
  - [x] Save Changes button with success/error feedback
  - [x] Danger Zone: Delete Community (owner only, with confirmation)

**Tests:**
- [x] `convex/communities.test.ts` — 30 tests (slugify, validation, membership, roles, member count, community posts)

**Test Results:** 30 new tests, all passing (total: 80/81 suites, 1286 tests)

---

### 5.2 Nested Comment Threads ✅ COMPLETED

**Schema:**
- [x] Add to `comments` table:
  - [x] `parentCommentId`: optional Id<"comments">
  - [x] `depth`: number (0 = top-level)
  - [x] `replyCount`: number
  - [x] `.index("by_parent", ["parentCommentId"])` added

**Backend:**
- [x] Updated `convex/comments.ts`
  - [x] `createComment` mutation — accepts `parentCommentId`, calculates depth (parent.depth + 1, capped at 5), increments parent `replyCount`
  - [x] `getCommentReplies` query — get replies to a comment sorted oldest-first
  - [x] `deleteComment` mutation — BFS cascade delete of all descendants; decrements post commentCount by total deleted; decrements parent's replyCount
  - [x] Updated `getPostComments` query — returns flat list with depth; supports sort options (new | old | best | controversial)

**Frontend:**
- [x] Updated `CommentList.tsx` with full nesting support
  - [x] Depth-based indentation (24px per level) with border-l visual threading
  - [x] "View N replies / Hide replies" collapse/expand toggle
  - [x] "Continue this thread →" link at max depth (5)
  - [x] Inline reply composer per comment ("Replying to @name" + Cancel button)
  - [x] Sort bar: Best | New | Old | Controversial
  - [x] Client-side `childrenMap` (flat list → tree) + `topLevelComments` filter
- [x] Updated `CommentComposer.tsx`
  - [x] Accepts `parentCommentId`, `replyingToName`, `onCancel` props
  - [x] "Replying to @username" indicator + Cancel button
  - [x] Passes `parentCommentId` to `createComment`

**Tests:**
- [x] `convex/comments.test.ts` — 26 tests (depth calculation, reply counts, cascade delete, sort options, tree building, post count tracking)
- [x] `src/components/posts/CommentList.test.tsx` — updated with new mocks, all 10 tests passing

**Test Results:** 26 new backend tests + 10 frontend tests, all passing (total: 81/82 suites, 1312 tests)

---

### 5.3 Events & Scheduling ✅ COMPLETED

**Schema:**
- [x] Created `events` table (title, description, organizerId, communityId, eventType, startDate, endDate, location, virtualLink, isRecurring, maxAttendees, attendeeCount, createdAt; indexes: by_start_date, by_organizer, by_community)
- [x] Created `eventRSVPs` table (eventId, userId, status: going|maybe|not_going, createdAt; indexes: by_event, by_user, by_event_user)

**Backend:**
- [x] Created `convex/events.ts` with 10 functions:
  - [x] `createEvent` mutation — validates title (max 200), description (max 5000), dates, capacity, auto-RSVP organizer as "going", notifies community members
  - [x] `updateEvent` mutation — organizer only, validates date pairs
  - [x] `deleteEvent` mutation — organizer only, cascades RSVP deletions
  - [x] `rsvpEvent` mutation — upsert RSVP, capacity check, adjusts attendeeCount delta
  - [x] `getEvent` query — includes organizer, community, viewerRsvp
  - [x] `getUpcomingEvents` query — startDate >= now, filter by type/community
  - [x] `getPastEvents` query — startDate < now, sorted most-recent-first
  - [x] `getUserEvents` query — events user RSVPed to with rsvpStatus field
  - [x] `getCommunityEvents` query — events in a community, optional upcoming filter
  - [x] `getEventAttendees` query — users who RSVPed "going"
- [x] `sendEventReminders` internalMutation — checks 24h and 1h windows, notifies attendees
- [x] Added hourly cron job `send event reminders` to `convex/crons.ts`

**Frontend:**
- [x] Created `src/app/(dashboard)/events/page.tsx`
  - [x] Tabs: Upcoming | My Events | Past
  - [x] Type filter chips (All Types | In Person | Virtual | Hybrid)
  - [x] EventCard grid with 2-column responsive layout
  - [x] Empty states with create CTA
  - [x] Create Event button → opens CreateEventModal
- [x] Created `src/app/(dashboard)/events/[id]/page.tsx`
  - [x] Key details card (date/time, type, location, virtual link, attendee count)
  - [x] RSVP row: Going / Maybe / Not Going with active state + capacity warning
  - [x] About section (description), community link
  - [x] Attendees grid (avatar overlaps, +N overflow)
  - [x] "Add to Google Calendar" button (pre-filled URL)
  - [x] Share button (copy link)
- [x] Created `src/components/events/EventCard.tsx` (reusable card with type icon, meta info, RSVP badge, past indicator)
- [x] Created `src/components/events/CreateEventModal.tsx` (full form: title, description, type, start/end datetime, location, virtual link, max attendees)

**Tests:**
- [x] `convex/events.test.ts` — 27 tests (title validation, description validation, date validation, maxAttendees, RSVP delta, capacity, upcoming/past, sorting, integration)

**Test Results:** 27 new tests, all passing (total: 82/83 suites, 1339 tests)

---

## Phase 6 — Professional & Academic Tools (Weeks 31-36)

### 6.1 Research Collaboration Hub 🟢 ⏱️ L ✅ COMPLETED

**Schema:**
- [x] Create `papers` table
  - [x] Fields: title, abstract, authors (array), doi, pdfUrl, uploadedBy, tags, citationCount, lookingForCollaborators, createdAt
  - [x] Indexes: by_uploaded_by, by_created
- [x] Create `paperAuthors` table (many-to-many)
  - [x] Fields: paperId, userId
  - [x] Indexes: by_paper, by_user
- [x] Add `researchInterests` field to `users` table (array of strings)

**Backend:**
- [x] Create `convex/papers.ts`
  - [x] `uploadPaper` mutation — upload paper metadata, validates title (300), abstract (5000), authors, tags (max 20), DOI (100), links co-authors
  - [x] `updatePaper` mutation — uploader only, edit metadata with validation
  - [x] `deletePaper` mutation — uploader only, cascades paperAuthors
  - [x] `getPaper` query — with uploader info and linked platform authors
  - [x] `searchPapers` query — by title, authors, abstract, tags; case-insensitive
  - [x] `getUserPapers` query — uploaded + co-authored, deduplicated, sorted desc
  - [x] `getCollaborationOpportunities` query — papers with lookingForCollaborators flag

**Frontend:**
- [x] Create `src/app/(dashboard)/research/page.tsx`
  - [x] Tabs: Browse Papers | Looking for Collaborators
  - [x] Search papers by title, author, tag
  - [x] Tag filter input
  - [x] Paper cards with title, authors, abstract preview, tags, DOI, citations
  - [x] "Collaborators Wanted" badge
  - [x] Upload Paper modal (title, abstract, authors, DOI, tags, collaborator flag)
  - [x] Loading skeletons and empty states
- [x] Create `src/app/(dashboard)/research/[id]/page.tsx` — paper details
  - [x] Full metadata (title, authors, DOI link, citations, date)
  - [x] Abstract section
  - [x] PDF download link
  - [x] Uploader info with avatar
  - [x] Linked platform authors list (clickable to profiles)
  - [x] "Looking for collaborators" flag
  - [x] Delete button (owner only)

**Tests:**
- [x] `convex/papers.test.ts` — 30 tests (tag normalization, title/abstract/author/DOI/tag validation, search/filter, deduplication, collaboration flag, ownership)

---

### 6.2 Academic Portfolio 🟢 ⏱️ M ✅ COMPLETED

**Schema:**
- [x] Create `projects` table
  - [x] Fields: userId, title, description, techStack (array), links (array), screenshots (optional array), startDate, endDate, createdAt
  - [x] Indexes: by_user
- [x] Create `timeline` table (academic milestones)
  - [x] Fields: userId, type (course/certification/publication/award), title, institution, date, createdAt
  - [x] Indexes: by_user

**Backend:**
- [x] Create `convex/portfolio.ts`
  - [x] `addProject` mutation — validates title (200), description (3000), techStack (max 20), links (max 10), date range
  - [x] `updateProject` mutation — owner only, partial update with validation
  - [x] `deleteProject` mutation — owner only
  - [x] `getProjects` query — user's projects sorted desc
  - [x] `addTimelineItem` mutation — 4 types, validates title (200), institution (200)
  - [x] `deleteTimelineItem` mutation — owner only
  - [x] `getTimeline` query — user's timeline sorted by date desc
  - [x] `getContributionData` query — daily post+comment activity counts over 365 days

**Frontend:**
- [x] Create `src/app/(dashboard)/profile/[id]/portfolio/page.tsx`
  - [x] Tabs: Projects | Timeline | Activity
  - [x] Projects: cards with title, description, tech stack pills, links, date range; delete button (owner)
  - [x] Timeline: vertical timeline with type icons (GraduationCap, Award, FileText), color-coded, institution, date
  - [x] Activity: GitHub-style contribution heatmap (365 cells, 5 intensity levels, tooltip, legend)
  - [x] Add Project modal (title, description, tech stack, links)
  - [x] Add Milestone modal (type picker, title, institution, date)
  - [x] Loading skeletons and empty states

**Tests:**
- [x] `convex/portfolio.test.ts` — 23 tests (project validation, timeline validation, timeline types, contribution heatmap grouping, date sorting, ownership, tech stack normalization)

---

### 6.3 Job / Internship Board ✅ COMPLETED

**Schema:**
- [x] `jobs` table — title, company, description, type (job/internship), location, remote, duration, skillsRequired, salary, postedBy, applicantCount, expiresAt, createdAt; indexes: by_posted_by, by_created
- [x] `jobApplications` table — jobId, userId, coverLetter, resumeUrl, status (applied/viewed/shortlisted/rejected), createdAt; indexes: by_job, by_user, by_user_job

**Backend: `convex/jobs.ts`**
- [x] `postJob` mutation — validates title (≤200), company (≤200), description (≤5000), location, skills (≤20), expiry (future)
- [x] `updateJob` mutation — poster only, partial update
- [x] `deleteJob` mutation — poster only, cascades applications
- [x] `getJob` query — with poster info, expired flag, viewer application status
- [x] `searchJobs` query — text search (title/company/description/skills/location) + type/remote filters, excludes expired
- [x] `applyToJob` mutation — duplicate check, expired check, cover letter validation (≤3000), increments applicantCount
- [x] `getJobApplications` query — poster only, with applicant info
- [x] `getUserApplications` query — user's own applications with job info
- [x] `updateApplicationStatus` mutation — poster only (viewed/shortlisted/rejected)

**Frontend:**
- [x] `src/app/(dashboard)/jobs/page.tsx` — search + type/remote filters, job cards, Post Job modal
- [x] `src/app/(dashboard)/jobs/[id]/page.tsx` — full detail, Easy Apply modal, poster applications list, status management
- [x] `src/app/(dashboard)/jobs/my-applications/page.tsx` — track applications with status badges and descriptions

**Tests: `convex/jobs.test.ts` — 39 tests**
- [x] Title validation (5), company validation (3), description validation (2), location validation (2)
- [x] Skills validation (3), cover letter validation (2), expiry validation (2)
- [x] Search text query (7), search filters (6), expired listings (3), limit (2), application status (2)

---

### 6.4 Study Resources & Q&A ✅ COMPLETED

**Schema:**
- [x] `resources` table — title, description, fileUrl, course, subject, uploadedBy, rating, ratingCount, downloadCount, createdAt; indexes: by_course, by_uploaded_by
- [x] `questions` table — title, content, askedBy, course, tags, viewCount, upvotes, downvotes, answerCount, acceptedAnswerId, createdAt; indexes: by_asked_by, by_created
- [x] `answers` table — questionId, content, answeredBy, upvotes, downvotes, isAccepted, createdAt; indexes: by_question, by_answered_by
- [x] `questionVotes` table — targetId, targetType (question|answer), userId, voteType (up|down), createdAt; indexes: by_target, by_user_target

**Backend: `convex/resources.ts`**
- [x] `uploadResource` mutation — validates title (≤200), description (≤3000), course (≤100), subject (≤100)
- [x] `deleteResource` mutation — uploader only
- [x] `rateResource` mutation — 1-5 integer, moving average
- [x] `downloadResource` mutation — increments download count
- [x] `getResources` query — course filter + text search, sorted by rating desc
- [x] `getResource` query — single resource with uploader info

**Backend: `convex/questions.ts`**
- [x] `askQuestion` mutation — validates title (≤300), content (≤10000), tags (≤10, normalized)
- [x] `deleteQuestion` mutation — asker only, cascades answers + votes
- [x] `answerQuestion` mutation — validates content (≤10000), increments answerCount
- [x] `acceptAnswer` mutation — question asker only, un-accepts previous
- [x] `vote` mutation — upvote/downvote on questions or answers, toggle off or change direction
- [x] `getQuestions` query — sort by newest/votes/unanswered, tag + text filters
- [x] `getQuestion` query — with all answers sorted (accepted first), viewer vote states
- [x] `incrementViewCount` mutation

**Frontend:**
- [x] `src/app/(dashboard)/resources/page.tsx` — search + course filter, resource cards with star ratings, download, upload modal
- [x] `src/app/(dashboard)/q-and-a/page.tsx` — Stack Overflow style: sort tabs (Newest/Votes/Unanswered), tag filter, question list with scores, Ask Question modal
- [x] `src/app/(dashboard)/q-and-a/[id]/page.tsx` — question detail with vote buttons, answers list, accepted answer highlight, Write Answer composer

**Tests:**
- [x] `convex/resources.test.ts` — 30 tests: title/description/course/subject validation, rating validation/calculation, search filters, sorting, limit
- [x] `convex/questions.test.ts` — 31 tests: title/content validation, tag normalization, sort by votes/unanswered, filter by tag/text, answer sorting, vote logic (8 cases), score calculation

---

### 6.5 Achievement & Gamification ✅ COMPLETED

**Schema:**
- [x] `achievements` table — userId, badge, name, description, earnedAt; index: by_user
- [x] Users table: `reputation` (optional number), `level` (optional number) fields added

**Backend: `convex/gamification.ts`**
- [x] `awardReputation` internalMutation — awards points by action type, recalculates level
- [x] `unlockAchievement` mutation — prevents duplicates, validates badge exists
- [x] `checkAchievements` mutation — checks reputation milestones (100/500/1000) and level milestones (5/10)
- [x] `getAchievements` query — returns earned badges + full definitions with earned status
- [x] `getLeaderboard` query — top users by reputation, university filter, period filter
- [x] `getMyReputation` query — current user's rep, level, XP progress to next level
- [x] 10 reputation rules: post(10), comment(5), like(1), receive_comment(2), skill_endorsed(3), answer_accepted(15), paper(10), resource(5), question(3), answer(5)
- [x] 14 achievement badges defined (first_post, commentator, trending, helpful, scholar, teacher, curious_mind, contributor, expert, legend, networker, endorsed, level_5, level_10)
- [x] Level formula: `floor(sqrt(reputation / 10))`, minimum 1

**Frontend:**
- [x] `src/app/(dashboard)/leaderboard/page.tsx` — XP stats card with gradient + progress bar, period tabs (Weekly/Monthly/All Time), university filter, ranked list with rank icons (Crown/Medal), level badges with color tiers
- [x] `src/components/gamification/AchievementBadges.tsx` — grid of all achievements, earned badges with gradient icon circles + dates, locked badges grayed out with lock icon, per-badge icons & colors

**Tests: `convex/gamification.test.ts` — 36 tests**
- [x] Level calculation (10): edge cases at 0, negative, various thresholds up to 2000 rep
- [x] Reputation rules (5): count, specific values, all positive
- [x] Achievement definitions (3): count, uniqueness, required fields
- [x] Achievement checks (7): reputation milestones, skip already earned, level milestones
- [x] Progress calculation (4): various levels, cap at 100%
- [x] Leaderboard (7): sorting, ranks, university filter, limit, case-insensitive

---

## Phase 7 — Monetization & Growth (Weeks 37-42)

### 7.1 Premium Features (Campus Connect Pro) 🔵 ⏱️ L ✅ COMPLETED

**Schema:**
- [x] Add to `users` table: `isPro`, `proExpiresAt`, `isVerified`, `stripeCustomerId`, `emailDigestFrequency`, `emailNotifications`
- [x] Create `subscriptions` table with plan, status, period fields, Stripe IDs, indexes

**Backend:**
- [x] Create `convex/subscriptions.ts`
  - [x] `upgradeToPro` mutation — creates/updates subscription record, sets isPro+proExpiresAt on user
  - [x] `cancelPro` mutation — marks cancelAtPeriodEnd
  - [x] `checkProStatus` query — returns isPro, daysRemaining, subscription details
  - [x] `isUserPro` query — per-user Pro gate check
  - [x] `handleStripeWebhook` internal mutation — handles subscription.deleted/updated

**Frontend:**
- [x] Create `src/app/(dashboard)/settings/billing/page.tsx` — pricing table, upgrade/cancel flow
- [x] Create `src/components/premium/UpgradeModal.tsx` — upsell modal for gated features

**Tests:**
- [x] `convex/subscriptions.test.ts` — 30 tests covering pricing, period calc, pro status, plan transitions, validation

---

### 7.2 Advertising Platform 🔵 ⏱️ XL ✅ COMPLETED

**Schema:**
- [x] `ads`, `adImpressions`, `adClicks` tables with all fields and indexes

**Backend:**
- [x] Create `convex/ads.ts`
  - [x] `createAd` mutation — title/content/budget/targeting validation
  - [x] `updateAd` mutation — advertiser-only auth
  - [x] `deleteAd` mutation — advertiser-only auth
  - [x] `getAds` query — active ads with targeting filter + expiry check
  - [x] `recordImpression` mutation — per-user daily frequency cap
  - [x] `recordClick` mutation
  - [x] `getAdAnalytics` query — per-ad or all advertiser ads with CTR

**Frontend:**
- [x] Create `src/app/(dashboard)/ads/create/page.tsx` — full ad creation form with preview
- [x] Create `src/app/(dashboard)/ads/dashboard/page.tsx` — analytics table, pause/resume, delete

**Tests:**
- [x] `convex/ads.test.ts` — 36 tests for validation, CTR calc, targeting logic

---

### 7.3 Campus Marketplace 🔵 ⏱️ L ✅ COMPLETED

**Schema:**
- [x] `listings` table with title, description, category, price, condition, images, sellerId, university, status, expiresAt, createdAt + indexes

**Backend:**
- [x] Create `convex/marketplace.ts`
  - [x] `createListing` mutation — full validation, 30-day auto-expiry
  - [x] `updateListing` mutation — seller-only auth
  - [x] `deleteListing` mutation — seller-only auth
  - [x] `markAsSold` mutation
  - [x] `getListings` query — category/price range/university filters, skips expired
  - [x] `getListing` query — with seller info
  - [x] `getMyListings` query

**Frontend:**
- [x] Create `src/app/(dashboard)/marketplace/page.tsx` — category tabs, price filter, listing grid, skeleton loading
- [x] Create `src/app/(dashboard)/marketplace/[id]/page.tsx` — image gallery, seller card, Message Seller DM, mark sold/delete
- [x] Create `src/components/marketplace/CreateListingModal.tsx` — full form modal

**Tests:**
- [x] `convex/marketplace.test.ts` — 46 tests for constants, validation, status, price range

---

### 7.4 Push Notifications & Email Digests 🟡 ⏱️ L ✅ COMPLETED

**Push Notifications:**
- [x] Service Worker (`public/sw.js`) — handles push events, notification clicks, offline fallback
- [x] `subscribeToPush` mutation — upserts subscription (endpoint, p256dh, auth)
- [x] `unsubscribeFromPush` mutation
- [x] `getUserSubscriptions` query

**Email Digests:**
- [x] `updateEmailPreferences` mutation — sets emailDigestFrequency + emailNotifications on user
- [x] `getEmailPreferences` query
- [x] `buildPushPayload` — typed payload builder for 5 notification types (new_message, new_comment, new_follower, event_reminder, mention)
- [x] `shouldSendDigest` — frequency-aware send gating (daily always, weekly on Monday)
- [x] `formatDigestSubject` — generates email subject with unread count

**Frontend:**
- [x] Create `src/app/(dashboard)/settings/notifications/page.tsx` — push toggle (requests permission, subscribes), email frequency selector, email notifications toggle

**Tests:**
- [x] `convex/pushNotifications.test.ts` — 29 tests for validation, payload builder, digest scheduling, subject formatting

---

## Infrastructure & DevOps

### Monitoring & Analytics 🔴 ⏱️ M

- [ ] Set up Sentry for error tracking
  - [ ] Install `@sentry/nextjs`
  - [ ] Configure DSN in `.env.local`
  - [ ] Add error boundaries integration
- [ ] Set up Vercel Analytics for performance monitoring
  - [ ] Enable in Vercel dashboard
  - [ ] Add `<Analytics />` to root layout
- [ ] Set up PostHog for product analytics
  - [ ] Install `posthog-js`
  - [ ] Track key events: sign-up, post creation, follows, etc.
  - [ ] Create funnels and dashboards
- [ ] Add logging infrastructure:
  - [ ] Structured logging in Convex functions
  - [ ] Log levels: info, warn, error
  - [ ] Log aggregation (Logtail or Datadog)

---

### Caching Layer 🟡 ⏱️ M

- [ ] Set up Upstash Redis
  - [ ] Create account and database
  - [ ] Install `@upstash/redis`
- [ ] Add caching for:
  - [ ] Trending hashtags computation (6h TTL)
  - [ ] Friend suggestions (24h TTL per user)
  - [ ] Feed ranking scores (15min TTL)
  - [ ] User online status (5min TTL)
- [ ] Implement cache invalidation on mutations
- [ ] Add cache hit rate monitoring

---

### Rate Limiting 🔴 ⏱️ S

- [ ] Implement rate limiting middleware
  - [ ] Use Upstash Ratelimit or Vercel Edge Config
  - [ ] Limits:
    - [ ] API: 100 requests/min per IP
    - [ ] Posts: 10 posts/hour per user
    - [ ] Comments: 30 comments/hour per user
    - [ ] DMs: 50 messages/hour per user
    - [ ] Follows: 20 follows/hour per user
- [ ] Add rate limit headers in responses
- [ ] Show user-friendly error when rate limited
- [ ] Whitelist Pro users (higher limits)

---

### CDN & Asset Optimization 🟡 ⏱️ M

- [ ] Migrate large media to Cloudflare R2 or AWS S3
  - [ ] Update file upload mutations
  - [ ] Use CDN URL for serving
- [ ] Set up Cloudflare Image Resizing
  - [ ] On-the-fly image optimization
  - [ ] Responsive image variants
- [ ] Optimize images before upload (client-side)
  - [ ] Install `browser-image-compression`
  - [ ] Compress in PostComposer before upload
- [ ] Enable Vercel Edge Caching
  - [ ] Static pages: 1 year cache
  - [ ] Public profiles: 5min ISR revalidation

---

### CI/CD Pipeline 🔴 ⏱️ M

- [ ] Set up GitHub Actions workflows:
  - [ ] `.github/workflows/test.yml` — run tests on PR
  - [ ] `.github/workflows/lint.yml` — ESLint + Prettier check
  - [ ] `.github/workflows/deploy-preview.yml` — Vercel preview deployment
  - [ ] `.github/workflows/deploy-production.yml` — deploy to production on merge to main
- [ ] Add branch protection rules:
  - [ ] Require PR review
  - [ ] Require passing tests
  - [ ] Require up-to-date branch
- [ ] Set up Vercel deployment:
  - [ ] Connect GitHub repo
  - [ ] Configure environment variables
  - [ ] Enable automatic preview deployments

---

### Database Backup & Recovery 🔴 ⏱️ S ✅ COMPLETED

- [x] Convex automatic backups (enabled by default)
- [x] Document backup restoration procedure
- [x] Set up point-in-time recovery process
- [x] Test backup restoration quarterly
- [x] Created comprehensive docs/BACKUP_RECOVERY.md runbook

---

### Security Hardening 🔴 ⏱️ M ✅ COMPLETED

- [x] Content Security Policy (CSP) headers
  - [x] Add to `next.config.js`
  - [x] Restrict script sources, image sources
- [x] CORS configuration
  - [x] Restrict origins in Convex HTTP API
- [x] Input sanitization review
  - [x] Audit all user inputs for XSS/injection vulnerabilities
  - [x] Add property-based fuzz testing (16 security fuzz tests)
- [ ] Add CAPTCHA to sign-up form (Google reCAPTCHA or hCaptcha) — deferred (Clerk handles)
- [x] Implement CSRF protection (src/lib/csrf.ts with 11 tests)
- [x] Add security headers middleware:
  - [x] X-Frame-Options (via frame-ancestors 'none' in CSP)
  - [x] X-Content-Type-Options
  - [x] Strict-Transport-Security (HSTS with preload)
  - [x] Permissions-Policy
  - [x] X-Permitted-Cross-Domain-Policies
- [x] Conduct security audit — docs/SECURITY_AUDIT.md

---

### Performance Optimization 🟡 ⏱️ M ✅ COMPLETED

- [x] Code splitting with dynamic imports
  - [x] Lazy load rich text editor (PostComposer, CommentList, CommentComposer)
  - [x] Lazy load MarkdownRenderer (PostContent)
  - [x] Lazy load framer-motion on landing page (LazyMotion + m components)
- [x] Virtualize long lists
  - [x] Install `@tanstack/react-virtual`
  - [x] Created VirtualizedFeed component for feed with dynamic measurement
- [x] Optimize bundle size
  - [x] Install `@next/bundle-analyzer` (run with ANALYZE=true)
  - [x] Tree-shake framer-motion via LazyMotion/domAnimation
  - [x] Already using date-fns (not Moment.js)
- [x] Enhanced Service Worker for caching & offline support
  - [x] Cache-first for static assets (_next/static), fonts, images
  - [x] Stale-while-revalidate for dynamic assets
  - [x] Network-first for navigation with offline fallback
  - [x] Image CDN caching (Convex, Clerk, Unsplash)
  - [x] Cache size limits with LRU eviction
  - [x] Created /offline page
- [x] Add ISR (Incremental Static Regeneration)
  - [x] Sign-in/sign-up pages: 1hr revalidation
  - [x] Offline page: fully static (revalidate = false)
  - [x] Landing page: client-side (auth redirect needs useUser)

---

### Database Sharding (1M+ users) 🔵 ⏱️ XL ✅ COMPLETED (Architecture Plan)

- [x] Shard by university
  - [x] Partition-by-university strategy documented
  - [x] Cross-shard query patterns (fan-out, CDC, caching)
- [x] Convex automatic scaling documented
- [x] Migration playbook (prepare → split → validate)
- [x] Capacity planning & monitoring thresholds
- [x] Rollback plan
- [x] Created comprehensive docs/DATABASE_SHARDING.md

---

### Microservices Extraction (1M+ users) 🔵 ⏱️ XL ✅ COMPLETED (Architecture Plan)

- [x] Extract chat service — architecture designed
  - [x] Dedicated WebSocket gateway pattern
  - [x] Separate Convex project for messages
- [x] Extract notification service — architecture designed
  - [x] Event-driven with Upstash Kafka
  - [x] Push delivery (web-push, APNs, FCM) + email digest
- [x] Extract recommendation engine — architecture designed
  - [x] Vector DB (Pinecone/pgvector) for embeddings
  - [x] Batch job + real-time boost pattern
- [x] Strangler fig extraction workflow documented
- [x] Communication patterns (sync, async, event schema)
- [x] Data consistency (saga pattern, eventual consistency)
- [x] Created comprehensive docs/MICROSERVICES_EXTRACTION.md

---

## Notes

- **Dependencies:** Tasks marked with dependencies should be completed in order.
- **Testing:** Each feature should have corresponding tests before marking as complete.
- **Documentation:** Update user-facing documentation and API docs as features are added.
- **Prioritization:** Focus on high-impact, low-effort tasks first (see Priority Matrix in roadmap).
- **Incremental rollout:** Use feature flags to test with small user groups before full release.
- **User feedback:** After each phase, gather feedback and adjust priorities.

---

*This TODO is derived from FEATURE_ROADMAP.md. Keep both documents in sync as priorities shift.*
