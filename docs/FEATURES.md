# Campus Connect — All Features

**240 features across 25 domains.**
Every feature has an ID for tracking in TRACKER.md.

Design system: DESIGN.md (Meta/Facebook) | Database: Supabase PostgreSQL | Auth: Supabase Auth

---

## 1. Authentication & Onboarding

| ID | Feature | Description | Status |
|---|---|---|---|
| A01 | Sign Up | Email + password registration via Supabase Auth | Rebuild |
| A02 | Sign In | Email + password login via Supabase Auth | Rebuild |
| A03 | Sign Out | Clear session, redirect to sign-in | Rebuild |
| A04 | Session management | httpOnly cookie, auto-refresh tokens | Rebuild |
| A05 | Dev auth bypass | x-user-id header for local development | Keep |
| A06 | Onboarding step 1 | Welcome screen with app intro | Done |
| A07 | Onboarding step 2 | Profile setup (name, university, role) | Done |
| A08 | Onboarding step 3 | Skills selection (add up to 10) | Done |
| A09 | Multi-step layout | Progress indicator, back/next navigation | Done |
| A10 | Auth error page | Friendly error for failed sign-in/sign-up | Done |
| A11 | Route protection | Middleware redirects unauthenticated users | Rebuild |

## 2. User System

| ID | Feature | Description | Status |
|---|---|---|---|
| U01 | Profile page | View any user's profile by ID | Done |
| U02 | Own profile | View and edit own profile | Done |
| U03 | Profile header | Avatar, name, bio, follower/following counts | Done |
| U04 | Profile edit form | Edit name, bio, university, role, skills | Done |
| U05 | Skills manager | Add/remove skills from profile | Done |
| U06 | Skill endorsements | Endorse other users' skills | Done |
| U07 | Followers list | See who follows you | Done |
| U08 | Following list | See who you follow | Done |
| U09 | User card | Compact user view for search results | Done |
| U10 | User search | Search by name, username, email | Done |
| U11 | User filter panel | Filter by role, university, skills | Done |
| U12 | Profile picture upload | Upload and crop avatar image | Rebuild |
| U13 | Online status dot | Green/gray dot on avatars | Done |
| U14 | Status selector | Set online, away, DND, invisible | Done |
| U15 | Privacy settings | Control profile visibility | Done |
| U16 | Notification preferences | Email digest, push notification toggles | Done |
| U17 | Account settings | Email, password, data export, delete account | Done |

## 3. Feed & Posts

| ID | Feature | Description | Status |
|---|---|---|---|
| F01 | Main feed | Posts from followed users + own posts | Done |
| F02 | Explore feed | Trending/public posts for discovery | Done |
| F03 | Post creation | Rich text editor with toolbar | Done |
| F04 | Rich text toolbar | Bold, italic, lists, code, headings, quotes, links | Done |
| F05 | Markdown support | Write in markdown, render as formatted content | Done |
| F06 | @mention autocomplete | Type @ to search and tag users | Done |
| F07 | #hashtag linking | Type # to create searchable hashtags | Done |
| F08 | Post media gallery | Display images/videos in a grid | Done |
| F09 | Link preview cards | Auto-fetch URL metadata for shared links | Done |
| F10 | Post content renderer | Markdown to HTML with syntax highlighting | Done |
| F11 | Code block highlighting | Syntax-highlighted code blocks in posts | Done |
| F12 | LaTeX rendering | Math equations in posts (KaTeX) | Done |
| F13 | Infinite scroll | Load more posts as you scroll down | Done |
| F14 | Virtualized feed | Only render visible posts for performance | Done |

## 4. Reactions & Engagement

| ID | Feature | Description | Status |
|---|---|---|---|
| R01 | Six reaction types | Like, love, laugh, wow, sad, scholarly | Done |
| R02 | Reaction picker | Emoji grid to select reaction | Done |
| R03 | Reaction modal | See who reacted with what | Done |
| R04 | Reaction counts | Show count per type on posts | Done |
| R05 | Comment system | Nested comment threads on posts | Done |
| R06 | Comment composer | Rich text input for comments | Done |
| R07 | Comment list | Paginated comments with load more | Done |
| R08 | Repost/share | Share someone's post to your feed | Done |

## 5. Bookmarks

| ID | Feature | Description | Status |
|---|---|---|---|
| B01 | Bookmark posts | Save posts for later | Done |
| B02 | Remove bookmarks | Unsave a post | Done |
| B03 | Bookmark collections | Organize bookmarks into named groups | Done |
| B04 | Check bookmark status | Show filled/outline bookmark icon | Done |

## 6. Polls

| ID | Feature | Description | Status |
|---|---|---|---|
| P01 | Create polls | Add a poll with 2-6 options to any post | Done |
| P02 | Vote on polls | Select one option per poll | Done |
| P03 | Poll results | Show vote counts and percentages | Done |
| P04 | Poll expiry | Polls close after set time | Done |
| P05 | Link poll to post | Attach existing poll to a post | Done |

## 7. Hashtags

| ID | Feature | Description | Status |
|---|---|---|---|
| H01 | Hashtag parsing | Detect and link #tags in content | Done |
| H02 | Trending hashtags | Top hashtags by post count | Done |
| H03 | Search hashtags | Find hashtags by name | Done |
| H04 | Posts by hashtag | View all posts with a specific hashtag | Done |

## 8. Direct Messages

| ID | Feature | Description | Status |
|---|---|---|---|
| M01 | Conversation list | Left panel with all conversations | Done |
| M02 | Chat window | Message history for selected conversation | Done |
| M03 | Message bubbles | Styled sent/received message layout | Done |
| M04 | Message composer | Text input with send button | Done |
| M05 | Send messages | Create new messages in conversations | Done |
| M06 | Delete messages | Remove sent messages | Done |
| M07 | Mark as read | Mark messages as read | Done |
| M08 | Typing indicators | Show "..." when someone is typing | Done |
| M09 | Create group conversation | Add multiple participants | Done |
| M10 | Group info panel | View/edit group name, members | Done |
| M11 | Mute/unmute | Silence notifications for a conversation | Done |
| M12 | Unread count | Badge showing unread messages per conversation | Done |

## 9. Communities

| ID | Feature | Description | Status |
|---|---|---|---|
| C01 | Community browser | Grid view of all communities | Done |
| C02 | Category filter | Academic, Research, Social, Sports, etc. | Done |
| C03 | Community search | Search by name or description | Done |
| C04 | Sort options | Sort by members or newest | Done |
| C05 | Create community | Form with name, description, category | Done |
| C06 | Community detail | Page by slug with header + feed | Done |
| C07 | Community header | Cover image, name, member count | Done |
| C08 | Community post feed | Posts specific to a community | Done |
| C09 | Join community | Become a member | Done |
| C10 | Leave community | Remove yourself as member | Done |
| C11 | Invite members | Send invitations to other users | Done |
| C12 | My invites banner | Show pending invitations at top | Done |
| C13 | Respond to invite | Accept or decline invitations | Done |
| C14 | Member roles | Admin, moderator, member roles | Done |

## 10. Events

| ID | Feature | Description | Status |
|---|---|---|---|
| E01 | Event browser | List of upcoming events | Done |
| E02 | Type filter | In-person, virtual, hybrid | Done |
| E03 | Create event | Form with title, description, time, location | Done |
| E04 | Event card | Date, time, location, attendee count | Done |
| E05 | Attend event | RSVP to an event | Done |
| E06 | Unattend event | Cancel RSVP | Done |
| E07 | My events | Events you're attending | Done |

## 11. Jobs Board

| ID | Feature | Description | Status |
|---|---|---|---|
| J01 | Job browser | List of available jobs | Done |
| J02 | Post a job | Form with title, company, description, skills | Done |
| J03 | Job card | Title, company, location, salary, skills | Done |
| J04 | Apply to job | Submit application | Done |
| J05 | My applications | Jobs you've applied to | Done |
| J06 | Job applications | See who applied (for job posters) | Done |
| J07 | Search and filters | Search by keyword, filter by type/location | TODO |

## 12. Marketplace

| ID | Feature | Description | Status |
|---|---|---|---|
| MK01 | Browse listings | Grid of marketplace items | Done |
| MK02 | Category filter | Books, electronics, furniture, services, other | Done |
| MK03 | Search listings | Search by title or description | Done |
| MK04 | Create listing | Form with title, price, description, images | Done |
| MK05 | Listing card | Image, title, price, category | Done |
| MK06 | Contact seller | Send message to listing owner | Done |
| MK07 | Mark as sold | Mark listing as sold | Done |
| MK08 | My listings | Items you've listed for sale | Done |

## 13. Q&A

| ID | Feature | Description | Status |
|---|---|---|---|
| Q01 | Question browser | List of questions | Done |
| Q02 | Search questions | Search by keyword | Done |
| Q03 | Sort options | Newest, top votes, unanswered | Done |
| Q04 | Tag filter | Filter by topic tags | Done |
| Q05 | Ask a question | Form with title, content, tags | Done |
| Q06 | Question card | Title, tags, vote count, answer count | Done |
| Q07 | Answer questions | Write answers to questions | Done |
| Q08 | Vote and accept | Upvote answers, mark accepted answer | Done |

## 14. Research Papers

| ID | Feature | Description | Status |
|---|---|---|---|
| RP01 | Paper browser | List of research papers | Done |
| RP02 | Search papers | Search by title, author, tags | Done |
| RP03 | Upload paper | Submit paper with abstract, authors, tags | Done |
| RP04 | Paper card | Title, authors, abstract, tags, vote count | Done |
| RP05 | Vote on paper | Upvote papers you find valuable | Done |
| RP06 | Review paper | Add written review to paper | Done |

## 15. Study Resources

| ID | Feature | Description | Status |
|---|---|---|---|
| SR01 | Resource browser | List of study materials | Done |
| SR02 | Search resources | Search by title or description | Done |
| SR03 | Course filter | Filter by course name | Done |
| SR04 | Upload resource | Submit file with title, course, description | Done |
| SR05 | Download resource | Download attached file | Done |

## 16. Stories

| ID | Feature | Description | Status |
|---|---|---|---|
| ST01 | Stories page | Grid of story preview circles | Done |
| ST02 | Create story | Text or image story | Done |
| ST03 | Story composer modal | Create story in a popup | Done |
| ST04 | Story viewer | Full-screen story display | Done |
| ST05 | View tracking | Count views per story | Done |
| ST06 | 24-hour expiry | Stories auto-delete after 24 hours | Done |
| ST07 | Video stories | Upload and display video stories | TODO |
| ST08 | Story navigation | Previous/next story buttons | TODO |

## 17. Notifications

| ID | Feature | Description | Status |
|---|---|---|---|
| N01 | Notification center | Full page of notifications | Done |
| N02 | Notification bell | Header icon with unread count | Done |
| N03 | Notification items | Type-specific rendering (follow, like, comment, etc.) | Done |
| N04 | Mark as read | Mark individual notification as read | Done |
| N05 | Mark all as read | Clear all unread notifications | Done |
| N06 | Unread count | Badge number on bell icon | Done |

## 18. Leaderboard & Gamification

| ID | Feature | Description | Status |
|---|---|---|---|
| G01 | Leaderboard page | Ranked users by reputation | Done |
| G02 | Period filter | Weekly, monthly, all-time | Done |
| G03 | University filter | Filter by university | Done |
| G04 | Reputation points | Earn points for contributions | Done |
| G05 | Badges | Earn badges for achievements | Done |
| G06 | User stats | Points, level, badges display | Done |

## 19. Settings

| ID | Feature | Description | Status |
|---|---|---|---|
| S01 | Profile settings | Edit name, bio, avatar, skills | Done |
| S02 | Account settings | Email, password, data export | Done |
| S03 | Privacy settings | Profile visibility, search indexing | Done |
| S04 | Notification settings | Email digest frequency, push toggles | Done |
| S05 | Billing settings | Subscription status, payment method | Done |

## 20. Search

| ID | Feature | Description | Status |
|---|---|---|---|
| SRH01 | Universal search | Search across all content types | Done |
| SRH02 | Search posts | Search post content | Done |
| SRH03 | Search users | Search user profiles | Done |
| SRH04 | Search communities | Search community names | Done |
| SRH05 | Search bar in nav | Persistent search in top navigation | Done |

## 21. Navigation & Layout

| ID | Feature | Description | Status |
|---|---|---|---|
| L01 | Global nav bar | Top sticky bar with logo, links, search | Rebuild |
| L02 | Sub nav bar | Secondary sticky bar with page title | Done |
| L03 | Mobile hamburger | Collapsed nav for small screens | Rebuild |
| L04 | Dashboard layout | Nav + content wrapper for all pages | Done |
| L05 | Auth layout | Centered form layout for sign-in/up | Done |
| L06 | Landing page | Hero + feature sections + CTA | Rebuild |

## 22. Calls

| ID | Feature | Description | Status |
|---|---|---|---|
| CA01 | Initiate call | Start voice/video call | Stub |
| CA02 | Incoming call notification | Popup for incoming calls | Stub |
| CA03 | Call modal | Accept/reject/end call UI | Stub |
| CA04 | Answer call | Accept incoming call | Stub |
| CA05 | End call | Hang up active call | Stub |
| CA06 | Reject call | Decline incoming call | Stub |

## 23. Push Notifications

| ID | Feature | Description | Status |
|---|---|---|---|
| PN01 | Subscribe to push | Register for browser push notifications | Done |
| PN02 | Unsubscribe from push | Remove push subscription | Done |
| PN03 | Push preferences | Toggle notification types | Done |
| PN04 | VAPID key management | Store and retrieve public key | Done |
| PN05 | Service worker | Handle push events in background | Done |

## 24. Graph Recommendations

| ID | Feature | Description | Status |
|---|---|---|---|
| GR01 | Suggested users | AI-powered user recommendations | Rebuild |
| GR02 | Dismiss suggestions | Remove suggested user from list | Rebuild |
| GR03 | Refresh suggestions | Get new set of suggestions | Rebuild |
| GR04 | Follow via graph | Follow/unfollow updates graph edges | Rebuild |

## 25. Admin & Monetization

| ID | Feature | Description | Status |
|---|---|---|---|
| AD01 | Admin dashboard | User stats, moderation, system health | TODO |
| AD02 | Create ad | Ad creation form | TODO |
| AD03 | Ad dashboard | View ad performance metrics | TODO |
| AD04 | Track impressions | Count ad views | TODO |
| AD05 | Track clicks | Count ad clicks | TODO |
| AD06 | Pause ad | Disable ad temporarily | TODO |
| AD07 | Subscription status | Check premium plan status | TODO |
| AD08 | Checkout session | Create Stripe checkout | TODO |
| AD09 | Cancel subscription | End premium plan | TODO |

---

## Summary

| Domain | Total | Done | Rebuild | TODO | Stub |
|---|---|---|---|---|---|
| Auth & Onboarding | 11 | 7 | 4 | 0 | 0 |
| User System | 17 | 13 | 2 | 0 | 2 |
| Feed & Posts | 14 | 14 | 0 | 0 | 0 |
| Reactions & Engagement | 8 | 8 | 0 | 0 | 0 |
| Bookmarks | 4 | 4 | 0 | 0 | 0 |
| Polls | 5 | 5 | 0 | 0 | 0 |
| Hashtags | 4 | 4 | 0 | 0 | 0 |
| Messages | 12 | 12 | 0 | 0 | 0 |
| Communities | 14 | 14 | 0 | 0 | 0 |
| Events | 7 | 7 | 0 | 0 | 0 |
| Jobs | 7 | 6 | 0 | 1 | 0 |
| Marketplace | 8 | 8 | 0 | 0 | 0 |
| Q&A | 8 | 8 | 0 | 0 | 0 |
| Research | 6 | 6 | 0 | 0 | 0 |
| Resources | 5 | 5 | 0 | 0 | 0 |
| Stories | 8 | 6 | 0 | 2 | 0 |
| Notifications | 6 | 6 | 0 | 0 | 0 |
| Gamification | 6 | 6 | 0 | 0 | 0 |
| Settings | 5 | 5 | 0 | 0 | 0 |
| Search | 5 | 5 | 0 | 0 | 0 |
| Navigation | 6 | 3 | 3 | 0 | 0 |
| Calls | 6 | 0 | 0 | 0 | 6 |
| Push Notifications | 5 | 5 | 0 | 0 | 0 |
| Graph Recs | 4 | 0 | 4 | 0 | 0 |
| Admin & Monetization | 9 | 0 | 0 | 9 | 0 |
| **TOTAL** | **240** | **154** | **17** | **13** | **8** |
