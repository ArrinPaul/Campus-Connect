# Comprehensive Feature Audit: Communities, Events & Messages/Conversations

**Date:** February 24, 2026  
**Scope:** Frontend pages, backend mutations/queries, schema, integration  

---

## Summary

| Area | Sub-features | Fully Working | Issues Found | Missing/Stubbed |
|------|-------------|---------------|--------------|-----------------|
| **Communities** | 10 | 4 | 12 | 0 |
| **Events** | 7 | 4 | 4 | 1 |
| **Messages/Conversations** | 11 | 3 | 13 | 0 |
| **Total** | 28 | 11 | 29 | 1 |

---

## COMMUNITIES

### ✅ Fully Working Sub-features

1. **Create Community** — Form at `/communities/new`, mutation with validation (name length, slug uniqueness, category validation), creator auto-added as owner.
2. **Post in Community** — `CreatePost` component accepts `communityId`, passes it to mutation. `CommunityPostFeed` queries and displays community posts.
3. **Community Detail Page** — `/c/[slug]` loads data via `getCommunity`, renders header, post feed, sidebar with description & rules.
4. **Leave Community** — Leave button in `CommunityHeader`, `leaveCommunity` mutation prevents owners from leaving, decrements member count.

### Issues Found

---

**COMM-01**  
**Severity:** MEDIUM  
**Feature:** List Communities — Search & Filter  
**File(s):** [src/app/(dashboard)/communities/page.tsx](src/app/(dashboard)/communities/page.tsx#L24)  
**Line(s):** 24  
**Problem:** The communities page has a TODO for search and category filter controls. The backend `getCommunities` query fully supports `category` and `search` parameters, but the frontend passes neither.
```tsx
{/* TODO: Add search and filter controls */}
```
The query call on line 11 passes an empty object:
```tsx
const communities = useQuery(api.communities.getCommunities, {});
```
**Fix:** Add a search input and a category dropdown that pass `search` and `category` args to the query. Example:
```tsx
const [search, setSearch] = useState('');
const [category, setCategory] = useState('All');
const communities = useQuery(api.communities.getCommunities, { search, category });
```

---

**COMM-02**  
**Severity:** MEDIUM  
**Feature:** Join Community — Pending State UX  
**File(s):** [src/app/(components)/communities/CommunityHeader.tsx](src/app/(components)/communities/CommunityHeader.tsx#L33-L37)  
**Line(s):** 33-37  
**Problem:** When a user requests to join a private community, their `viewerRole` becomes `"pending"`. But the header's `isMember` check doesn't include `"pending"`:
```tsx
const isMember = community.viewerRole === 'member' || community.viewerRole === 'admin' || community.viewerRole === 'owner';
```
A pending user sees a "Join" button instead of "Pending". Clicking it throws: *"You already have a pending request to join this community"*.  
**Fix:** Add pending state detection and show a disabled "Pending" button:
```tsx
const isPending = community.viewerRole === 'pending';
// In the JSX:
{isPending ? (
    <button disabled className="...">Request Pending</button>
) : ...}
```

---

**COMM-03**  
**Severity:** HIGH  
**Feature:** Community Moderation — No Approve/Reject UI  
**File(s):** [src/app/(dashboard)/c/[slug]/members/page.tsx](src/app/(dashboard)/c/[slug]/members/page.tsx)  
**Line(s):** entire file  
**Problem:** The backend has `approveJoinRequest` mutation, `getCommunityMembers` has `includePending` param, and `removeMember` works for rejecting. But there is **no frontend UI** for admins/owners to:
1. View pending join requests
2. Approve or reject requests  
3. Remove members or update roles

The members page only calls `getCommunityMembers` without `includePending`:
```tsx
const members = useQuery(api.communities.getCommunityMembers, community ? { communityId: community._id } : 'skip');
```
**Fix:** Add an admin panel on the members page: when `viewerRole` is `owner` or `admin`, show a "Pending Requests" section that calls `getCommunityMembers({ communityId, includePending: true })` and provides Approve/Reject buttons.

---

**COMM-04**  
**Severity:** MEDIUM  
**Feature:** Community Moderation — Missing Reject Mutation  
**File(s):** [convex/communities.ts](convex/communities.ts)  
**Line(s):** N/A (missing)  
**Problem:** There is an `approveJoinRequest` mutation but **no** `rejectJoinRequest` mutation. The only way to reject is to call `removeMember`, which is semantically confusing and doesn't send a notification.  
**Fix:** Add a `rejectJoinRequest` mutation that deletes the pending membership and optionally notifies the user.

---

**COMM-05**  
**Severity:** LOW  
**Feature:** Community Members Page — Missing Role Display  
**File(s):** [src/app/(dashboard)/c/[slug]/members/page.tsx](src/app/(dashboard)/c/[slug]/members/page.tsx#L62)  
**Line(s):** 62  
**Problem:** The members page renders each member with a generic `UserCard` component which doesn't display the member's community role (owner/admin/moderator/member). The data from `getCommunityMembers` includes `role`, but it's not shown:
```tsx
<UserCard key={member?.userId} user={member as any} />
```
**Fix:** Either create a `CommunityMemberCard` component that shows role badges, or pass role info to `UserCard` and display it.

---

**COMM-06**  
**Severity:** MEDIUM  
**Feature:** Community Settings — Slug Not Updated on Name Change  
**File(s):** [convex/communities.ts](convex/communities.ts#L253-L308)  
**Line(s):** 253-308  
**Problem:** The `updateCommunity` mutation updates `name` but does **not** regenerate the slug. If a user renames a community, the URL stays the same as the original name, causing permanent URL/name mismatch.
```typescript
if (args.name !== undefined) {
  const name = args.name.trim()
  // ...validates but does NOT update slug
  updates.name = name
}
```
**Fix:** After updating the name, regenerate the slug using the same `slugify` + uniqueness logic as `createCommunity`. Return the new slug so the frontend can redirect.

---

**COMM-07**  
**Severity:** MEDIUM  
**Feature:** Community Settings — Missing Rules, Avatar, Banner & Delete UI  
**File(s):** [src/app/(dashboard)/c/[slug]/settings/page.tsx](src/app/(dashboard)/c/[slug]/settings/page.tsx#L107)  
**Line(s):** 107  
**Problem:** The settings page only has name, description, type, and category. It has a TODO for other sections:
```tsx
{/* TODO: Add sections for members management, rules, etc. */}
```
Missing UI for: rules editor, avatar upload, banner upload, delete community button. Backend supports all of these (`updateCommunity` accepts `rules`, `avatar`, `banner`; `deleteCommunity` exists).  
**Fix:** Add form sections for rules management (add/edit/remove rules), image upload fields for avatar/banner, and a "Delete Community" danger zone section.

---

**COMM-08**  
**Severity:** LOW  
**Feature:** Community Settings — Redirect After Name Change  
**File(s):** [src/app/(dashboard)/c/[slug]/settings/page.tsx](src/app/(dashboard)/c/[slug]/settings/page.tsx#L71-L73)  
**Line(s):** 71-73  
**Problem:** After updating the community name, the page redirects to the OLD slug:
```tsx
if (formData.name !== community?.name) {
    router.push(`/c/${community?.slug}`); // Redirect back to community page, slug might have changed
}
```
Since `updateCommunity` doesn't change the slug (see COMM-06), this actually works, but the comment acknowledges the slug *should* change. Once COMM-06 is fixed, this redirect must use the new slug returned by the mutation.  
**Fix:** Use the result of the `updateCommunity` mutation (which should return the new slug after COMM-06 is fixed).

---

**COMM-09**  
**Severity:** MEDIUM  
**Feature:** Community Categories — No Filter UI  
**File(s):** [src/app/(dashboard)/communities/page.tsx](src/app/(dashboard)/communities/page.tsx#L24)  
**Line(s):** 24  
**Problem:** Same as COMM-01. The backend `getCommunities` supports `category` filtering with the index `by_category`. The communities page does not provide a category filter selector.  
**Fix:** Add a category filter dropdown with the 8 valid categories + "All".

---

**COMM-10**  
**Severity:** LOW  
**Feature:** Community Header — Tabs Not Active-State Aware  
**File(s):** [src/app/(components)/communities/CommunityHeader.tsx](src/app/(components)/communities/CommunityHeader.tsx#L96-L101)  
**Line(s):** 96-101  
**Problem:** The tab navigation in the community header always shows "Posts" as active (hardcoded `border-primary`), regardless of the current page:
```tsx
<Link href={`/c/${community.slug}`} className="py-3 px-1 border-b-2 border-primary text-primary font-semibold">Posts</Link>
<Link href={`/c/${community.slug}/members`} className="py-3 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground">Members</Link>
```
When viewing `/c/slug/members`, the "Members" tab doesn't get the active style.  
**Fix:** Use `usePathname()` to determine the current route and apply the active class conditionally.

---

**COMM-11**  
**Severity:** LOW  
**Feature:** CommunityCard — Banner Image  
**File(s):** [src/app/(components)/communities/CommunityCard.tsx](src/app/(components)/communities/CommunityCard.tsx#L22)  
**Line(s):** 22  
**Problem:** The card always applies `backgroundImage` from `community.banner`, but most communities won't have a banner set. If `community.banner` is undefined, the inline style becomes `url(undefined)`.
```tsx
<div className="h-20 bg-muted" style={{ backgroundImage: `url(${community.banner})`, ... }} />
```
**Fix:** Only apply the backgroundImage style when `community.banner` is truthy:
```tsx
style={community.banner ? { backgroundImage: `url(${community.banner})`, ... } : undefined}
```

---

**COMM-12**  
**Severity:** LOW  
**Feature:** Community Detail — No Community Events Section  
**File(s):** [src/app/(dashboard)/c/[slug]/page.tsx](src/app/(dashboard)/c/[slug]/page.tsx)  
**Line(s):** entire file  
**Problem:** The community detail page shows posts but no events. The backend has `getCommunityEvents` query and events can be linked to communities via `communityId`, but the sidebar or main content doesn't display upcoming community events.  
**Fix:** Add a "Community Events" section in the sidebar or as a tab, querying `api.events.getCommunityEvents`.

---

## EVENTS

### ✅ Fully Working Sub-features

1. **List Events** — `/events` page queries `getUpcomingEvents` with event type filtering. Displays EventCards properly.
2. **Event Detail Page** — `/events/[id]` loads event data, shows dates, location/virtual link, organizer, attendee count.
3. **RSVP** — Going/Maybe/Not Going buttons, upsert behavior, capacity check, attendee count adjustment.
4. **Event Types** — In-person/Virtual/Hybrid display with correct icons. Filter on list page.

### Issues Found

---

**EVT-01**  
**Severity:** HIGH  
**Feature:** Create Event — Button Not Connected to Modal  
**File(s):** [src/app/(dashboard)/events/page.tsx](src/app/(dashboard)/events/page.tsx#L29-L31)  
**Line(s):** 29-31  
**Problem:** The "Create Event" button on the events page is a plain `<button>` with no `onClick` handler. The `CreateEventModal` component exists in `src/components/events/CreateEventModal.tsx` but is **never imported or used** from the events page:
```tsx
{/* TODO: Create /events/create page */}
<button className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold">
    Create Event
</button>
```
**Fix:** Import `CreateEventModal` and toggle it via state:
```tsx
import { CreateEventModal } from '@/components/events/CreateEventModal';
const [showCreateModal, setShowCreateModal] = useState(false);
// Button: onClick={() => setShowCreateModal(true)}
// After button: {showCreateModal && <CreateEventModal onClose={() => setShowCreateModal(false)} />}
```

---

**EVT-02**  
**Severity:** LOW  
**Feature:** Recurring Events — Stub Only  
**File(s):** [convex/events.ts](convex/events.ts#L73), [convex/schema.ts](convex/schema.ts#L499)  
**Line(s):** schema L499, events.ts L73  
**Problem:** The `isRecurring` field is stored as a boolean but there is **no recurrence logic** — no repeat interval, no child event generation, no recurrence pattern. It's just a flag:
```typescript
isRecurring: args.isRecurring ?? false,
```
The `CreateEventModal` also doesn't expose this option.  
**Fix:** Either remove `isRecurring` to avoid confusion, or implement full recurrence support (add `recurrencePattern`, `recurrenceEndDate` fields, cron job to generate recurring instances).

---

**EVT-03**  
**Severity:** MEDIUM  
**Feature:** Community Events — No UI in Community Page  
**File(s):** [src/app/(dashboard)/c/[slug]/page.tsx](src/app/(dashboard)/c/[slug]/page.tsx)  
**Line(s):** entire file  
**Problem:** Backend has `getCommunityEvents` query and events can be linked to communities. But the community detail page doesn't show or link to community events. Users have no way to discover events associated with a community except through the global events page.  
**Fix:** Add an "Events" tab or sidebar section on the community page that queries `api.events.getCommunityEvents`.

---

**EVT-04**  
**Severity:** LOW  
**Feature:** Event Detail — No Virtual Link Display  
**File(s):** [src/app/(dashboard)/events/[id]/page.tsx](src/app/(dashboard)/events/[id]/page.tsx#L69-L73)  
**Line(s):** 69-73  
**Problem:** For virtual/hybrid events, the event detail page shows "Virtual" text but does NOT display the `virtualLink` as a clickable link:
```tsx
{event.location || (event.eventType === 'virtual' ? 'Virtual' : 'Location TBD')}
```
The `event.virtualLink` field is never rendered.  
**Fix:** Add a separate display for the virtual link when present:
```tsx
{event.virtualLink && (
    <a href={event.virtualLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
        <Video className="h-4 w-4" /> Join Meeting
    </a>
)}
```

---

## MESSAGES / CONVERSATIONS

### ✅ Fully Working Sub-features

1. **Conversation List** — `/messages` page with `ConversationList`, unread counts, message previews, relative timestamps.
2. **Send Message** — `ChatInput` sends text messages, `sendMessage` mutation has validation, sanitization, rate limiting.
3. **Message Detail** — `/messages/[id]` for mobile with `ChatWindow`, desktop redirects to main messages page with query param.

### Issues Found

---

**MSG-01**  
**Severity:** HIGH  
**Feature:** Create Conversation — No "New Conversation" Flow  
**File(s):** [src/app/(components)/messages/ConversationList.tsx](src/app/(components)/messages/ConversationList.tsx#L21)  
**Line(s):** 21  
**Problem:** The "+" button to start a new conversation has no `onClick` handler:
```tsx
<button className="text-primary hover:text-primary/80" title="Start new conversation">
    <PlusCircle className="h-6 w-6" />
</button>
```
The only way to start a DM is from a user's profile page (`ProfileHeader.tsx` line 219). Users cannot start a conversation from the messages page itself.  
**Fix:** Wire the button to open a user search modal or list that calls `getOrCreateConversation` on user selection.

---

**MSG-02**  
**Severity:** HIGH  
**Feature:** Group Chat — Dashboard Pages Don't Support Groups  
**File(s):** [src/app/(components)/messages/ChatWindow.tsx](src/app/(components)/messages/ChatWindow.tsx#L42-L43)  
**Line(s):** 42-43  
**Problem:** The `ChatWindow` component rendered by the dashboard page only handles DMs. It shows a single `chatPartner`:
```tsx
const chatPartner = conversation?.participants?.find(p => p._id !== currentUser?._id);
```
For groups, this only shows one member name. There's no group name display, no group info panel, no member management. A more advanced `ChatArea` component exists in `src/components/messages/ChatArea.tsx` that handles groups, but it's **not used** by the dashboard pages.  
**Fix:** Either replace `ChatWindow` usage with `ChatArea` in the dashboard pages, or add group detection to `ChatWindow`:
```tsx
const isGroup = conversation?.type === 'group';
// Show conversation.name for groups, chatPartner.name for DMs
```

---

**MSG-03**  
**Severity:** HIGH  
**Feature:** Message Attachments — Non-Functional UI  
**File(s):** [src/app/(components)/messages/ChatInput.tsx](src/app/(components)/messages/ChatInput.tsx#L48-L50)  
**Line(s):** 48-50  
**Problem:** The attachment button (Plus icon) has no functionality — it's just a visual icon:
```tsx
<button type="button" className="p-2 rounded-full hover:bg-muted" title="Attach file">
    <Plus className="h-5 w-5 text-muted-foreground" />
</button>
```
The backend fully supports `attachmentUrl`, `attachmentName`, and `messageType` fields. No file upload flow exists in this component.  
**Fix:** Add a file input trigger, upload to storage (e.g., Convex file storage), and pass `attachmentUrl`, `attachmentName`, `messageType` to `sendMessage`.

---

**MSG-04**  
**Severity:** HIGH  
**Feature:** Message Attachments — ChatMessage Doesn't Render Attachments  
**File(s):** [src/app/(components)/messages/ChatMessage.tsx](src/app/(components)/messages/ChatMessage.tsx#L14-L15)  
**Line(s):** 14-15  
**Problem:** `ChatMessage` defines `messageType` in its type but only renders text content. Image and file messages are displayed as plain text:
```tsx
messageType: 'text' | 'image' | 'file' | 'system';
// ...
<p className="whitespace-pre-wrap">{message.content}</p>
```
No rendering for `attachmentUrl` (image display, file download link).  
**Fix:** Add conditional rendering based on `messageType`:
```tsx
{message.messageType === 'image' && message.attachmentUrl && (
    <Image src={message.attachmentUrl} alt="Attachment" ... />
)}
{message.messageType === 'file' && message.attachmentUrl && (
    <a href={message.attachmentUrl} download>📎 {message.attachmentName}</a>
)}
```

---

**MSG-05**  
**Severity:** HIGH  
**Feature:** Reply to Message — Not Implemented in Dashboard Chat  
**File(s):** [src/app/(components)/messages/ChatInput.tsx](src/app/(components)/messages/ChatInput.tsx), [src/app/(components)/messages/ChatMessage.tsx](src/app/(components)/messages/ChatMessage.tsx)  
**Line(s):** ChatInput entire file, ChatMessage entire file  
**Problem:** Backend `sendMessage` fully supports `replyToId` and `getMessages` returns `replyToMessage` data. But:
1. `ChatInput` never passes `replyToId` to `sendMessage`
2. `ChatMessage` never renders the `replyToMessage` context
3. There's no "reply" action on message hover/context menu

The advanced `ChatArea.tsx` in `src/components/messages/` does support replies with `replyingTo` state, but isn't used.  
**Fix:** Add `replyToId` prop to `ChatInput`, render reply preview above input, add reply action to `ChatMessage`.

---

**MSG-06**  
**Severity:** MEDIUM  
**Feature:** Read Receipts — No Visual Indicator  
**File(s):** [src/app/(components)/messages/ChatMessage.tsx](src/app/(components)/messages/ChatMessage.tsx)  
**Line(s):** entire file  
**Problem:** Backend has `markAsRead` (auto-called by `ChatWindow`) and `getReadReceipts` query. But `ChatMessage` shows **no read receipt indicator** — no checkmarks, no "Seen" text, no "Read by N" count.  
**Fix:** For DMs, show double-check / "Seen" for the last sent message. For groups, show "Read by N" or avatar dots. Call `getReadReceipts` for the last own message.

---

**MSG-07**  
**Severity:** MEDIUM  
**Feature:** Typing Indicators — Not Used in Dashboard ChatWindow  
**File(s):** [src/app/(components)/messages/ChatWindow.tsx](src/app/(components)/messages/ChatWindow.tsx), [src/app/(components)/messages/ChatInput.tsx](src/app/(components)/messages/ChatInput.tsx)  
**Line(s):** ChatWindow entire file, ChatInput entire file  
**Problem:** The `TypingIndicator` component exists and is imported by the advanced `ChatArea.tsx` in `src/components/messages/`. But the dashboard's `ChatWindow` and `ChatInput`:
1. Do not call `presence.setTyping` when the user types
2. Do not query `presence.getTypingUsers`
3. Do not render `TypingIndicator`

Backend mutations (`setTyping`, `getTypingUsers`, `cleanupTypingIndicators`) and cron cleanup all exist.  
**Fix:** In `ChatInput`, call `setTyping` on input change (debounced). In `ChatWindow`, query `getTypingUsers` and render `TypingIndicator` above the input area.

---

**MSG-08**  
**Severity:** MEDIUM  
**Feature:** Delete Message — No UI  
**File(s):** [src/app/(components)/messages/ChatMessage.tsx](src/app/(components)/messages/ChatMessage.tsx)  
**Line(s):** entire file  
**Problem:** Backend `deleteMessage` mutation supports both "delete for me" and "delete for everyone" (with 15-min window). `editMessage` mutation also exists. But `ChatMessage` has no context menu, hover actions, or swipe actions to trigger delete/edit.  
**Fix:** Add a message action menu (on hover or long-press) with "Delete for me", "Delete for everyone" (if own + within 15 min), and "Edit" options.

---

**MSG-09**  
**Severity:** MEDIUM  
**Feature:** Pin Message — Not Connected in Dashboard  
**File(s):** [src/app/(components)/messages/ChatWindow.tsx](src/app/(components)/messages/ChatWindow.tsx)  
**Line(s):** entire file  
**Problem:** Backend `pinMessage` mutation and `getPinnedMessages` query exist. `GroupInfoPanel` in `src/components/messages/` displays pinned messages. But the dashboard `ChatWindow`:
1. Has no pin action on messages
2. Doesn't show a pinned messages section
3. Doesn't render `GroupInfoPanel`  
**Fix:** Add pin action for group admins/owners in message context menu, display pinned messages bar in header or sidebar.

---

**MSG-10**  
**Severity:** MEDIUM  
**Feature:** Conversation Search — Non-Functional  
**File(s):** [src/app/(components)/messages/ConversationList.tsx](src/app/(components)/messages/ConversationList.tsx#L28-L30)  
**Line(s):** 28-30  
**Problem:** The search input in the conversation list is purely visual. No state, no handler, no query call:
```tsx
<input type="text" placeholder="Search messages..." className="..." />
```
Backend `searchConversations` query exists and works.  
**Fix:** Add state management and wire to `api.conversations.searchConversations`:
```tsx
const [search, setSearch] = useState('');
const searchResults = useQuery(api.conversations.searchConversations, 
    search.trim() ? { searchQuery: search } : 'skip');
```

---

**MSG-11**  
**Severity:** HIGH  
**Feature:** Group Chat — No Create Group UI in Dashboard  
**File(s):** [src/app/(components)/messages/ConversationList.tsx](src/app/(components)/messages/ConversationList.tsx)  
**Line(s):** entire file  
**Problem:** Backend `createGroup` mutation exists. `CreateGroupModal` component exists at `src/components/messages/CreateGroupModal.tsx`. But neither is wired into the dashboard messages page. There is no way for users to create a group chat from the messages UI.  
**Fix:** Wire the "+" button to offer "New DM" and "New Group" options, or add a dedicated "Create Group" button that opens `CreateGroupModal`.

---

**MSG-12**  
**Severity:** LOW  
**Feature:** ChatWindow — Group Display Shows Only One Participant  
**File(s):** [src/app/(components)/messages/ChatWindow.tsx](src/app/(components)/messages/ChatWindow.tsx#L42)  
**Line(s):** 42  
**Problem:** For group chats, the header only finds and displays the first non-current-user participant:
```tsx
const chatPartner = conversation?.participants?.find(p => p._id !== currentUser?._id);
```
Should show the group name and member count for group conversations.  
**Fix:** Check `conversation.type === 'group'` and show `conversation.name` with member count instead of a single participant name.

---

**MSG-13**  
**Severity:** LOW  
**Feature:** Dual Component Architecture — Maintenance Risk  
**File(s):** [src/app/(components)/messages/](src/app/(components)/messages/) and [src/components/messages/](src/components/messages/)  
**Line(s):** N/A  
**Problem:** There are **two parallel implementations** of the messaging UI:
- `src/app/(components)/messages/` — Simple components used by dashboard pages (ChatWindow, ChatInput, ChatMessage, ConversationList, ConversationListItem)
- `src/components/messages/` — Advanced components with full features (ChatArea, MessageBubble, MessageComposer, GroupInfoPanel, CreateGroupModal, TypingIndicator, ConversationList)

The advanced set supports replies, typing indicators, pinned messages, group info, read receipts. The dashboard uses the simple set which lacks all of this.  
**Fix:** Either unify on the advanced components (replace dashboard page imports), or backport missing features into the simple components.

---

## Sub-feature Status Table

| # | Sub-feature | Status | Issue IDs |
|---|-------------|--------|-----------|
| **Communities** |||
| 1 | List Communities | ⚠️ Partial | COMM-01, COMM-09 |
| 2 | Create Community | ✅ Working | — |
| 3 | Community Detail Page | ✅ Working | COMM-12 (minor) |
| 4 | Join Community | ⚠️ Partial | COMM-02 |
| 5 | Leave Community | ✅ Working | — |
| 6 | Community Members Page | ⚠️ Partial | COMM-05 |
| 7 | Community Settings | ⚠️ Partial | COMM-06, COMM-07, COMM-08 |
| 8 | Community Moderation | ⚠️ Partial | COMM-03, COMM-04 |
| 9 | Post in Community | ✅ Working | — |
| 10 | Community Categories | ⚠️ Partial | COMM-01, COMM-09 |
| **Events** |||
| 1 | List Events | ✅ Working | — |
| 2 | Create Event | ❌ Broken | EVT-01 |
| 3 | Event Detail Page | ⚠️ Partial | EVT-04 |
| 4 | RSVP | ✅ Working | — |
| 5 | Event Types | ✅ Working | — |
| 6 | Recurring Events | 🔲 Stubbed | EVT-02 |
| 7 | Community Events | ⚠️ Partial | EVT-03 |
| **Messages/Conversations** |||
| 1 | Conversation List | ⚠️ Partial | MSG-10 |
| 2 | Create Conversation | ❌ Broken | MSG-01 |
| 3 | Send Message | ✅ Working | — |
| 4 | Read Receipts | ⚠️ Partial | MSG-06 |
| 5 | Message Detail | ✅ Working | — |
| 6 | Group Chat | ❌ Broken | MSG-02, MSG-11, MSG-12 |
| 7 | Typing Indicators | ⚠️ Partial | MSG-07 |
| 8 | Message Attachments | ❌ Broken | MSG-03, MSG-04 |
| 9 | Reply to Message | ❌ Broken | MSG-05 |
| 10 | Delete Message | ⚠️ Partial | MSG-08 |
| 11 | Pin Message | ⚠️ Partial | MSG-09 |

---

## Priority Fixes (by impact)

### Critical Path (HIGH severity — broken user workflows)
1. **EVT-01** — Connect Create Event button to modal
2. **MSG-01** — Add "New Conversation" flow on messages page
3. **MSG-02** — Support group chats in dashboard ChatWindow
4. **MSG-03 + MSG-04** — Wire attachment upload and display
5. **MSG-05** — Implement reply-to in dashboard chat
6. **MSG-11** — Add Create Group UI
7. **COMM-03** — Build moderation UI for pending requests

### Important (MEDIUM severity — degraded experience)
8. **COMM-01/09** — Add community search and category filter
9. **COMM-02** — Show pending join state in header
10. **COMM-06** — Update slug on name change
11. **COMM-07** — Add rules, avatar, banner, delete to settings
12. **MSG-06** — Add read receipt indicators
13. **MSG-07** — Wire typing indicators
14. **MSG-08** — Add delete message UI
15. **MSG-09** — Connect pin message feature
16. **MSG-10** — Wire conversation search
17. **EVT-03** — Show community events on community page
18. **COMM-04** — Add reject join request mutation

### Nice-to-have (LOW severity)
19. **COMM-05** — Show roles in member list
20. **COMM-10** — Active tab state for community navigation
21. **COMM-11** — Fix CommunityCard banner rendering
22. **EVT-02** — Implement or remove recurring events
23. **EVT-04** — Display virtual meeting link
24. **MSG-12** — Fix group name display
25. **MSG-13** — Consolidate dual component architecture
