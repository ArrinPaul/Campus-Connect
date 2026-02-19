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

### 3.4 Markdown & Rich Text Editor 🟡 ⏱️ L

**Dependencies:**
- [ ] Choose editor library: `@tiptap/react`, `react-quill`, or `lexical`
- [ ] Install markdown parser: `remark`, `react-markdown`
- [ ] Install syntax highlighter: `prismjs` or `shiki`

**Backend:**
- [ ] No schema changes needed
- [ ] Update sanitization to allow safe markdown tags

**Frontend:**
- [ ] Replace `PostComposer.tsx` textarea with rich text editor
  - [ ] Toolbar: Bold, Italic, Heading, List, Link, Code Block
  - [ ] Markdown preview toggle
  - [ ] Keyboard shortcuts (Cmd+B, Cmd+I, etc.)
- [ ] Create `src/components/editor/RichTextEditor.tsx`
  - [ ] TipTap or chosen editor integration
  - [ ] Mention plugin integration
  - [ ] Hashtag plugin integration
  - [ ] LaTeX plugin integration
- [ ] Create `src/components/posts/MarkdownRenderer.tsx`
  - [ ] Render markdown to HTML with `react-markdown`
  - [ ] Syntax highlighting for code blocks
  - [ ] LaTeX rendering for math
  - [ ] Auto-link URLs
  - [ ] Auto-embed YouTube/Vimeo videos (iframe)
- [ ] Update `PostCard.tsx` to render markdown content
- [ ] Update comment composer similarly (lighter version)

**Tests:**
- [ ] `src/components/editor/RichTextEditor.test.tsx`
- [ ] Markdown rendering test

---

## Phase 4 — Recommendation & AI Engines (Weeks 19-24)

### 4.1 Friend Suggestion Engine 🔴 ⏱️ XL

**Schema:**
- [ ] Create `suggestions` table
  - [ ] Fields: userId, suggestedUserId, score, reasons (array), isDismissed, computedAt
  - [ ] Indexes: by_user, by_user_dismissed

**Backend:**
- [ ] Create `convex/suggestions.ts`
  - [ ] `computeSuggestions` action — complex computation
    - [ ] Find 2nd-degree connections (friends of friends)
    - [ ] Calculate scores using weighted formula (see roadmap)
    - [ ] Store top 20 suggestions per user
  - [ ] `getSuggestions` query — fetch pre-computed suggestions
  - [ ] `dismissSuggestion` mutation — mark as dismissed
  - [ ] `refreshSuggestions` mutation — trigger re-computation for user
- [ ] Convex cron job (every 6 hours) → batch compute suggestions for all active users
- [ ] Scoring algorithm implementation:
  - [ ] Mutual follows: 0.30 weight
  - [ ] Shared skills (Jaccard similarity): 0.20 weight
  - [ ] Same university: 0.15 weight
  - [ ] Same role: 0.05 weight
  - [ ] Interaction history (likes/comments): 0.20 weight
  - [ ] Skill complementarity: 0.10 weight

**Frontend:**
- [ ] Create `src/components/discover/SuggestedUsers.tsx` widget
  - [ ] Show 3-5 suggestions
  - [ ] Quick follow button
  - [ ] "Why suggested" tooltip with reasons
  - [ ] Dismiss button (X icon)
  - [ ] "See all" link
- [ ] Create `src/app/(dashboard)/discover/suggested/page.tsx`
  - [ ] Full list of suggestions
  - [ ] Refresh button
  - [ ] UserCard grid layout
- [ ] Add suggestions widget to Discover page sidebar

**Optimization:**
- [ ] Index optimization for fast 2nd-degree queries
- [ ] Incremental updates (only recompute for users with new follows)
- [ ] Cache suggestion scores in Redis (Phase 5 infra)

**Tests:**
- [ ] `convex/suggestions.test.ts` — scoring algorithm unit tests
- [ ] Property test: score range validation (0-1)
- [ ] Integration test: end-to-end suggestion generation

---

### 4.2 Feed Ranking Algorithm 🔴 ⏱️ XL

**Backend:**
- [ ] Create `convex/feed-ranking.ts`
  - [ ] `computeFeedScore` function — ranking formula
    - [ ] Recency score: exponential decay based on hours since post
    - [ ] Relevance score: skill overlap between author and viewer
    - [ ] Engagement score: log(likes + 2×comments + 3×shares)
    - [ ] Relationship score: interaction frequency
  - [ ] Update `getFeedPosts` query with ranking option
  - [ ] `getRankedFeed` query — "For You" feed with intelligent sorting
  - [ ] `getChronologicalFeed` query — "Following" feed (existing)
  - [ ] `getTrendingFeed` query — hot posts campus-wide
- [ ] Diversify feed:
  - [ ] Time-based injection (prevent old viral posts)
  - [ ] Author diversity (max 2 posts per author in first 20)
- [ ] Cold start handling:
  - [ ] New users → show popular posts from campus
  - [ ] Store global trending cache

**Frontend:**
- [ ] Update `src/app/(dashboard)/feed/page.tsx`
  - [ ] Tab switcher: "For You" | "Following" | "Trending"
  - [ ] User preference persisted in localStorage
  - [ ] Default to "For You" for existing users
- [ ] Add "Why am I seeing this?" tooltip on posts
  - [ ] "Based on your skills: [skills]"
  - [ ] "Popular among your university"
  - [ ] "From people you follow"
- [ ] Update `FeedContainer.tsx` to handle different feed types

**Monitoring & Tuning:**
- [ ] Add logging to track feed engagement metrics
- [ ] A/B test different weight configurations
- [ ] Adjust decay rates based on user feedback

**Tests:**
- [ ] `convex/feed-ranking.test.ts` — score calculation tests
- [ ] Property test: score monotonicity (newer posts score higher with same engagement)

---

### 4.3 Content Recommendation 🟡 ⏱️ L

**Backend:**
- [ ] Create `convex/recommendations.ts`
  - [ ] `getRecommendedPosts` query — content-based filtering
    - [ ] Topic affinity (hashtag similarity)
    - [ ] Author affinity (interaction history)
    - [ ] Freshness boost
    - [ ] Engagement quality ratio
  - [ ] `getSimilarPosts` query — collaborative filtering
    - [ ] "Users who liked X also liked Y"
  - [ ] `getTrendingInSkill` query — posts trending in user's skill areas
  - [ ] `getPopularInUniversity` query

**Frontend:**
- [ ] Create `src/components/feed/RecommendedPosts.tsx` widget
  - [ ] "Posts you might like" section
  - [ ] Shows after scrolling through 10 posts in feed
  - [ ] 3 recommended posts in horizontal row
- [ ] Add "Trending in [Skill]" sections to feed
- [ ] Add "Popular in your university" section to Discover page
- [ ] Create `src/app/(dashboard)/explore/page.tsx` — dedicated recommendations page

**Tests:**
- [ ] `convex/recommendations.test.ts`

---

### 4.4 Search Upgrades 🔴 ⏱️ XL

**Infrastructure:**
- [ ] Evaluate search solutions: Convex full-text (built-in), Typesense, Meilisearch
- [ ] Choose: **Typesense** for typo-tolerance and speed
- [ ] Set up Typesense Cloud instance or self-hosted
- [ ] Create search indexes:
  - [ ] Users index: name, bio, skills, university
  - [ ] Posts index: content, author name, hashtags
  - [ ] Hashtags index: tag
  - [ ] Communities index (Phase 5): name, description

**Backend:**
- [ ] Create `convex/search.ts`
  - [ ] `universalSearch` query — searches across all types
  - [ ] `searchPosts` query — full-text search with filters
  - [ ] `searchUsers` query — enhanced with typo correction
  - [ ] `searchHashtags` query
  - [ ] `searchCommunities` query (Phase 5)
  - [ ] Sync data to Typesense on create/update/delete via webhooks or Convex actions

**Frontend:**
- [ ] Update navbar search bar to universal search
  - [ ] Autocomplete dropdown with categorized results
  - [ ] Show: Top Users (3) | Top Posts (3) | Hashtags (3)
  - [ ] "See all results" link
- [ ] Create `src/app/(dashboard)/search/page.tsx`
  - [ ] Tabs: All | Users | Posts | Hashtags | Groups
  - [ ] Search filters sidebar:
    - [ ] Date range picker
    - [ ] Content type (text, image, video)
    - [ ] Engagement threshold (min likes/comments)
    - [ ] University filter
  - [ ] Results display per tab
  - [ ] Pagination
- [ ] Save recent searches in localStorage
  - [ ] Show in search dropdown
  - [ ] Clear history option
- [ ] Highlight search terms in results

**Tests:**
- [ ] `convex/search.test.ts`
- [ ] Search UI integration test

---

### 4.5 Skill-Based Matching 🟡 ⏱️ M

**Schema:**
- [ ] Create `skillEndorsements` table
  - [ ] Fields: skillName, userId, endorserId, createdAt
  - [ ] Indexes: by_user_skill, by_endorser

**Backend:**
- [ ] Create `convex/skill-endorsements.ts`
  - [ ] `endorseSkill` mutation
  - [ ] `removeEndorsement` mutation
  - [ ] `getEndorsements` query — for a user+skill, return count and top endorsers
- [ ] Create `convex/matching.ts`
  - [ ] `findExperts` query — search by skill + experience level
  - [ ] `findStudyPartners` query — complementary skills
  - [ ] `findMentors` query — match beginners with experts

**Frontend:**
- [ ] Update profile page skill section
  - [ ] Endorse button next to each skill (for other users' profiles)
  - [ ] Show endorsement count
  - [ ] "Endorsed by [names]" tooltip
- [ ] Create `src/app/(dashboard)/find-experts/page.tsx`
  - [ ] Search by skill with autocomplete
  - [ ] Experience level filter
  - [ ] Results: UserCard grid
- [ ] Create `src/app/(dashboard)/find-partners/page.tsx`
  - [ ] Select your skills → find users with complementary skills
  - [ ] "Looking for collaboration" filter
- [ ] Add "Find Mentor" CTA in profile settings for beginners

**Tests:**
- [ ] `convex/skill-endorsements.test.ts`
- [ ] `convex/matching.test.ts`

---

## Phase 5 — Community & Groups (Weeks 25-30)

### 5.1 Communities / Groups 🔴 ⏱️ XL

**Schema:**
- [ ] Create `communities` table
  - [ ] Fields: name, slug, description, avatar, banner, type (public/private/secret), category, rules (array), memberCount, createdBy, createdAt
  - [ ] Indexes: by_slug, by_category, by_member_count
- [ ] Create `communityMembers` table
  - [ ] Fields: communityId, userId, role (owner/admin/moderator/member), joinedAt
  - [ ] Indexes: by_community, by_user, by_community_user
- [ ] Add `communityId` field to `posts` table (optional)

**Backend:**
- [ ] Create `convex/communities.ts`
  - [ ] `createCommunity` mutation
  - [ ] `getCommunity` query — by slug
  - [ ] `getCommunities` query — list all, filtered by category/type
  - [ ] `joinCommunity` mutation — handle public/private/secret
  - [ ] `leaveCommunity` mutation
  - [ ] `requestToJoin` mutation (for private)
  - [ ] `approveJoinRequest` mutation (admin only)
  - [ ] `updateCommunity` mutation — edit info (admin only)
  - [ ] `deleteCommunity` mutation — owner only, cascade delete posts/members
  - [ ] `addMember` mutation (admin only, for secret communities)
  - [ ] `removeMember` mutation (admin only)
  - [ ] `updateMemberRole` mutation — promote/demote (owner/admin only)
  - [ ] `getCommunityMembers` query — paginated
  - [ ] `getMyCommunities` query — user's joined communities
- [ ] Update `posts.ts`
  - [ ] Add `communityId` parameter to `createPost`
  - [ ] `getCommunityPosts` query — posts in a community
  - [ ] Add community context to feed posts

**Frontend:**
- [ ] Create `src/app/(dashboard)/communities/page.tsx` — discover communities
  - [ ] Category tabs: All | Academic | Research | Social | Sports | Clubs
  - [ ] Search bar
  - [ ] Community cards with avatar, name, description, member count
  - [ ] "Join" or "Request to Join" button
- [ ] Create `src/app/(dashboard)/c/[slug]/page.tsx` — community page
  - [ ] Banner image, avatar, name, description
  - [ ] Member count, category badge
  - [ ] "Join" / "Leave" / "Joined" button
  - [ ] Tabs: Posts | About | Members
  - [ ] Community feed (posts within this community)
  - [ ] Pinned posts at top
- [ ] Create community composer:
  - [ ] When creating post, dropdown to select community (or leave blank for personal feed)
- [ ] Create `src/components/communities/CommunityCard.tsx`
- [ ] Create `src/components/communities/CommunityInfoSidebar.tsx`
  - [ ] Rules list
  - [ ] Moderators list
  - [ ] "Report Community" link
- [ ] Create `src/app/(dashboard)/c/[slug]/members/page.tsx`
  - [ ] Member list with role badges
  - [ ] Search members
  - [ ] Admin controls (remove, promote) if viewer is admin
- [ ] Create `src/app/(dashboard)/c/[slug]/settings/page.tsx` — community settings (admin only)
  - [ ] Edit name, description, avatar, banner
  - [ ] Add/remove rules
  - [ ] Community type toggle (public/private)
  - [ ] Delete community button
- [ ] Add post flair support:
  - [ ] Community settings: define flairs (e.g., "Question", "Discussion", "Announcement")
  - [ ] Post composer: select flair dropdown
  - [ ] Display flair badge on post cards

**Tests:**
- [ ] `convex/communities.test.ts`
- [ ] `src/app/(dashboard)/c/[slug]/page.test.tsx`

---

### 5.2 Nested Comment Threads 🟡 ⏱️ M

**Schema:**
- [ ] Add to `comments` table:
  - [ ] `parentCommentId`: optional Id<"comments">
  - [ ] `depth`: number (0 = top-level)
  - [ ] `replyCount`: number

**Backend:**
- [ ] Update `convex/comments.ts`
  - [ ] `createComment` mutation — accept `parentCommentId` parameter
  - [ ] Calculate depth (parent.depth + 1), max depth = 5
  - [ ] Increment `replyCount` on parent comment
  - [ ] `getCommentReplies` query — get replies to a comment, paginated
  - [ ] `deleteComment` mutation — cascade delete all child comments
- [ ] Update `getPostComments` query to return tree structure or flat with depth

**Frontend:**
- [ ] Update `CommentList.tsx` to support nesting
  - [ ] Indent replies (margin-left based on depth)
  - [ ] "View replies (N)" toggle button
  - [ ] Collapse/expand branches
  - [ ] "Continue this thread →" link at depth 5
- [ ] Update `CommentComposer.tsx` to support replying to comments
  - [ ] "Reply" button on each comment
  - [ ] Shows composer inline below comment
  - [ ] "Replying to @username" indicator with cancel button
- [ ] Sort options for top-level comments: Best | New | Old | Controversial
  - [ ] Dropdown in CommentList header
  - [ ] "Best" = highest engagement (likes + replies)
  - [ ] "Controversial" = high replies but low likes

**Tests:**
- [ ] `convex/comments.test.ts` — nested operations
- [ ] `src/components/posts/CommentList.test.tsx` — tree rendering

---

### 5.3 Events & Scheduling 🟡 ⏱️ L

**Schema:**
- [ ] Create `events` table
  - [ ] Fields: title, description, organizerId, communityId, eventType, startDate, endDate, location, virtualLink, isRecurring, maxAttendees, attendeeCount, createdAt
  - [ ] Indexes: by_start_date, by_organizer, by_community
- [ ] Create `eventRSVPs` table
  - [ ] Fields: eventId, userId, status (going/maybe/not_going), createdAt
  - [ ] Indexes: by_event, by_user

**Backend:**
- [ ] Create `convex/events.ts`
  - [ ] `createEvent` mutation
  - [ ] `updateEvent` mutation — organizer only
  - [ ] `deleteEvent` mutation — organizer only
  - [ ] `rsvpEvent` mutation — set status
  - [ ] `getEvent` query — by ID
  - [ ] `getUpcomingEvents` query — future events, paginated
  - [ ] `getUserEvents` query — events user RSVPed to
  - [ ] `getCommunityEvents` query — events in a community
  - [ ] `getEventAttendees` query — users who RSVPed "going"
- [ ] Event reminders:
  - [ ] Convex cron job (every hour) → check events starting in 24h or 1h → create notifications

**Frontend:**
- [ ] Create `src/app/(dashboard)/events/page.tsx`
  - [ ] Tabs: Upcoming | My Events | Past
  - [ ] Calendar view (monthly grid) using `react-big-calendar`
  - [ ] List view (default)
  - [ ] Filter by event type, community, date range
- [ ] Create `src/app/(dashboard)/events/[id]/page.tsx` — event details page
  - [ ] Banner, title, description
  - [ ] Date, time, location/virtual link
  - [ ] RSVP buttons: Going | Maybe | Not Going (selected state)
  - [ ] Attendee list (avatars)
  - [ ] Event discussion section (comments)
  - [ ] "Add to Calendar" button → iCal export
- [ ] Create `src/components/events/CreateEventModal.tsx`
  - [ ] Form: title, description, type, date/time pickers, location or virtual link
  - [ ] Max attendees (optional)
  - [ ] Recurring event toggle (future enhancement)
- [ ] Add "Create Event" button to community page (for admins)
- [ ] Show upcoming events widget in community sidebar
- [ ] Event notifications:
  - [ ] Reminder 24h before
  - [ ] Reminder 1h before
  - [ ] New events from joined communities

**Google Calendar Integration (optional):**
- [ ] Generate iCal file for download
- [ ] "Add to Google Calendar" button with pre-filled URL

**Tests:**
- [ ] `convex/events.test.ts`
- [ ] `src/app/(dashboard)/events/[id]/page.test.tsx`

---

## Phase 6 — Professional & Academic Tools (Weeks 31-36)

### 6.1 Research Collaboration Hub 🟢 ⏱️ L

**Schema:**
- [ ] Create `papers` table
  - [ ] Fields: title, abstract, authors (array), doi, pdfUrl, uploadedBy, tags, citationCount, createdAt
  - [ ] Indexes: by_uploaded_by, by_tags
- [ ] Create `paperAuthors` table (many-to-many)
  - [ ] Fields: paperId, userId
- [ ] Add `researchInterests` field to `users` table (array of strings)

**Backend:**
- [ ] Create `convex/papers.ts`
  - [ ] `uploadPaper` mutation — upload PDF + metadata
  - [ ] `updatePaper` mutation — edit metadata
  - [ ] `deletePaper` mutation
  - [ ] `getPaper` query
  - [ ] `searchPapers` query — by title, authors, tags
  - [ ] `getUserPapers` query — papers authored by user

**Frontend:**
- [ ] Create `src/app/(dashboard)/research/page.tsx`
  - [ ] Search papers
  - [ ] Filter by tags, authors
  - [ ] Paper cards with title, authors, abstract preview
- [ ] Create `src/app/(dashboard)/research/[id]/page.tsx` — paper details
  - [ ] Full metadata
  - [ ] PDF viewer (embed or download)
  - [ ] Citation info
  - [ ] Authors list (clickable to profiles)
  - [ ] "Looking for collaborators" flag
- [ ] Add research interests to profile edit
- [ ] Add publications section to profile page

**Tests:**
- [ ] `convex/papers.test.ts`

---

### 6.2 Academic Portfolio 🟢 ⏱️ M

**Schema:**
- [ ] Create `projects` table
  - [ ] Fields: userId, title, description, techStack (array), links (array), screenshots (array), startDate, endDate, createdAt
  - [ ] Indexes: by_user
- [ ] Create `timeline` table (academic milestones)
  - [ ] Fields: userId, type (course/certification/publication/award), title, institution, date, createdAt
  - [ ] Indexes: by_user

**Backend:**
- [ ] Create `convex/portfolio.ts`
  - [ ] `addProject` mutation
  - [ ] `updateProject` mutation
  - [ ] `deleteProject` mutation
  - [ ] `getProjects` query — user's projects
  - [ ] `addTimelineItem` mutation
  - [ ] `deleteTimelineItem` mutation
  - [ ] `getTimeline` query — user's timeline

**Frontend:**
- [ ] Create `src/app/(dashboard)/profile/[id]/portfolio/page.tsx`
  - [ ] Sub-tab on profile page
  - [ ] Project cards with screenshots, description, tech stack, links
- [ ] Create `src/components/portfolio/ProjectCard.tsx`
- [ ] Create `src/components/portfolio/Timeline.tsx`
  - [ ] Vertical timeline with milestones
- [ ] Create `src/components/portfolio/ContributionHeatmap.tsx`
  - [ ] GitHub-style activity grid showing daily post/comment activity
  - [ ] Use `react-calendar-heatmap` or custom canvas
- [ ] Add "Download Resume" button (PDF generation)
  - [ ] Use `jsPDF` or server-side PDF generation
  - [ ] Auto-generate from profile data

**Tests:**
- [ ] `convex/portfolio.test.ts`
- [ ] `src/components/portfolio/ContributionHeatmap.test.tsx`

---

### 6.3 Job / Internship Board 🟡 ⏱️ L

**Schema:**
- [ ] Create `jobs` table
  - [ ] Fields: title, company, description, type (job/internship), location, remote, duration, skillsRequired (array), salary, postedBy, expiresAt, applicantCount, createdAt
  - [ ] Indexes: by_posted_by, by_expires_at
- [ ] Create `jobApplications` table
  - [ ] Fields: jobId, userId, coverLetter, resume (optional file), status (applied/viewed/shortlisted/rejected), createdAt
  - [ ] Indexes: by_job, by_user, by_user_job

**Backend:**
- [ ] Create `convex/jobs.ts`
  - [ ] `postJob` mutation — faculty or verified users only
  - [ ] `updateJob` mutation
  - [ ] `deleteJob` mutation
  - [ ] `getJob` query
  - [ ] `searchJobs` query — filters: role, location, remote, skills, duration
  - [ ] `applyToJob` mutation — creates application
  - [ ] `getJobApplications` query — for job poster
  - [ ] `getUserApplications` query — for applicant
  - [ ] `updateApplicationStatus` mutation — job poster only

**Frontend:**
- [ ] Create `src/app/(dashboard)/jobs/page.tsx`
  - [ ] Search bar + filters sidebar
  - [ ] Job cards: title, company, location, salary, skills
  - [ ] "Apply" button
- [ ] Create `src/app/(dashboard)/jobs/[id]/page.tsx` — job details
  - [ ] Full description
  - [ ] "Easy Apply" button → modal with pre-filled profile data
  - [ ] Cover letter textarea (optional)
  - [ ] Resume upload (optional)
- [ ] Create `src/components/jobs/JobApplicationModal.tsx`
- [ ] Create `src/app/(dashboard)/jobs/my-applications/page.tsx` — track applications
  - [ ] List of applied jobs with status badges
- [ ] Create `src/app/(dashboard)/jobs/post/page.tsx` — post a job (faculty/recruiters)
- [ ] Job alerts:
  - [ ] Save search preferences
  - [ ] Get notification when matching job is posted

**Tests:**
- [ ] `convex/jobs.test.ts`
- [ ] `src/app/(dashboard)/jobs/page.test.tsx`

---

### 6.4 Study Resources & Q&A 🟡 ⏱️ XL

**Schema:**
- [ ] Create `resources` table
  - [ ] Fields: title, description, fileUrl, course, subject, uploadedBy, rating, downloadCount, createdAt
  - [ ] Indexes: by_course, by_uploaded_by
- [ ] Create `questions` table
  - [ ] Fields: title, content, askedBy, course, tags, viewCount, upvotes, downvotes, acceptedAnswerId, createdAt
  - [ ] Indexes: by_asked_by, by_course, by_tags
- [ ] Create `answers` table
  - [ ] Fields: questionId, content, answeredBy, upvotes, downvotes, isAccepted, createdAt
  - [ ] Indexes: by_question, by_answered_by

**Backend:**
- [ ] Create `convex/resources.ts`
  - [ ] `uploadResource` mutation
  - [ ] `getResources` query — filtered by course/subject
  - [ ] `rateResource` mutation
  - [ ] `downloadResource` mutation (increment count)
- [ ] Create `convex/questions.ts`
  - [ ] `askQuestion` mutation
  - [ ] `answerQuestion` mutation
  - [ ] `voteQuestion` mutation — upvote/downvote
  - [ ] `voteAnswer` mutation
  - [ ] `acceptAnswer` mutation — question asker only
  - [ ] `getQuestions` query — sorted by votes, recent, or unanswered
  - [ ] `getQuestion` query — with answers

**Frontend:**
- [ ] Create `src/app/(dashboard)/resources/page.tsx`
  - [ ] Filter by course, subject, file type
  - [ ] Resource cards with preview, rating, download button
- [ ] Create `src/app/(dashboard)/q-and-a/page.tsx` — Stack Overflow style
  - [ ] Question list with vote counts, answer counts
  - [ ] Tabs: Newest | Unanswered | Top Voted
  - [ ] "Ask Question" button
- [ ] Create `src/app/(dashboard)/q-and-a/[id]/page.tsx` — question details
  - [ ] Question content with upvote/downvote buttons
  - [ ] Answers list sorted by votes
  - [ ] Accepted answer highlighted (green checkmark)
  - [ ] "Write Answer" composer
- [ ] Create `src/components/qa/AskQuestionModal.tsx`
- [ ] Add reputation system integration (Phase 6.5)

**Tests:**
- [ ] `convex/questions.test.ts`
- [ ] `src/app/(dashboard)/q-and-a/page.test.tsx`

---

### 6.5 Achievement & Gamification 🟢 ⏱️ M

**Schema:**
- [ ] Create `achievements` table
  - [ ] Fields: userId, badge, name, description, earnedAt
  - [ ] Indexes: by_user
- [ ] Add to `users` table:
  - [ ] `reputation`: number (default: 0)
  - [ ] `level`: number (default: 1)

**Backend:**
- [ ] Create `convex/gamification.ts`
  - [ ] `awardReputation` utility — called by other mutations
  - [ ] `checkAchievements` action — triggered after certain events
  - [ ] `unlockAchievement` mutation
  - [ ] `getAchievements` query — user's earned badges
  - [ ] `getLeaderboard` query — top users by reputation (weekly/monthly/all-time, by university)
- [ ] Define reputation rules:
  - [ ] Post created: +10
  - [ ] Comment created: +5
  - [ ] Receive like/reaction: +1
  - [ ] Receive comment: +2
  - [ ] Skill endorsed: +3
  - [ ] Answer accepted (Q&A): +15
- [ ] Define achievement badges (see roadmap for list)
- [ ] Trigger achievement checks on relevant events
- [ ] Calculate level from reputation: `level = floor(sqrt(reputation / 10))`

**Frontend:**
- [ ] Add reputation score and level to profile header
  - [ ] Display as badge or progress bar
- [ ] Create `src/app/(dashboard)/leaderboard/page.tsx`
  - [ ] Tabs: Weekly | Monthly | All Time
  - [ ] Filter by university
  - [ ] Ranked list with avatars, names, reputation, level
- [ ] Create `src/components/gamification/AchievementBadge.tsx`
  - [ ] Show on profile page
  - [ ] Grid of earned badges
  - [ ] Locked badges (grayed out) for unearned
- [ ] Create achievement notification:
  - [ ] Toast/modal when achievement unlocked
  - [ ] Confetti animation
- [ ] Add XP progress bar to navbar or profile
- [ ] Weekly challenges (future enhancement):
  - [ ] "Post 3 times this week" → bonus XP
  - [ ] Track progress in challenges page

**Tests:**
- [ ] `convex/gamification.test.ts`
- [ ] Achievement unlock integration test

---

## Phase 7 — Monetization & Growth (Weeks 37-42)

### 7.1 Premium Features (Campus Connect Pro) 🔵 ⏱️ L

**Schema:**
- [ ] Add to `users` table:
  - [ ] `isPro`: boolean (default: false)
  - [ ] `proExpiresAt`: number (optional)
  - [ ] `isVerified`: boolean (default: false)

**Backend:**
- [ ] Create `convex/subscriptions.ts`
  - [ ] `upgradeToPro` mutation — integrate with Stripe
  - [ ] `cancelPro` mutation
  - [ ] `checkProStatus` query
- [ ] Premium feature gates (check `isPro` in queries/mutations):
  - [ ] Advanced search filters
  - [ ] Profile analytics (who viewed)
  - [ ] Larger file uploads (100MB vs 25MB)
  - [ ] Custom profile themes

**Payment Integration:**
- [ ] Set up Stripe account and API keys
- [ ] Create Stripe products and price plans
- [ ] Integrate `@stripe/stripe-js` in frontend
- [ ] Create checkout session flow
- [ ] Handle webhooks: `customer.subscription.created`, `customer.subscription.deleted`

**Frontend:**
- [ ] Create `src/app/(dashboard)/settings/billing/page.tsx`
  - [ ] Pricing table: Free vs Pro comparison
  - [ ] "Upgrade to Pro" button → Stripe checkout
  - [ ] Current subscription status
  - [ ] Cancel subscription button
- [ ] Add Pro badge (✓) to profiles
- [ ] Add "Pro only" locks on gated features
- [ ] Create `src/components/premium/UpgradeModal.tsx` — upsell when hitting limits

**Tests:**
- [ ] `convex/subscriptions.test.ts`
- [ ] Stripe webhook handling test

---

### 7.2 Advertising Platform 🔵 ⏱️ XL

**Schema:**
- [ ] Create `ads` table
  - [ ] Fields: title, content, imageUrl, linkUrl, advertiserId, targetUniversity, targetRole, targetSkills, budget, impressions, clicks, status, expiresAt, createdAt
  - [ ] Indexes: by_advertiser, by_status
- [ ] Create `adImpressions` table
  - [ ] Fields: adId, userId, viewedAt
- [ ] Create `adClicks` table
  - [ ] Fields: adId, userId, clickedAt

**Backend:**
- [ ] Create `convex/ads.ts`
  - [ ] `createAd` mutation — faculty, organizations, or sponsored users
  - [ ] `getAds` query — fetch active ads matching user's targeting
  - [ ] `recordImpression` mutation
  - [ ] `recordClick` mutation
  - [ ] `getAdAnalytics` query — for advertiser
- [ ] Ad delivery algorithm:
  - [ ] Target by university, role, skills
  - [ ] Frequency cap (max 1 ad per 10 posts)
  - [ ] Rotation to avoid fatigue

**Frontend:**
- [ ] Update `FeedContainer.tsx` to inject sponsored posts
  - [ ] "Sponsored" badge on ad posts
  - [ ] Ad content styled slightly different (border or background)
- [ ] Create `src/app/(dashboard)/ads/create/page.tsx` — ad creation tool
  - [ ] Form: title, content, image upload, link, targeting options, budget
  - [ ] Preview of ad
- [ ] Create `src/app/(dashboard)/ads/dashboard/page.tsx` — ad analytics
  - [ ] Impressions, clicks, CTR
  - [ ] Chart of performance over time

**Tests:**
- [ ] `convex/ads.test.ts`
- [ ] Ad injection test

---

### 7.3 Campus Marketplace 🔵 ⏱️ L

**Schema:**
- [ ] Create `listings` table
  - [ ] Fields: title, description, category, price, condition, images (array), sellerId, university, status (active/sold/expired), expiresAt, createdAt
  - [ ] Indexes: by_seller, by_category, by_university, by_status

**Backend:**
- [ ] Create `convex/marketplace.ts`
  - [ ] `createListing` mutation
  - [ ] `updateListing` mutation
  - [ ] `deleteListing` mutation
  - [ ] `markAsSold` mutation
  - [ ] `getListings` query — filter by category, price range, university
  - [ ] `getListing` query
- [ ] Auto-expire listings after 30 days (Convex cron job)

**Frontend:**
- [ ] Create `src/app/(dashboard)/marketplace/page.tsx`
  - [ ] Category tabs: All | Books | Electronics | Furniture | Services
  - [ ] Listing cards with image, title, price, condition
  - [ ] "Post Listing" button
- [ ] Create `src/app/(dashboard)/marketplace/[id]/page.tsx` — listing details
  - [ ] Images gallery
  - [ ] Description, price, condition
  - [ ] Seller profile link
  - [ ] "Message Seller" button → open DM
- [ ] Create `src/components/marketplace/CreateListingModal.tsx`
- [ ] Add "Marketplace" to navbar

**Tests:**
- [ ] `convex/marketplace.test.ts`
- [ ] `src/app/(dashboard)/marketplace/page.test.tsx`

---

### 7.4 Push Notifications & Email Digests 🟡 ⏱️ L

**Push Notifications:**
- [ ] Register Service Worker in `src/app/layout.tsx`
- [ ] Request notification permission on first login
- [ ] Implement Web Push API
  - [ ] Generate VAPID keys
  - [ ] Subscribe user to push notifications (save subscription in Convex)
  - [ ] Send push notifications from backend via web-push library
- [ ] Notification triggers:
  - [ ] New message
  - [ ] New comment on your post
  - [ ] Someone followed you
  - [ ] Event reminder

**Backend:**
- [ ] Create `convex/push-notifications.ts`
  - [ ] `subscribeToPush` mutation — store subscription
  - [ ] `sendPushNotification` action — send via web-push
  - [ ] Integrate with notification system to trigger pushes

**Email Digests:**
- [ ] Choose email service: Resend, SendGrid, or AWS SES
- [ ] Create email templates (React Email or MJML):
  - [ ] Daily digest: top posts, new followers, notifications
  - [ ] Weekly digest: summary of activity
- [ ] Create `convex/email-digests.ts`
  - [ ] Convex cron job (daily at 9am) → send digests
  - [ ] `generateDigest` action — compile user activity
  - [ ] `sendEmail` action — call email service API
- [ ] Add email preferences to Settings:
  - [ ] Toggle daily/weekly digests
  - [ ] Toggle individual email notifications

**Tests:**
- [ ] Push notification subscription test
- [ ] Email generation test (template rendering)

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

### Database Backup & Recovery 🔴 ⏱️ S

- [ ] Convex automatic backups (enabled by default)
- [ ] Document backup restoration procedure
- [ ] Set up point-in-time recovery process
- [ ] Test backup restoration quarterly

---

### Security Hardening 🔴 ⏱️ M

- [ ] Content Security Policy (CSP) headers
  - [ ] Add to `next.config.js`
  - [ ] Restrict script sources, image sources
- [ ] CORS configuration
  - [ ] Restrict origins in Convex HTTP API
- [ ] Input sanitization review
  - [ ] Audit all user inputs for XSS/injection vulnerabilities
  - [ ] Add property-based fuzz testing
- [ ] Add CAPTCHA to sign-up form (Google reCAPTCHA or hCaptcha)
- [ ] Implement CSRF protection
- [ ] Add security headers middleware:
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Strict-Transport-Security
- [ ] Conduct security audit (hire external firm or use automated tools)

---

### Performance Optimization 🟡 ⏱️ M

- [ ] Code splitting with dynamic imports
  - [ ] Lazy load rich text editor
  - [ ] Lazy load video player
  - [ ] Lazy load charts/analytics components
- [ ] Virtualize long lists
  - [ ] Use `@tanstack/react-virtual` for feed, chat history, member lists
- [ ] Optimize bundle size
  - [ ] Run `@next/bundle-analyzer`
  - [ ] Tree-shake unused dependencies
  - [ ] Replace heavy libraries (e.g., Moment.js → date-fns)
- [ ] Implement Service Worker for offline support
  - [ ] Cache shell and critical routes
  - [ ] Offline fallback page
- [ ] Add ISR (Incremental Static Regeneration)
  - [ ] Public profiles: 5min revalidation
  - [ ] Landing page: 1hr revalidation
  - [ ] Help pages: staticically generated

---

### Database Sharding (1M+ users) 🔵 ⏱️ XL

- [ ] Shard by university
  - [ ] Partition users, posts, comments by universityId
  - [ ] Cross-shard queries for global feed
- [ ] Convex supports automatic sharding; monitor and scale as needed

---

### Microservices Extraction (1M+ users) 🔵 ⏱️ XL

- [ ] Extract chat service
  - [ ] Dedicated WebSocket server for real-time messaging
  - [ ] Separate database for messages
- [ ] Extract notification service
  - [ ] Event-driven with Kafka or Inngest
  - [ ] Separate delivery workers
- [ ] Extract recommendation engine
  - [ ] Python microservice with ML models
  - [ ] Batch job orchestration with Temporal or Airflow

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
