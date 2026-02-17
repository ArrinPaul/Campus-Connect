# Campus Connect — Development TODO

> Actionable task list derived from FEATURE_ROADMAP.md
> Last Updated: February 17, 2026

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

### 1.1 Reactions System 🔴 ⏱️ M

**Schema:**
- [ ] Create `reactions` table in `convex/schema.ts`
  - [ ] Add fields: userId, targetId, targetType, type, createdAt
  - [ ] Add indexes: by_target, by_user_target

**Backend (Convex):**
- [ ] Create `convex/reactions.ts`
  - [ ] `addReaction` mutation — validate reaction type, prevent duplicates, upsert
  - [ ] `removeReaction` mutation — authorization check
  - [ ] `getReactions` query — for a post/comment, group by type with counts
  - [ ] `getUserReaction` query — check what user reacted with

**Frontend:**
- [ ] Create `src/components/posts/ReactionPicker.tsx`
  - [ ] 6 reaction buttons: 👍 Like, ❤️ Love, 😂 Laugh, 😮 Wow, 😢 Sad, 🎓 Scholarly
  - [ ] Animated hover/popup picker
  - [ ] Show on hover for desktop, long-press for mobile
- [ ] Update `PostCard.tsx`
  - [ ] Replace like button with reaction picker
  - [ ] Show reaction summary bar (top 3 emoji + count)
  - [ ] Click summary → modal showing who reacted with what
- [ ] Update `CommentList.tsx` — add reaction picker to comments
- [ ] Create `src/components/posts/ReactionModal.tsx` — list of users per reaction type

**Updates:**
- [ ] Remove old `likes` table references (keep for migration)
- [ ] Migrate existing likes to "like" reactions (write migration script)
- [ ] Update `posts` table: replace `likeCount` with `reactionCounts` object

**Tests:**
- [ ] `convex/reactions.test.ts` — unit tests for mutations/queries
- [ ] `src/components/posts/ReactionPicker.test.tsx` — interaction tests

---

### 1.2 Bookmarks / Save Posts 🟡 ⏱️ S

**Schema:**
- [ ] Create `bookmarks` table in `convex/schema.ts`
  - [ ] Add fields: userId, postId, collectionName, createdAt
  - [ ] Add indexes: by_user, by_user_and_post, by_user_and_collection

**Backend:**
- [ ] Create `convex/bookmarks.ts`
  - [ ] `addBookmark` mutation — save post to collection (default: "Saved")
  - [ ] `removeBookmark` mutation
  - [ ] `getBookmarks` query — fetch user's bookmarks, paginated
  - [ ] `getCollections` query — list unique collection names for user
  - [ ] `isBookmarked` query — check if user bookmarked a post

**Frontend:**
- [ ] Create `src/app/(dashboard)/bookmarks/page.tsx`
  - [ ] Collection tabs/filter
  - [ ] Grid of bookmarked posts
  - [ ] Empty state with CTA
- [ ] Update `PostCard.tsx`
  - [ ] Add bookmark icon button (outline when not saved, filled when saved)
  - [ ] Collection selector dropdown on bookmark (optional)
- [ ] Add "Bookmarks" to sidebar navigation
- [ ] Create `src/components/bookmarks/CollectionSelector.tsx`

**Tests:**
- [ ] `convex/bookmarks.test.ts`
- [ ] `src/app/(dashboard)/bookmarks/page.test.tsx`

---

### 1.3 Hashtags & Trending 🔴 ⏱️ L

**Schema:**
- [ ] Create `hashtags` table
  - [ ] Fields: tag (lowercase, normalized), postCount, lastUsedAt
  - [ ] Indexes: by_tag, by_post_count
- [ ] Create `postHashtags` table (many-to-many)
  - [ ] Fields: postId, hashtagId
  - [ ] Indexes: by_post, by_hashtag

**Backend:**
- [ ] Create `convex/hashtags.ts`
  - [ ] `extractHashtags(content: string)` utility — regex to find #tags
  - [ ] Update `posts.ts` → `createPost` mutation to extract & create hashtags
  - [ ] `getTrending` query — top 10 hashtags by engagement in last 24h
  - [ ] `getPostsByHashtag` query — paginated posts with a specific tag
  - [ ] `searchHashtags` query — autocomplete for hashtag input
  - [ ] Convex cron job (every 6h) to update trending cache

**Frontend:**
- [ ] Update `PostComposer.tsx`
  - [ ] Syntax highlight hashtags as user types (blue color)
  - [ ] Autocomplete dropdown for existing hashtags
- [ ] Create `src/app/(dashboard)/hashtag/[tag]/page.tsx` — hashtag feed page
- [ ] Create `src/components/trending/TrendingHashtags.tsx` widget
  - [ ] Show top 10 trending hashtags
  - [ ] Click → navigate to hashtag page
- [ ] Add trending sidebar to feed page
- [ ] Update `PostCard.tsx` — make hashtags in content clickable links

**Utilities:**
- [ ] `lib/hashtag-utils.ts`
  - [ ] `normalizeHashtag(tag: string)` — lowercase, trim
  - [ ] `renderHashtagsAsLinks(content: string)` — React component

**Tests:**
- [ ] `convex/hashtags.test.ts`
- [ ] `lib/hashtag-utils.test.ts`

---

### 1.4 Notification System 🔴 ⏱️ XL

**Schema:**
- [ ] Create `notifications` table
  - [ ] Fields: recipientId, actorId, type, referenceId, message, isRead, createdAt
  - [ ] Indexes: by_recipient, by_recipient_unread

**Backend:**
- [ ] Create `convex/notifications.ts`
  - [ ] `createNotification` mutation — called by other mutations
  - [ ] `getNotifications` query — paginated, with filters (All/Mentions/Reactions/Follows)
  - [ ] `markAsRead` mutation — single or bulk
  - [ ] `markAllAsRead` mutation
  - [ ] `getUnreadCount` query — real-time subscription
  - [ ] `deleteNotification` mutation
- [ ] Update existing mutations to trigger notifications:
  - [ ] `posts.ts` → `likePost` (or `addReaction`) → notify post author
  - [ ] `comments.ts` → `createComment` → notify post author + mentioned users
  - [ ] `follows.ts` → `followUser` → notify followed user
  - [ ] Add mention detection in posts/comments → notify mentioned users

**Frontend:**
- [ ] Create `src/components/notifications/NotificationBell.tsx`
  - [ ] Bell icon in navbar
  - [ ] Unread badge count (red dot)
  - [ ] Dropdown with recent 5 notifications on click
  - [ ] "View All" link to notifications page
- [ ] Create `src/app/(dashboard)/notifications/page.tsx`
  - [ ] Tabs: All / Mentions / Reactions / Follows
  - [ ] Notification list with avatars, messages, timestamps
  - [ ] Mark as read on view (IntersectionObserver)
  - [ ] "Mark all as read" button
  - [ ] Empty state
- [ ] Create `src/components/notifications/NotificationItem.tsx`
  - [ ] Different layouts per notification type
  - [ ] Click → navigate to referenced post/profile
  - [ ] Unread indicator (blue dot or bold text)
- [ ] Add notification preferences to Settings page
  - [ ] Toggle each notification type on/off

**Tests:**
- [ ] `convex/notifications.test.ts`
- [ ] `src/components/notifications/NotificationBell.test.tsx`
- [ ] `src/app/(dashboard)/notifications/page.test.tsx`

---

### 1.5 Mentions & Tagging 🟡 ⏱️ M

**Backend:**
- [ ] Create `lib/mention-utils.ts`
  - [ ] `extractMentions(content: string)` — regex to find @username
  - [ ] `parseMentionsToLinks(content: string)` — convert to clickable links
- [ ] Update `posts.ts` → `createPost` mutation
  - [ ] Extract mentions, trigger notifications for mentioned users
- [ ] Update `comments.ts` → `createComment` mutation (same)
- [ ] Create `convex/users.ts` → `searchUsersByUsername` query for autocomplete

**Frontend:**
- [ ] Create `src/components/composer/MentionAutocomplete.tsx`
  - [ ] Detect `@` character in textarea
  - [ ] Show dropdown with matching users (search as you type)
  - [ ] Arrow keys + Enter to select
  - [ ] Insert `@username` on selection
- [ ] Update `PostComposer.tsx` — integrate mention autocomplete
- [ ] Update `CommentComposer.tsx` — integrate mention autocomplete
- [ ] Update `PostCard.tsx` — render mentions as blue clickable links
- [ ] Update `CommentList.tsx` — render mentions as blue clickable links

**Styling:**
- [ ] Blue text color for mentions: `text-blue-600 dark:text-blue-400`
- [ ] Hover underline

**Tests:**
- [ ] `lib/mention-utils.test.ts`
- [ ] `src/components/composer/MentionAutocomplete.test.tsx`

---

### 1.6 Share / Repost 🟡 ⏱️ M

**Schema:**
- [ ] Create `reposts` table
  - [ ] Fields: userId, originalPostId, quoteContent, createdAt
  - [ ] Indexes: by_user, by_original_post
- [ ] Add `shareCount` field to `posts` table

**Backend:**
- [ ] Create `convex/reposts.ts`
  - [ ] `createRepost` mutation — plain repost or quote post
  - [ ] `deleteRepost` mutation — own reposts only
  - [ ] `getReposts` query — get reposts of a post
  - [ ] `hasUserReposted` query — check if user reposted
- [ ] Update `posts.ts` → `getFeedPosts` to include reposts in feed

**Frontend:**
- [ ] Update `PostCard.tsx`
  - [ ] Add share button with count
  - [ ] Share dropdown: "Repost" | "Quote Post" | "Copy Link" | "Share via..."
  - [ ] Native Web Share API integration (mobile)
- [ ] Create `src/components/posts/RepostModal.tsx`
  - [ ] For quote posts — show original post preview + textarea for comment
  - [ ] Character limit: 500 chars
- [ ] Update feed to show reposts
  - [ ] "🔁 [User] reposted" header
  - [ ] Show original post card nested
  - [ ] For quote posts, show user's comment above original

**Tests:**
- [ ] `convex/reposts.test.ts`
- [ ] `src/components/posts/RepostModal.test.tsx`

---

## Phase 2 — Real-Time Communication (Weeks 7-12)

### 2.1 Direct Messaging 🔴 ⏱️ XL

**Schema:**
- [ ] Create `conversations` table
  - [ ] Fields: participantIds (sorted array), lastMessageId, lastMessageAt, createdAt
  - [ ] Indexes: by_last_message
- [ ] Create `messages` table
  - [ ] Fields: conversationId, senderId, content, messageType, attachmentUrl, attachmentName, replyToId, status, isDeleted, createdAt
  - [ ] Indexes: by_conversation, by_sender
- [ ] Create `conversationParticipants` table
  - [ ] Fields: conversationId, userId, lastReadMessageId, isMuted, joinedAt
  - [ ] Indexes: by_user, by_conversation

**Backend:**
- [ ] Create `convex/conversations.ts`
  - [ ] `getOrCreateConversation` mutation — find existing or create new
  - [ ] `getConversations` query — list user's conversations with preview
  - [ ] `getConversation` query — full conversation details
  - [ ] `muteConversation` mutation
  - [ ] `deleteConversation` mutation (soft delete for user)
- [ ] Create `convex/messages.ts`
  - [ ] `sendMessage` mutation — text, image, file types
  - [ ] `getMessages` query — paginated, oldest-first
  - [ ] `deleteMessage` mutation — for me / for everyone
  - [ ] `markAsRead` mutation — update lastReadMessageId
  - [ ] `editMessage` mutation (optional)
- [ ] Create `convex/presence.ts`
  - [ ] `updatePresence` mutation — update online status, typing indicator
  - [ ] `getPresence` query — check if user is online
  - [ ] `setTyping` mutation — set typing indicator for conversation

**Frontend:**
- [ ] Create `src/app/(dashboard)/messages/page.tsx`
  - [ ] Two-column layout (conversation list + chat area)
  - [ ] Mobile: stack views, back button
- [ ] Create `src/components/messages/ConversationList.tsx`
  - [ ] List of conversations
  - [ ] Avatar, name, last message preview, timestamp, unread badge
  - [ ] Search conversations
- [ ] Create `src/components/messages/ChatArea.tsx`
  - [ ] Header: recipient avatar, name, online status
  - [ ] Message list (virtualized with `react-window`)
  - [ ] Message composer at bottom
  - [ ] Typing indicator
- [ ] Create `src/components/messages/MessageBubble.tsx`
  - [ ] Sent (right, blue) vs received (left, gray)
  - [ ] Timestamp, read receipts (✓✓)
  - [ ] Support text, images, files
  - [ ] Reply indicator if replyToId exists
  - [ ] Long-press/right-click menu: Reply, Delete, Copy
- [ ] Create `src/components/messages/MessageComposer.tsx`
  - [ ] Textarea with emoji picker
  - [ ] File/image upload button
  - [ ] Send button
  - [ ] Typing indicator trigger (debounced)
- [ ] Create `src/components/messages/TypingIndicator.tsx`
  - [ ] Animated "..." dots
  - [ ] "[User] is typing..."
- [ ] Add "Messages" to navbar with unread count badge
- [ ] Implement message notifications (via notification system)
- [ ] Real-time subscription for new messages (Convex reactive queries)

**File Upload:**
- [ ] Integrate Convex file storage or S3 for attachments
- [ ] Image preview before send
- [ ] File size validation (max 25MB)

**Tests:**
- [ ] `convex/conversations.test.ts`
- [ ] `convex/messages.test.ts`
- [ ] `src/components/messages/ChatArea.test.tsx`
- [ ] Integration test: send/receive message flow

---

### 2.2 Group Chat 🟡 ⏱️ L

**Schema Updates:**
- [ ] Add `type` field to `conversations` table: "direct" | "group"
- [ ] Add `name`, `avatar`, `description` fields to `conversations` (for groups)
- [ ] Add `role` field to `conversationParticipants`: "owner" | "admin" | "member"

**Backend:**
- [ ] Update `convex/conversations.ts`
  - [ ] `createGroup` mutation — name, avatar, initial members
  - [ ] `addGroupMember` mutation — admin only
  - [ ] `removeGroupMember` mutation — admin only
  - [ ] `leaveGroup` mutation
  - [ ] `updateGroupInfo` mutation — edit name, avatar, description
  - [ ] `promoteToAdmin` / `demoteFromAdmin` mutations
  - [ ] `pinMessage` mutation
  - [ ] `getPinnedMessages` query

**Frontend:**
- [ ] Create `src/components/messages/CreateGroupModal.tsx`
  - [ ] Group name input
  - [ ] Add members (multi-select from followers)
  - [ ] Avatar upload
- [ ] Update `ChatArea.tsx` to handle group context
  - [ ] Show member count in header
  - [ ] Group info sidebar toggle
- [ ] Create `src/components/messages/GroupInfoPanel.tsx`
  - [ ] Member list with roles
  - [ ] Shared media grid
  - [ ] Leave group button
  - [ ] Admin controls (add/remove members, promote)
  - [ ] Pinned messages section
- [ ] Update `MessageBubble.tsx` — show sender name in groups

**Tests:**
- [ ] `convex/conversations.test.ts` — group operations
- [ ] `src/components/messages/CreateGroupModal.test.tsx`

---

### 2.3 Presence & Activity Status 🟢 ⏱️ M

**Schema:**
- [ ] Add to `users` table:
  - [ ] `status`: "online" | "away" | "dnd" | "invisible"
  - [ ] `customStatus`: string (optional)
  - [ ] `lastSeenAt`: number

**Backend:**
- [ ] Update `convex/presence.ts`
  - [ ] `updateStatus` mutation — set status (online/away/dnd/invisible)
  - [ ] `setCustomStatus` mutation — custom message
  - [ ] Heartbeat mechanism — update `lastSeenAt` every 60s (client-side interval)
  - [ ] `getOnlineUsers` query — users online in the last 5 minutes

**Frontend:**
- [ ] Add online status indicator (green dot) to:
  - [ ] User avatars in chat
  - [ ] User cards on profiles
  - [ ] Conversation list
- [ ] Create `src/components/ui/OnlineStatusDot.tsx` — reusable component
- [ ] Add status selector in Settings or navbar dropdown
  - [ ] Online / Away / Do Not Disturb / Invisible
  - [ ] Custom status input field
- [ ] Add "Last seen [time]" in profile headers (privacy-aware, respects invisible)
- [ ] Implement heartbeat in `src/app/layout.tsx` — ping every 60s when tab active

**Privacy:**
- [ ] Add privacy setting: "Show online status" toggle in Settings

**Tests:**
- [ ] `convex/presence.test.ts`

---

### 2.4 Voice & Video Calls 🔵 ⏱️ XL

> **Note:** Defer to Phase 2 stretch goal or later. Requires WebRTC + TURN/STUN server.

**Research & Planning:**
- [ ] Evaluate WebRTC libraries: `simple-peer`, `peerjs`, `livekit-client`
- [ ] Choose TURN/STUN provider: Twilio, LiveKit, Agora, or self-hosted
- [ ] Design call flow: initiate → ring → accept → in-call → end

**Backend:**
- [ ] Create `convex/calls.ts`
  - [ ] `initiateCall` mutation — create call record, notify recipient
  - [ ] `acceptCall` mutation
  - [ ] `rejectCall` mutation
  - [ ] `endCall` mutation
  - [ ] `getCallHistory` query
- [ ] Integrate with chosen WebRTC service (signaling via Convex or external)

**Frontend:**
- [ ] Create `src/components/calls/CallModal.tsx` — full-screen call UI
  - [ ] Video tiles, audio meters
  - [ ] Controls: mute, video toggle, screen share, end call
- [ ] Create `src/components/calls/IncomingCallNotification.tsx` — ringtone + accept/reject
- [ ] Add call buttons to DM chat header

**Infrastructure:**
- [ ] Set up TURN/STUN server or API keys
- [ ] Handle NAT traversal and firewall issues
- [ ] Implement call quality indicators

---

## Phase 3 — Content & Media Platform (Weeks 13-18)

### 3.1 Rich Media Posts 🔴 ⏱️ XL

**Schema:**
- [ ] Add to `posts` table:
  - [ ] `mediaUrls`: array of strings (image/video URLs)
  - [ ] `mediaType`: "image" | "video" | "file" | "link"
  - [ ] `linkPreview`: object (url, title, description, image)

**Backend:**
- [ ] Update `convex/posts.ts` → `createPost` mutation to handle media uploads
- [ ] Create `convex/media.ts`
  - [ ] `generateUploadUrl` mutation — for images/videos/files
  - [ ] `processImage` action — compress, resize, generate thumbnails (Convex actions + Sharp.js or Cloudflare Images)
  - [ ] `processVideo` action — generate thumbnail (FFmpeg via external service or Cloud Function)
  - [ ] `fetchLinkPreview` action — fetch Open Graph metadata from URL
- [ ] File validation:
  - [ ] Image: JPEG, PNG, GIF, WebP, max 10MB each, max 10 images
  - [ ] Video: MP4, WebM, max 100MB, max 1 video per post
  - [ ] File: PDF, DOCX, PPTX, max 25MB

**Frontend:**
- [ ] Update `PostComposer.tsx`
  - [ ] Media upload area with drag-and-drop
  - [ ] Multiple file selection
  - [ ] Image preview grid with remove button
  - [ ] Video preview with thumbnail
  - [ ] File preview with icon + filename
  - [ ] Automatic link detection → fetch preview
  - [ ] Upload progress indicators
- [ ] Create `src/components/posts/MediaGallery.tsx`
  - [ ] Grid layout for multiple images (1-4 images: different grid templates)
  - [ ] Single video player with controls
  - [ ] File download button
- [ ] Create `src/components/posts/ImageLightbox.tsx`
  - [ ] Full-screen image viewer
  - [ ] Swipe/arrow navigation through gallery
  - [ ] Zoom in/out
  - [ ] Close button
- [ ] Create `src/components/posts/LinkPreviewCard.tsx`
  - [ ] Show favicon, title, description, image
  - [ ] Click → open link in new tab
- [ ] Update `PostCard.tsx` to render media
- [ ] Create `src/components/posts/CodeBlock.tsx` — syntax highlighting with Prism.js or Shiki
- [ ] LaTeX rendering integration:
  - [ ] Install `katex`
  - [ ] Create `src/components/posts/LaTeXRenderer.tsx`
  - [ ] Parse inline `$...$` and block `$$...$$` in post content

**Infrastructure:**
- [ ] Migrate from Convex file storage to Cloudflare R2 or AWS S3 (for large files)
- [ ] Set up CDN for media delivery
- [ ] Implement image optimization pipeline

**Tests:**
- [ ] `convex/media.test.ts`
- [ ] `src/components/posts/MediaGallery.test.tsx`
- [ ] Upload integration test

---

### 3.2 Stories / Ephemeral Content 🟡 ⏱️ M

**Schema:**
- [ ] Create `stories` table
  - [ ] Fields: authorId, content, mediaUrl, backgroundColor, expiresAt, viewCount, createdAt
  - [ ] Indexes: by_author, by_expiry
- [ ] Create `storyViews` table
  - [ ] Fields: storyId, viewerId, viewedAt
  - [ ] Indexes: by_story, by_viewer

**Backend:**
- [ ] Create `convex/stories.ts`
  - [ ] `createStory` mutation — upload image or text-on-color
  - [ ] `getStories` query — from followed users, not expired, not viewed by current user
  - [ ] `getStoryById` query
  - [ ] `viewStory` mutation — increment view count, record view
  - [ ] `getStoryViewers` query — who viewed (for author only)
  - [ ] `deleteStory` mutation — own stories only
- [ ] Convex cron job (every hour) → delete expired stories

**Frontend:**
- [ ] Create `src/app/(dashboard)/stories/page.tsx` — story viewer
  - [ ] Full-screen story display
  - [ ] Tap left/right or swipe to navigate
  - [ ] Progress bars at top (one per story)
  - [ ] Auto-advance after 5 seconds
  - [ ] Swipe up/down to skip user
  - [ ] Close button
- [ ] Create `src/components/stories/StoryRing.tsx`
  - [ ] Circular avatar with gradient ring (blue if unseen, gray if seen)
  - [ ] Show on top of feed, profiles, navbar
- [ ] Create `src/components/stories/StoryComposer.tsx`
  - [ ] Camera/gallery upload
  - [ ] Text-on-color mode (background picker, text input)
  - [ ] Preview before posting
  - [ ] "Add to Story" button in navbar
- [ ] Create story creator flow:
  - [ ] Click "+" on story ring → open composer modal
  - [ ] Select image or text mode
  - [ ] Post → creates story with 24h expiry
- [ ] Show story rings:
  - [ ] Horizontal scroll row at top of feed
  - [ ] On profile header (own profile)
  - [ ] In navbar (if user has active stories)

**Tests:**
- [ ] `convex/stories.test.ts`
- [ ] `src/app/(dashboard)/stories/page.test.tsx`
- [ ] Story expiry cron job test

---

### 3.3 Polls & Surveys 🟢 ⏱️ M

**Schema:**
- [ ] Create `polls` table
  - [ ] Fields: postId, options (array of {id, text, voteCount}), totalVotes, endsAt, isAnonymous, createdAt
  - [ ] Indexes: by_post
- [ ] Create `pollVotes` table
  - [ ] Fields: pollId, userId, optionId, createdAt
  - [ ] Indexes: by_poll, by_user_poll

**Backend:**
- [ ] Create `convex/polls.ts`
  - [ ] `createPoll` mutation — linked to a post, 2-6 options, duration
  - [ ] `vote` mutation — validate not expired, upsert vote (allow change)
  - [ ] `getPollResults` query — get vote counts per option
  - [ ] `getUserVote` query — check what user voted for
- [ ] Update `posts.ts` → `createPost` to support poll creation

**Frontend:**
- [ ] Update `PostComposer.tsx`
  - [ ] "Add Poll" button
  - [ ] Poll creation UI: add options (2-6), duration dropdown
- [ ] Create `src/components/posts/PollCard.tsx`
  - [ ] Show options as buttons (before voting)
  - [ ] Show results as progress bars (after voting or after poll ends)
  - [ ] Display total votes and time remaining
  - [ ] Highlight user's vote with checkmark
  - [ ] "Final Results" badge if expired
- [ ] Embed poll in PostCard when post has poll

**Tests:**
- [ ] `convex/polls.test.ts`
- [ ] `src/components/posts/PollCard.test.tsx`

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
