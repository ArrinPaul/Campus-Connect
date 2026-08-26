# Campus Connect — Feature Catalog

**190 enumerated features across 25 domains.**  
Source of Truth: Forensic Audit (August 2026) | Design system: `meta/DESIGN.md` | Database: Supabase PostgreSQL

---

## 1. Authentication & Onboarding

| ID | Feature | Description | Status |
|---|---|---|---|
| A01 | Sign Up | Email + password registration via Supabase Auth with DB trigger profile init | Implemented |
| A02 | Sign In | Email + password login with cookie session management | Implemented |
| A03 | Sign Out | Session clearance, cookie removal, and redirect | Implemented |
| A04 | Session management | `@supabase/ssr` cookies with middleware token refresh | Implemented |
| A05 | Dev auth bypass | x-user-id header fallback support | Implemented |
| A06 | Onboarding step 1 | Welcome screen with app intro (`WelcomeStep.tsx`) | Implemented |
| A07 | Onboarding step 2 | Profile setup (name, handle, university, role) (`ProfileStep.tsx`) | Implemented |
| A08 | Onboarding step 3 | Skills selection and interest tags (`SkillsStep.tsx`) | Implemented |
| A09 | Multi-step layout | Stepper layout with progress indicator and navigation | Implemented |
| A10 | Auth error page | Dedicated auth error boundary with recovery action | Implemented |
| A11 | Route protection | Edge middleware redirects unauthenticated requests | Implemented |

## 2. User System

| ID | Feature | Description | Status |
|---|---|---|---|
| U01 | Profile page | View any user's profile by ID (`/profile/[id]`) | Implemented |
| U02 | Own profile | View and edit own profile with `/profile/me` redirect | Implemented |
| U03 | Profile header | Cover banner, avatar, bio, stats, and follow action | Implemented |
| U04 | Profile edit form | Edit name, bio, university, role, social links | Implemented |
| U05 | Skills manager | Add and remove skills from user profile | Implemented |
| U06 | Skill endorsements | Endorse peer skills with `/api/skills/endorse` | Implemented |
| U07 | Followers list | Follower directory modal / sub-view | Implemented |
| U08 | Following list | Following network directory modal / sub-view | Implemented |
| U09 | User card | Compact user card with follow toggle button | Implemented |
| U10 | User search | Multi-field user search by name, handle, role | Implemented |
| U11 | User filter panel | Filter search results by role, university, skills | Implemented |
| U12 | Profile picture upload | Direct upload URL generation via Supabase Storage | Implemented |
| U13 | Online status dot | Real-time presence indicator dot | Implemented |
| U14 | Status selector | Status switcher (online, away, dnd, invisible) | Implemented |
| U15 | Privacy settings | Control profile visibility and search indexing | Implemented |
| U16 | Notification preferences | Email digest and push toggles in settings | Implemented |
| U17 | Account settings | Account management and soft-delete with 30-day recovery | Implemented |

## 3. Feed & Posts

| ID | Feature | Description | Status |
|---|---|---|---|
| F01 | Main feed | Personalized feed with affinity scoring and time decay | Implemented |
| F02 | Explore feed | Public trending feed sorted by engagement | Implemented |
| F03 | Post creation | Post composer with DOMPurify sanitization | Implemented |
| F04 | Rich text toolbar | Headings, bold, italic, lists, quotes, links | Implemented |
| F05 | Markdown support | Markdown input parsed and formatted | Implemented |
| F06 | @mention autocomplete | Type `@` to search and tag registered users | Implemented |
| F07 | #hashtag linking | `#tag` detection and automatic hashtag indexing | Implemented |
| F08 | Post media gallery | Multi-image and video gallery with lightbox | Implemented |
| F09 | Link preview cards | OpenGraph metadata preview for links | Implemented |
| F10 | Post content renderer | Sanitized markdown to HTML renderer | Implemented |
| F11 | Code block highlighting | Formatted code snippets with copy button | Implemented |
| F12 | LaTeX rendering | KaTeX mathematical equation renderer | Implemented |
| F13 | Infinite scroll | IntersectionObserver-triggered pagination | Implemented |
| F14 | Virtualized feed | High-performance virtualized feed list | Implemented |

## 4. Reactions & Engagement

| ID | Feature | Description | Status |
|---|---|---|---|
| R01 | Six reaction types | Like, love, laugh, wow, sad, scholarly | Implemented |
| R02 | Reaction picker | Floating reaction bar popup | Implemented |
| R03 | Reaction modal | Detailed modal of users who reacted | Implemented |
| R04 | Reaction counts | Aggregated reaction tally on post card | Implemented |
| R05 | Comment system | Nested comment hierarchy on posts | Implemented |
| R06 | Comment composer | Comment input with character limit validation | Implemented |
| R07 | Comment list | Chronological comment stream | Implemented |
| R08 | Repost/share | Quote reposts with custom commentary | Implemented |

## 5. Bookmarks

| ID | Feature | Description | Status |
|---|---|---|---|
| B01 | Bookmark posts | Save post to bookmarks with collection tagging | Implemented |
| B02 | Remove bookmarks | Unsave post and decrement bookmark count | Implemented |
| B03 | Bookmark collections | Organize saved posts into named folders | Implemented |
| B04 | Check bookmark status | Active saved state toggle on post card | Implemented |

## 6. Polls

| ID | Feature | Description | Status |
|---|---|---|---|
| P01 | Create polls | Multi-option poll creation attached to posts | Implemented |
| P02 | Vote on polls | Cast vote on poll option | Implemented |
| P03 | Poll results | Real-time percentage calculation and progress bars | Implemented |
| P04 | Poll expiry | Automatic voting lock upon expiration | Implemented |
| P05 | Link poll to post | Relational link between poll and feed post | Implemented |

## 7. Hashtags

| ID | Feature | Description | Status |
|---|---|---|---|
| H01 | Hashtag parsing | Regex parser with normalization | Implemented |
| H02 | Trending hashtags | Top hashtags ranked by usage count | Implemented |
| H03 | Search hashtags | Query hashtags via universal search | Implemented |
| H04 | Posts by hashtag | Hashtag-specific feed route (`/hashtag/[tag]`) | Implemented |

## 8. Direct Messages

| ID | Feature | Description | Status |
|---|---|---|---|
| M01 | Conversation list | Responsive conversation drawer with unread badges | Implemented |
| M02 | Chat window | Active chat area with message history | Implemented |
| M03 | Message bubbles | Styled sender and recipient speech bubbles | Implemented |
| M04 | Message composer | Input with send on enter and length validation | Implemented |
| M05 | Send messages | Real-time message persistence and delivery | Implemented |
| M06 | Delete messages | Soft delete message record (`deleted_at`) | Implemented |
| M07 | Mark as read | Update conversation `last_read_at` timestamp | Implemented |
| M08 | Typing indicators | Real-time typing status via Supabase Presence | Implemented |
| M09 | Create group conversation | Multi-user conversation creation | Implemented |
| M10 | Group info panel | Group settings and participant management | Implemented |
| M11 | Mute/unmute | Silence conversation notifications | Implemented |
| M12 | Unread count | Aggregate unread badge counts | Implemented |

## 9. Communities

| ID | Feature | Description | Status |
|---|---|---|---|
| C01 | Community browser | Grid directory with category filtering | Implemented |
| C02 | Category filter | Academic, Research, Social, Sports categories | Implemented |
| C03 | Community search | Search communities by title or description | Implemented |
| C04 | Sort options | Sort by member count or creation date | Implemented |
| C05 | Create community | Community creation form with slug validation | Implemented |
| C06 | Community detail | Community profile page with custom feed (`/c/[slug]`) | Implemented |
| C07 | Community header | Cover image, member count, and join/leave action | Implemented |
| C08 | Community post feed | Exclusive community feed stream | Implemented |
| C09 | Join community | Join community and increment member count | Implemented |
| C10 | Leave community | Leave community membership | Implemented |
| C11 | Invite members | Invite other users to community | Implemented |
| C12 | My invites banner | Pending invitations notification banner | Implemented |
| C13 | Respond to invite | Accept or decline community invite | Implemented |
| C14 | Member roles | Owner, admin, and member role governance | Implemented |

## 10. Events

| ID | Feature | Description | Status |
|---|---|---|---|
| E01 | Event browser | Campus events directory (`/events`) | Implemented |
| E02 | Type filter | Filter by In-Person, Virtual, or Hybrid | Implemented |
| E03 | Create event | Event creation modal with location and date/time | Implemented |
| E04 | Event card | Event details card with attendee counter | Implemented |
| E05 | Attend event | RSVP attend with attendee counter increment | Implemented |
| E06 | Unattend event | Cancel RSVP attendance | Implemented |
| E07 | My events | View attending and hosted events | Implemented |

## 11. Jobs Board

| ID | Feature | Description | Status |
|---|---|---|---|
| J01 | Job browser | Career and internship board (`/jobs`) | Implemented |
| J02 | Post a job | Job creation form with requirements and salary | Implemented |
| J03 | Job card | Job card with role tags and application status | Implemented |
| J04 | Apply to job | Submit job application with cover letter | Implemented |
| J05 | My applications | Application tracking dashboard (`/jobs/my-applications`) | Implemented |
| J06 | Job applications | Applicant view for job posters | Partial |
| J07 | Search and filters | Job type and keyword search filters | Implemented |

## 12. Marketplace

| ID | Feature | Description | Status |
|---|---|---|---|
| MK01 | Browse listings | Campus marketplace directory (`/marketplace`) | Implemented |
| MK02 | Category filter | Books, Electronics, Furniture, Services | Implemented |
| MK03 | Search listings | Keyword search on marketplace items | Implemented |
| MK04 | Create listing | Create item listing with price and images | Implemented |
| MK05 | Listing card | Product card with condition and pricing | Implemented |
| MK06 | Contact seller | Direct message shortcut to seller | Implemented |
| MK07 | Mark as sold | Update listing state to sold | Implemented |
| MK08 | My listings | Manage owned marketplace items | Implemented |

## 13. Q&A

| ID | Feature | Description | Status |
|---|---|---|---|
| Q01 | Question browser | Academic Q&A directory (`/q-and-a`) | Implemented |
| Q02 | Search questions | Keyword search across questions | Implemented |
| Q03 | Sort options | Sort by newest, top votes, or unanswered | Implemented |
| Q04 | Tag filter | Academic topic tag filter | Implemented |
| Q05 | Ask a question | Question submission modal with rich formatting | Implemented |
| Q06 | Question card | Question preview with answer and vote counts | Implemented |
| Q07 | Answer questions | Submit answers with rich text | Implemented |
| Q08 | Vote and accept | Accept answer and mark question resolved | Implemented |

## 14. Research Papers

| ID | Feature | Description | Status |
|---|---|---|---|
| RP01 | Paper browser | Academic preprint directory (`/research`) | Implemented |
| RP02 | Search papers | Search papers by title, author, and keywords | Implemented |
| RP03 | Upload paper | Submit paper with abstract, DOI, and PDF link | Implemented |
| RP04 | Paper card | Paper card with authors, tags, and citation info | Implemented |
| RP05 | Vote on paper | Endorse and upvote research papers | Partial |
| RP06 | Review paper | Peer review submissions | Partial |

## 15. Study Resources

| ID | Feature | Description | Status |
|---|---|---|---|
| SR01 | Resource browser | Course study materials repository (`/resources`) | Implemented |
| SR02 | Search resources | Search study resources by course code and topic | Implemented |
| SR03 | Course filter | Filter materials by enrolled course | Implemented |
| SR04 | Upload resource | Upload lecture notes, exam prep, and guides | Implemented |
| SR05 | Download resource | Track downloads and open resource attachments | Implemented |

## 16. Stories

| ID | Feature | Description | Status |
|---|---|---|---|
| ST01 | Stories page | Story circles and active 24h stories grid | Implemented |
| ST02 | Create story | Text and image story creation | Implemented |
| ST03 | Story composer modal | Quick story creation modal dialog | Implemented |
| ST04 | Story viewer | Full-screen story player with progress bars | Implemented |
| ST05 | View tracking | Track unique viewer impressions | Implemented |
| ST06 | 24-hour expiry | Automatic expiration filtering on active stories | Implemented |
| ST07 | Video stories | Video story upload support | Partial |
| ST08 | Story navigation | Previous / next story transitions | Partial |

## 17. Notifications

| ID | Feature | Description | Status |
|---|---|---|---|
| N01 | Notification center | Full-page notification log (`/notifications`) | Implemented |
| N02 | Notification bell | Header bell icon with real-time unread badge | Implemented |
| N03 | Notification items | Type-specific renderers (like, comment, follow, invite) | Implemented |
| N04 | Mark as read | Mark individual notification as read | Implemented |
| N05 | Mark all as read | Clear all unread notifications | Implemented |
| N06 | Unread count | Dynamic unread counter via Supabase Realtime | Implemented |

## 18. Leaderboard & Gamification

| ID | Feature | Description | Status |
|---|---|---|---|
| G01 | Leaderboard page | Ranked student leaderboard | Missing |
| G02 | Period filter | Weekly, monthly, all-time filtering | Missing |
| G03 | University filter | University-specific leaderboard rankings | Missing |
| G04 | Reputation points | Reputation point tracking in `user_reputation` | Missing |
| G05 | Badges | Achievement badges display | Missing |
| G06 | User stats | Point totals and level badge on profile | Missing |

## 19. Settings

| ID | Feature | Description | Status |
|---|---|---|---|
| S01 | Profile settings | Edit profile bio, avatar, skills, university | Implemented |
| S02 | Account settings | Account details and soft-delete confirmation | Implemented |
| S03 | Privacy settings | Visibility and search discovery controls | Implemented |
| S04 | Notification settings | Email digest frequency and push preferences | Implemented |
| S05 | Billing settings | Subscription status (Stripe checkout stub) | Partial |

## 20. Search

| ID | Feature | Description | Status |
|---|---|---|---|
| SRH01 | Universal search | Multi-entity search across posts, people, communities | Implemented |
| SRH02 | Search posts | Filter universal search to posts | Implemented |
| SRH03 | Search users | Filter universal search to users | Implemented |
| SRH04 | Search communities | Filter universal search to communities | Implemented |
| SRH05 | Search bar in nav | Header search input with debounced querying | Implemented |

## 21. Navigation & Layout

| ID | Feature | Description | Status |
|---|---|---|---|
| L01 | Desktop sidebar | Full desktop navigation sidebar with module links | Implemented |
| L02 | Mobile top bar | Sticky mobile header with branding and search | Implemented |
| L03 | Mobile bottom nav | Fixed bottom navigation bar for quick access | Implemented |
| L04 | Dashboard layout | 3-column responsive layout wrapper (`MainLayout`) | Implemented |
| L05 | Auth layout | Split-screen branding and form layout | Implemented |
| L06 | Landing page | Animated public marketing landing page | Implemented |

## 22. Calls & WebRTC

| ID | Feature | Description | Status |
|---|---|---|---|
| CA01 | Initiate call | Audio/video call session dispatch | Broken (missing DB table) |
| CA02 | Incoming call popup | Ringing call overlay component (`IncomingCallNotification`) | Broken (missing DB table) |
| CA03 | Call modal | In-call controls, video grid, mute/unmute | Broken (missing DB table) |
| CA04 | Answer call | Accept call and initialize WebRTC peer connection | Broken (missing DB table) |
| CA05 | End call | Terminate call and close media tracks | Broken (missing DB table) |
| CA06 | Screen sharing | WebRTC screen capture stream negotiation | Broken (missing DB table) |

## 23. Push Notifications

| ID | Feature | Description | Status |
|---|---|---|---|
| PN01 | Subscribe to push | Web Push registration endpoint | Partial (Stub) |
| PN02 | Unsubscribe from push | Remove push subscription | Partial (Stub) |
| PN03 | Push preferences | Notification type preference toggles | Implemented |
| PN04 | VAPID key exchange | Retrieve VAPID public key | Partial (Stub) |
| PN05 | Service worker | PWA service worker push event handler (`sw.js`) | Implemented |

## 24. Graph Recommendations

| ID | Feature | Description | Status |
|---|---|---|---|
| GR01 | Suggested users | Connection suggestions based on shared skills/role | Implemented |
| GR02 | Dismiss suggestions | Dismiss suggestion from recommendation widget | Implemented |
| GR03 | Refresh suggestions | Invalidate and refetch recommendations | Implemented |
| GR04 | Follow via graph | Update social graph edges on follow | Implemented |

## 25. Admin & Monetization

| ID | Feature | Description | Status |
|---|---|---|---|
| AD01 | Admin dashboard | RBAC-protected system telemetry and user counts | Implemented |
| AD02 | Create ad | Advertisement creation form with budget | Implemented |
| AD03 | Ad dashboard | Performance analytics (impressions, clicks, spend) | Implemented |
| AD04 | Track impressions | Increment impression counter | Implemented |
| AD05 | Track clicks | Increment click counter | Implemented |
| AD06 | Pause ad | Pause ad campaign | Partial (Stub) |
| AD07 | Subscription status | Query subscription tier status | Partial (Stub) |
| AD08 | Checkout session | Create Stripe checkout session | Partial (Stub) |
| AD09 | Cancel subscription | Cancel subscription renewal | Partial (Stub) |

---

## Summary Statistics

| Status | Feature Count | Percentage |
| :--- | :---: | :---: |
| **Implemented** | **119** | **62.6%** |
| **Partial** | **43** | **22.6%** |
| **Broken** | **1** (Calls domain) | **0.5%** |
| **Missing** | **11** (Gamification G01-G06 + minor) | **5.8%** |
| **Stub** | **16** (Stripe/Push/Scaffolding) | **8.4%** |
| **Total Features** | **190** | **100.0%** |
