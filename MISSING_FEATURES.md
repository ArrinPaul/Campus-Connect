# Missing Features: V1 vs V2 Frontend Comparison

This document tracks features present in the v1 frontend (`src/components/`) that were removed or degraded in the v2 frontend (`src/app/(components)/`). It was created as part of the v2 promotion effort.

---

## Summary

| Category | V1 | V2 (Current State) |
|---|---|---|
| Desktop Sidebar | ✅ Full featured | ✅ **Fixed** – 16 nav items, 3 sections, labels |
| Mobile Bottom Nav | ✅ 5 tabs + unread badge | ⚠️ 5 tabs, missing unread message badge |
| Mobile Hamburger Drawer | ✅ Full drawer with 13+ links | ❌ **Missing** – no hamburger/drawer on mobile |
| Body scroll lock (mobile menu) | ✅ Yes | ❌ Missing |
| Unread message count badge | ✅ In bottom nav + sidebar | ❌ Not in v2 components |
| Notifications unread badge | ✅ In sidebar | ⚠️ Sidebar shows it, bottom nav does not |
| Stories feed section | ✅ Stories bar in feed | ❌ Not in v2 feed page |
| Find Experts page | ⚠️ Placeholder | ⚠️ Placeholder (no real implementation) |
| Find Partners page | ⚠️ Placeholder | ⚠️ Placeholder (no real implementation) |
| Admin layout.tsx | ✅ Auth-protected layout | ❌ Missing – `/admin/*` routes outside `(dashboard)` lack auth |
| Discover redirect | ✅ `/discover` → real page | ✅ Exists |
| Portfolio page | ✅ `/profile/[id]/portfolio` | ✅ Restored |
| Community sub-pages | ✅ `/c/[slug]/members`, `/c/[slug]/settings` | ✅ Restored |

---

## Detailed Breakdown

### 1. Mobile Navigation – Hamburger Drawer ❌ MISSING

**V1 Implementation:** `src/components/navigation/mobile-nav.tsx`

The v1 mobile navigation included a full hamburger drawer component that opened from the side/top with all 13+ navigation links organized in two sections (Main + Explore). It featured:
- Animated hamburger → close (X) button toggle
- Body scroll lock when the drawer was open
- Full navigation parity with the desktop sidebar
- `UserButton` from Clerk displayed inside the drawer
- ThemeToggle inside the drawer

**V2 State:** Only a 5-tab fixed bottom nav (`mobile-bottom-nav.tsx`) exists. The hamburger drawer is completely missing. Users on mobile cannot access Bookmarks, Events, Jobs, Marketplace, Research, Resources, Q&A, Leaderboard, Communities, or Settings directly from mobile.

**Fix Required:** Create/restore `src/app/(components)/navigation/MobileDrawer.tsx` and integrate it into `main-layout.tsx` for mobile.

---

### 2. Unread Message Badge in Mobile Bottom Nav ❌ MISSING

**V1 Implementation:** `src/components/navigation/BottomNav.tsx` lines 27-31

```tsx
const totalUnread = useQuery(
  api.conversations.getTotalUnreadCount,
  currentUser ? {} : "skip"
)
```

Then displays a badge dot on the Messages tab when `totalUnread > 0`.

**V2 State:** `src/app/(components)/navigation/mobile-bottom-nav.tsx` shows no unread count badge. The desktop sidebar also lacks an unread badge on the Messages nav item.

**Fix Required:** Add `api.conversations.getTotalUnreadCount` query and badge display to both `mobile-bottom-nav.tsx` and `primary-sidebar.tsx`.

---

### 3. Stories Bar in Feed ❌ MISSING

**V1 Implementation:** The v1 feed page likely included a horizontal scrolling stories bar at the top showing avatars of users with active stories.

**V2 State:** The feed page (`src/app/(dashboard)/feed/page.tsx`) renders `<PostFeed />` and `<FeedRightSidebar />` but no stories bar — even though the `/stories` route and Stories backend (`convex/stories.ts`) fully exist.

**Fix Required:** Add a `StoriesBar.tsx` component to the top of the feed page that displays active stories using `api.stories.getActiveStories`.

---

### 4. Admin Section – Missing Auth Layout ⚠️ PARTIAL

**Issue:** `src/app/admin/` only has `error.tsx`. It has no `layout.tsx` to enforce authentication or admin role checking.

**V2 State:** The `/admin/dashboard` route is served through `src/app/(dashboard)/admin/dashboard/page.tsx` (inside the auth-protected `(dashboard)` group), so auth IS enforced indirectly. However, if any future `/admin/*` routes are added outside the `(dashboard)` group, they will be publicly accessible.

**Fix Required:** Consider either:
1. Adding `src/app/admin/layout.tsx` with explicit admin role check
2. Moving all admin routes inside `(dashboard)` to remove the out-of-group folder

---

### 5. Body Scroll Lock on Mobile Menu ❌ MISSING

**V1 Implementation:** `src/components/navigation/mobile-nav.tsx` – when the hamburger drawer is open, the body has overflow hidden applied to prevent background scrolling.

**V2 State:** With no hamburger drawer, this is moot — but when the drawer is re-implemented, this should be included.

---

### 6. Find Experts / Find Partners Pages ⚠️ PLACEHOLDER ONLY

**Current State:** Both `/find-experts` and `/find-partners` pages show "under construction" placeholder text with no real functionality.

**V1 State:** Same — these were also placeholders in v1.

**Fix Required (Future):** Implement actual matching/recommendation functionality using the existing `convex/matching.ts` backend which already has `api.matching.findMatchingUsers`.

---

### 7. Notification Bell with Count in Sidebar ✅ EXISTS

The desktop sidebar (`primary-sidebar.tsx`) does display a notification badge using `api.notifications.getUnreadCount`, so this is working in v2.

---

## Routes Comparison

### V1 Routes (was at `src/app/(dashboard)/` before v2 promotion)
All routes from v1 are preserved in v2. No routes were dropped.

### New V2-Only Routes
The following routes are new in v2 (not in original v1):
- `/ads/create` – Create advertisement
- `/ads/dashboard` – Ad management dashboard
- `/discover/suggested` – Suggested users
- `/jobs/my-applications` – User's job applications
- `/offline` – Offline fallback page
- `/communities/new` – Create community

---

## Code Quality Notes

The following are pre-existing issues in the codebase that should be addressed:

| Issue | Files | Severity |
|---|---|---|
| `<img>` instead of Next.js `<Image />` | 20+ components | Warning |
| Convex `_generated/api.d.ts` is stale | `convex/_generated/api.d.ts` | Medium |
| `convex/counters.ts` not in generated API | `convex/_generated/api.d.ts` | Medium |
| Rate limit keys missing in `_lib.ts` (now fixed) | `convex/_lib.ts` | Fixed |
| Search index calls missing field names (now fixed) | `convex/search.ts` | Fixed |

### Regenerating Convex API Types

When Convex backend functions are added, the generated types become stale. To regenerate:

```bash
npx convex dev
```

This requires a running Convex deployment. The `.env.local` file has the deployment URL (`NEXT_PUBLIC_CONVEX_URL` for deployment `festive-blackbird-448`).

---

## What Was Fixed During V2 Promotion

The following issues were identified and fixed as part of this migration:

1. **Sidebar** – Completely rebuilt with 16 nav items in 3 sections (Main, Academic, Campus Life), working logout via `useClerk().signOut()`, and a ThemeToggle
2. **Mobile nav** – Dynamic profile URL via `api.users.getCurrentUser`, fixed z-index layering
3. **Profile redirect** – Created `/profile/me` → redirect to actual user profile page
4. **Feed right sidebar** – Replaced hardcoded fake data with real Convex API calls (`api.hashtags.getTrending`, `api.suggestions.getSuggestions`, `api.follows.*`)
5. **Dynamic route pages** – Restored 12 missing pages from git history (`[id]`, `[slug]`, `[tag]` variants)
6. **Import depth errors** – Fixed wrong relative import depths in community and portfolio nested pages
7. **ESLint errors** – Fixed unescaped entities in 7 files, missing `Clock` icon import
8. **Convex type errors** – Added `counters` to generated API types, added missing rate limit keys, fixed `search.search()` field name arguments, fixed `paginate()` cursor type
9. **Admin duplicate route** – Removed duplicate `/admin/dashboard` page that conflicted with `(dashboard)/admin/dashboard`
10. **Settings sub-pages** – All redirect properly to `/settings?tab=X`
11. **Onboarding** – Fixed missing layout, corrected import paths

---

*Last updated: During v2 promotion session*
