# Campus Connect — Pending Implementation Tasks

> Auto-generated tracking document. Updated as tasks are completed.

## Critical

- [x] **1. Fix ConvexProvider auth integration** — Use `ConvexProviderWithClerk` instead of basic `ConvexProvider` so Convex receives user identity
- [x] **2. Cascade delete on `deletePost`** — Delete associated likes and comments when a post is deleted
- [x] **3. Add `deleteComment` mutation + UI** — Missing function per Req 12.6; add backend mutation and delete button in CommentList
- [x] **4. Handle `user.deleted` webhook** — Add handler in `convex/http.ts` to clean up user data on Clerk user deletion

## Import / Build Fixes

- [x] **5. Fix 15 broken `@/src/components/` imports** — Should be `@/components/` per tsconfig alias
- [x] **6. Fix root `error.tsx` nested `<html><body>`** — Remove wrapping HTML tags to prevent hydration errors

## Theme / Dark Mode

- [x] **7. Add `globals.css` theme CSS variables** — Add `:root` and `.dark` tokens for shadcn/ui compatibility
- [x] **8. Fix dark mode — Landing page** (`src/app/page.tsx`)
- [x] **9. Fix dark mode — Auth pages** (sign-in, sign-up)
- [x] **10. Fix dark mode — Root error page** (`src/app/error.tsx`)
- [x] **11. Fix dark mode — ProfileForm** (`src/components/profile/ProfileForm.tsx`)
- [x] **12. Fix dark mode — CommentList** (`src/components/posts/CommentList.tsx`)
- [x] **13. Fix dark mode — CommentComposer** (`src/components/posts/CommentComposer.tsx`)
- [x] **14. Fix dark mode — SkillsManager** (`src/components/profile/SkillsManager.tsx`)
- [x] **15. Fix dark mode — UserSearchBar** (`src/components/profile/UserSearchBar.tsx`)
- [x] **16. Fix dark mode — UserFilterPanel** (`src/components/profile/UserFilterPanel.tsx`)
- [x] **17. Fix dark mode — Settings page** (`src/app/(dashboard)/settings/page.tsx`)

## Feature Gaps

- [x] **18. Display social links in ProfileHeader** — Collected in form but never rendered; now shows GitHub, LinkedIn, Twitter, Website with icons
- [x] **19. Add inline comment expansion to PostCard** — Show/hide comments directly on PostCard with CommentList + CommentComposer
- [x] **20. Improve XSS sanitizer** — Handle `<img>`, `<svg>`, `<form>`, `<base>` vectors; HTML-encode output; refactored lib/sanitize.ts with shared `stripDangerousContent`

## Testing

- [x] **21. Add settings page tests** — Created `settings/page.test.tsx` with 6 test cases covering loading, auth, and UI sections
- [x] **22. Update mock API for deleteComment** — Added `comments` namespace with `getPostComments`, `createComment`, `deleteComment` to mock API
