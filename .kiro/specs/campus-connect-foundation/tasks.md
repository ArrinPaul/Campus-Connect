# Implementation Plan: Campus Connect Foundation

## Overview

This implementation plan breaks down the Campus Connect Foundation feature into discrete, actionable tasks. The approach follows a bottom-up strategy: starting with core infrastructure and data models, then building authentication, followed by individual features (profiles, posts, feed, discovery), and finally integration and testing.

The implementation uses:
- **Next.js 14** with App Router for the frontend
- **Convex** for real-time database and backend
- **Clerk** for authentication
- **Tailwind CSS + shadcn/ui** for UI components
- **fast-check** for property-based testing
- **Jest + React Testing Library** for unit testing

## Implementation Phases

### Phase 1: Foundation & Authentication (Tasks 1-4)
Core infrastructure, database schema, and authentication system

### Phase 2: User Profiles & Skills (Tasks 5-6)
User profile management, skills, and profile pages

### Phase 3: Posts & Engagement (Tasks 7-9)
Post creation, likes, comments, and engagement features

### Phase 4: Feed & Social Features (Tasks 10-13)
Feed display, following system, and user discovery

### Phase 5: UI/UX & Polish (Tasks 14-17)
Theme support, responsive design, and security

### Phase 6: Pages & Integration (Tasks 18-22)
Final pages, integration, and comprehensive testing

---

## Tasks

### 🚀 PHASE 1: Foundation & Authentication

- [x] 1. Project setup and infrastructure
  - Initialize Next.js 14 project with TypeScript
  - Install and configure Convex
  - Install and configure Clerk
  - Set up Tailwind CSS and shadcn/ui
  - Configure environment variables for Clerk and Convex
  - Set up ESLint and Prettier
  - Initialize Git repository with .gitignore
  - _Requirements: 1.1_

- [x] 2. Define Convex schema and core data models
  - [x] 2.1 Create Convex schema file with all tables
    - Define users table with all fields and indexes
    - Define posts table with authorId reference
    - Define likes table with compound index on (userId, postId)
    - Define comments table with postId reference
    - Define follows table with compound index on (followerId, followingId)
    - _Requirements: 2.2, 4.4, 5.8_
  
  - [x] 2.2 Write property test for data model completeness
    - **Property 4: Profile data completeness**
    - **Property 16: Post data completeness**
    - **Property 25: Comment data completeness**
    - **Validates: Requirements 2.2, 4.4, 5.8**

- [x] 3. Implement Clerk authentication integration
  - [x] 3.1 Set up Clerk provider in root layout
    - Wrap app with ClerkProvider
    - Configure Clerk appearance and branding
    - Set up authentication middleware
    - _Requirements: 1.1, 1.2_
  
  - [x] 3.2 Create Clerk webhook handler in Convex
    - Implement HTTP endpoint for Clerk webhooks
    - Handle user.created event to create user record
    - Handle user.updated event to sync user data
    - Verify webhook signatures
    - _Requirements: 1.5_
  
  - [x] 3.3 Create authentication pages
    - Create sign-in page with Clerk SignIn component
    - Create sign-up page with Clerk SignUp component
    - Configure OAuth providers (Google, GitHub, LinkedIn)
    - _Requirements: 1.3, 1.4_
  
  - [x] 3.4 Write property tests for authentication
    - **Property 1: User record creation on authentication**
    - **Property 2: Protected route authorization**
    - **Validates: Requirements 1.5, 1.7**
  
  - [x] 3.5 Write unit tests for authentication flows
    - Test redirect to login for unauthenticated users
    - Test successful authentication flow
    - Test logout and session clearing
    - _Requirements: 1.2, 1.6_

- [x] 4. Checkpoint - Verify authentication works
  - Ensure all tests pass, ask the user if questions arise.

---

### 🎯 PHASE 2: User Profiles & Skills

- [x] 5. Implement user profile management
  - [x] 5.1 Create user queries in Convex
    - Implement getCurrentUser query
    - Implement getUserById query
    - Implement searchUsers query with filters
    - Add authentication checks to all queries
    - _Requirements: 2.9, 8.2, 8.3, 8.4, 12.4_
  
  - [x] 5.2 Create user mutations in Convex
    - Implement updateProfile mutation with validation
    - Implement addSkill mutation with validation
    - Implement removeSkill mutation
    - Add authorization checks (users can only modify own profile)
    - _Requirements: 2.3, 3.1, 3.2, 12.5_
  
  - [x] 5.3 Create validation utilities
    - Create validation functions for profile fields
    - Validate bio length (max 500 chars)
    - Validate university length (max 200 chars)
    - Validate role enum values
    - Validate experience level enum values
    - Validate skill name (non-empty, max 50 chars)
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 3.3, 3.4_
  
  - [x] 5.4 Write property tests for profile validation
    - **Property 7: Profile field validation**
    - **Property 11: Skill validation**
    - **Validates: Requirements 2.5, 2.6, 2.7, 2.8, 3.3, 3.4**
  
  - [x] 5.5 Write property tests for profile operations
    - **Property 3: Default profile initialization**
    - **Property 5: Profile update persistence**
    - **Property 8: Profile visibility**
    - **Property 9: Skill addition**
    - **Property 10: Skill removal**
    - **Property 12: Skill uniqueness**
    - **Validates: Requirements 2.1, 2.3, 2.9, 3.1, 3.2, 3.5**
  
  - [x] 5.6 Create ProfileForm component
    - Build form with all profile fields
    - Add client-side validation
    - Handle form submission with Convex mutation
    - Display success/error messages
    - _Requirements: 2.3, 2.5, 2.6, 2.7, 2.8_
  
  - [x] 5.7 Create SkillsManager component
    - Build UI for adding skills with input and button
    - Build UI for displaying and removing skills
    - Prevent duplicate skills on client side
    - Handle add/remove with Convex mutations
    - _Requirements: 3.1, 3.2, 3.5, 3.6_
  
  - [x] 5.8 Create ProfileHeader component
    - Display user avatar, name, and bio
    - Display role, university, and experience level
    - Display follower and following counts
    - Show follow/unfollow button for other users
    - _Requirements: 2.9, 7.6_
  
  - [x] 5.9 Implement profile picture upload
    - Add file upload to ProfileForm
    - Upload to Convex storage
    - Update user profilePicture field
    - Display uploaded image in ProfileHeader
    - _Requirements: 2.4_
  
  - [x] 5.10 Write property test for profile picture update
    - **Property 6: Profile picture update**
    - **Validates: Requirements 2.4**
  
  - [x] 5.11 Write unit tests for profile components
    - Test ProfileForm validation and submission
    - Test SkillsManager add/remove functionality
    - Test ProfileHeader display with various data
    - _Requirements: 2.3, 3.1, 3.2_

- [x] 6. Checkpoint - Verify profile management works
  - Ensure all tests pass, ask the user if questions arise.

---

### 📝 PHASE 3: Posts & Engagement

- [ ] 7. Implement post creation and management
  - [x] 7.1 Create post queries in Convex
    - Implement getFeedPosts query with pagination
    - Implement getPostById query
    - Add authentication checks
    - Include author data in responses
    - _Requirements: 6.1, 6.2, 6.3, 12.4_
  
  - [x] 7.2 Create post mutations in Convex
    - Implement createPost mutation with validation
    - Implement deletePost mutation with authorization
    - Validate content (non-empty, max 5000 chars)
    - Initialize likeCount and commentCount to 0
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 12.5_
  
  - [x] 7.3 Write property tests for post validation
    - **Property 15: Post content validation**
    - **Validates: Requirements 4.2, 4.3**
  
  - [x] 7.4 Write property tests for post operations
    - **Property 14: Post creation**
    - **Property 17: Post initialization state**
    - **Property 18: Post deletion**
    - **Validates: Requirements 4.1, 4.5, 4.6, 4.7**
  
  - [x] 7.5 Create PostComposer component
    - Build textarea for post content
    - Add character counter (max 5000)
    - Add client-side validation
    - Handle post creation with Convex mutation
    - Clear form after successful post
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 7.6 Create PostCard component
    - Display post author info (avatar, name)
    - Display post content and timestamp
    - Display like count and comment count
    - Add like/unlike button
    - Add delete button for own posts
    - _Requirements: 6.6_
  
  - [x] 7.7 Write unit tests for post components
    - Test PostComposer validation and submission
    - Test PostCard display and interactions
    - Test delete functionality for own posts
    - _Requirements: 4.1, 4.6_

- [ ] 8. Implement post engagement (likes and comments)
  - [x] 8.1 Create like queries and mutations in Convex
    - Implement likePost mutation with validation
    - Implement unlikePost mutation
    - Implement hasUserLikedPost query
    - Prevent duplicate likes (check before creating)
    - Increment/decrement post likeCount
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 8.2 Write property tests for like operations
    - **Property 19: Like creation**
    - **Property 20: Like count increment**
    - **Property 21: Like count decrement**
    - **Property 22: Like uniqueness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  
  - [x] 8.3 Create comment queries and mutations in Convex
    - Implement getPostComments query
    - Implement createComment mutation with validation
    - Validate comment content (non-empty, max 1000 chars)
    - Increment post commentCount
    - Order comments by createdAt ascending
    - _Requirements: 5.5, 5.6, 5.7, 5.9_
  
  - [x] 8.4 Write property tests for comment operations
    - **Property 23: Comment creation**
    - **Property 24: Comment validation**
    - **Property 26: Comment chronological ordering**
    - **Validates: Requirements 5.5, 5.6, 5.7, 5.9**
  
  - [x] 8.5 Add like functionality to PostCard
    - Add like button with heart icon
    - Show filled heart if user has liked
    - Handle like/unlike toggle
    - Update like count optimistically
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 8.6 Create CommentList component
    - Display all comments for a post
    - Show comment author info and timestamp
    - Order comments chronologically
    - Handle empty state (no comments)
    - _Requirements: 5.9_
  
  - [x] 8.7 Create CommentComposer component
    - Build input for comment text
    - Add character counter (max 1000)
    - Add client-side validation
    - Handle comment creation with Convex mutation
    - Clear input after successful comment
    - _Requirements: 5.5, 5.6, 5.7_
  
  - [x] 8.8 Write unit tests for engagement components
    - Test like button toggle functionality
    - Test CommentComposer validation and submission
    - Test CommentList display and ordering
    - _Requirements: 5.1, 5.5_

- [x] 9. Checkpoint - Verify post engagement works
  - Ensure all tests pass, ask the user if questions arise.

---

### 📰 PHASE 4: Feed & Social Features

- [ ] 10. Implement feed display
  - [x] 10.1 Enhance getFeedPosts query with filtering
    - Get current user's following list
    - Filter posts by followed users if following anyone
    - Return all posts if not following anyone
    - Order by createdAt descending (newest first)
    - Implement cursor-based pagination
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 10.2 Write property tests for feed operations
    - **Property 27: Feed reverse chronological ordering**
    - **Property 28: Feed filtering by follows**
    - **Property 29: Feed post data completeness**
    - **Validates: Requirements 6.1, 6.3, 6.6**
  
  - [x] 10.3 Create FeedContainer component
    - Fetch initial posts with getFeedPosts
    - Display posts using PostCard components
    - Handle loading state
    - Handle empty state (no posts)
    - _Requirements: 6.1, 6.6_
  
  - [x] 10.4 Implement infinite scroll
    - Create InfiniteScrollTrigger component using Intersection Observer
    - Load more posts when trigger is visible
    - Track hasMore flag from pagination
    - Show loading indicator while fetching
    - _Requirements: 6.4, 6.5_
  
  - [x] 10.5 Create main feed page
    - Add PostComposer at top of feed
    - Add FeedContainer below composer
    - Set up Convex real-time subscriptions
    - Handle real-time post updates
    - _Requirements: 6.7_
  
  - [x] 10.6 Write unit tests for feed components
    - Test FeedContainer with various post data
    - Test infinite scroll trigger behavior
    - Test empty state display
    - _Requirements: 6.1, 6.4_

- [ ] 11. Implement user following
  - [x] 11.1 Create follow queries and mutations in Convex
    - Implement followUser mutation with validation
    - Implement unfollowUser mutation
    - Implement isFollowing query
    - Implement getFollowers query
    - Implement getFollowing query
    - Prevent self-following
    - Prevent duplicate follows
    - Update follower/following counts
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 11.2 Write property tests for follow operations
    - **Property 30: Follow creation**
    - **Property 31: Following list inclusion**
    - **Property 32: Unfollow removal**
    - **Property 33: Following list exclusion**
    - **Property 34: Self-follow prevention**
    - **Property 35: Follow count display**
    - **Property 36: Follower and following list retrieval**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**
  
  - [x] 11.3 Add follow button to ProfileHeader
    - Show follow/unfollow button for other users
    - Hide button on own profile
    - Handle follow/unfollow toggle
    - Update button state optimistically
    - _Requirements: 7.1, 7.3_
  
  - [x] 11.4 Create follower/following lists
    - Create FollowersList component
    - Create FollowingList component
    - Display user cards for each follower/following
    - Add to profile page
    - _Requirements: 7.7_
  
  - [x] 11.5 Write unit tests for follow components
    - Test follow button toggle functionality
    - Test follower/following list display
    - Test self-follow prevention
    - _Requirements: 7.1, 7.5_

- [ ] 12. Implement user discovery
  - [x] 12.1 Enhance searchUsers query with filters
    - Add name search with case-insensitive matching
    - Add role filter
    - Add skills filter (match any skill in array)
    - Combine filters with AND logic
    - Return user profiles with all display fields
    - _Requirements: 8.2, 8.3, 8.4, 8.6_
  
  - [x] 12.2 Write property tests for user discovery
    - **Property 37: User search by name**
    - **Property 38: User filter by role**
    - **Property 39: User filter by skills**
    - **Property 40: Search result data completeness**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.6**
  
  - [x] 12.3 Create UserSearchBar component
    - Build search input with debouncing
    - Trigger search on input change
    - Show search icon and clear button
    - _Requirements: 8.2_
  
  - [x] 12.4 Create UserFilterPanel component
    - Add role filter dropdown
    - Add skills filter with multi-select
    - Trigger filter change on selection
    - Show active filters with clear options
    - _Requirements: 8.3, 8.4_
  
  - [x] 12.5 Create UserCard component
    - Display user avatar, name, and role
    - Display university and skills
    - Link to full profile page
    - Show follow button
    - _Requirements: 8.6_
  
  - [x] 12.6 Create discovery page
    - Add UserSearchBar at top
    - Add UserFilterPanel in sidebar
    - Display search results using UserCard
    - Handle loading and empty states
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 12.7 Write unit tests for discovery components
    - Test search with various queries
    - Test filtering by role and skills
    - Test UserCard display and navigation
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 13. Checkpoint - Verify following and discovery work
  - Ensure all tests pass, ask the user if questions arise.

---

### 🎨 PHASE 5: UI/UX & Polish

- [ ] 14. Implement theme support
  - [-] 14.1 Set up theme provider
    - Create ThemeProvider using next-themes
    - Wrap app with ThemeProvider
    - Configure light and dark themes
    - Set system as default theme
    - _Requirements: 10.1, 10.4_
  
  - [~] 14.2 Create theme toggle component
    - Build toggle button with sun/moon icons
    - Handle theme switching
    - Show current theme state
    - Add to navigation bar
    - _Requirements: 10.3, 10.6_
  
  - [~] 14.3 Configure Tailwind for dark mode
    - Enable dark mode in Tailwind config
    - Add dark mode variants to all components
    - Ensure all UI components work in both themes
    - Test color contrast for readability
    - _Requirements: 10.1, 10.5_
  
  - [~] 14.4 Write property test for theme persistence
    - **Property 41: Theme persistence**
    - **Validates: Requirements 10.2**
  
  - [~] 14.5 Write unit tests for theme components
    - Test theme toggle functionality
    - Test theme persistence across sessions
    - Test system theme detection
    - _Requirements: 10.2, 10.4_

- [ ] 15. Implement responsive design
  - [~] 15.1 Create responsive navigation
    - Build desktop navigation with horizontal menu
    - Build mobile navigation with hamburger menu
    - Add breakpoints for tablet and mobile
    - Ensure touch targets are 44x44px minimum
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_
  
  - [~] 15.2 Make all components responsive
    - Add responsive classes to all layouts
    - Test on mobile (320px-767px)
    - Test on tablet (768px-1023px)
    - Test on desktop (1024px+)
    - Adjust grid layouts for different screens
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [~] 15.3 Optimize images for responsive display
    - Use Next.js Image component
    - Configure image sizes for different viewports
    - Add loading states for images
    - Implement lazy loading
    - _Requirements: 9.7_
  
  - [~] 15.4 Write unit tests for responsive behavior
    - Test navigation on different screen sizes
    - Test layout adjustments
    - Test touch target sizes
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 16. Implement security and validation
  - [~] 16.1 Add XSS prevention
    - Sanitize all text input before storage
    - Use DOMPurify or similar library
    - Escape HTML in user-generated content
    - Test with malicious input examples
    - _Requirements: 12.3_
  
  - [~] 16.2 Write property test for XSS prevention
    - **Property 42: XSS prevention**
    - **Validates: Requirements 12.3**
  
  - [~] 16.3 Add authentication enforcement to all Convex functions
    - Add auth checks to all queries and mutations
    - Return 401 for unauthenticated requests
    - Log authentication failures
    - _Requirements: 12.4_
  
  - [~] 16.4 Write property test for authentication enforcement
    - **Property 43: Authentication enforcement**
    - **Validates: Requirements 12.4**
  
  - [~] 16.5 Add authorization checks for user actions
    - Verify user owns profile before updates
    - Verify user owns post before deletion
    - Verify user owns comment before deletion
    - Return 403 for unauthorized actions
    - _Requirements: 12.5, 12.6_
  
  - [~] 16.6 Write property test for user authorization
    - **Property 44: User authorization for modifications**
    - **Validates: Requirements 12.5, 12.6**
  
  - [~] 16.7 Implement comprehensive error handling
    - Add try-catch blocks to all mutations
    - Return structured error responses
    - Display user-friendly error messages
    - Log errors for debugging
    - _Requirements: 12.7_
  
  - [~] 16.8 Write property test for validation error messaging
    - **Property 45: Validation error messaging**
    - **Validates: Requirements 12.7**
  
  - [~] 16.9 Write unit tests for security features
    - Test XSS prevention with various inputs
    - Test authentication enforcement
    - Test authorization checks
    - Test error message display
    - _Requirements: 12.3, 12.4, 12.5, 12.6, 12.7_

- [~] 17. Checkpoint - Verify security and validation work
  - Ensure all tests pass, ask the user if questions arise.

---

### 🏁 PHASE 6: Pages & Integration

- [ ] 18. Create profile page
  - [~] 18.1 Build dynamic profile route
    - Create app/(dashboard)/profile/[id]/page.tsx
    - Fetch user data by ID
    - Handle user not found
    - Determine if viewing own profile
    - _Requirements: 2.9_
  
  - [~] 18.2 Compose profile page layout
    - Add ProfileHeader at top
    - Add SkillsManager (only for own profile)
    - Add ProfileForm (only for own profile)
    - Add follower/following lists
    - Add user's posts feed
    - _Requirements: 2.9, 3.6, 7.6, 7.7_
  
  - [~] 18.3 Write unit tests for profile page
    - Test own profile view with edit capabilities
    - Test other user profile view
    - Test user not found handling
    - _Requirements: 2.9_

- [ ] 19. Create settings page
  - [~] 19.1 Build settings page
    - Create app/(dashboard)/settings/page.tsx
    - Add ProfileForm for editing profile
    - Add theme toggle
    - Add account management section
    - _Requirements: 2.3, 10.3_
  
  - [~] 19.2 Write unit tests for settings page
    - Test profile editing
    - Test theme switching
    - _Requirements: 2.3, 10.3_

- [ ] 20. Create landing page
  - [~] 20.1 Build landing page
    - Create app/page.tsx
    - Add hero section with platform description
    - Add features section
    - Add call-to-action buttons (Sign Up, Sign In)
    - Redirect authenticated users to feed
    - _Requirements: 1.2_
  
  - [~] 20.2 Write unit tests for landing page
    - Test redirect for authenticated users
    - Test CTA button navigation
    - _Requirements: 1.2_

- [ ] 21. Integration and polish
  - [~] 21.1 Set up navigation and routing
    - Create navigation bar with links
    - Add user menu with profile and settings
    - Add logout functionality
    - Ensure all routes are properly protected
    - _Requirements: 1.6, 1.7_
  
  - [~] 21.2 Add loading states
    - Create loading skeletons for all components
    - Add loading indicators for async operations
    - Handle Convex query loading states
    - _Requirements: 6.7, 11.4_
  
  - [~] 21.3 Add error boundaries
    - Create error boundary component
    - Wrap app sections with error boundaries
    - Display user-friendly error messages
    - Log errors for debugging
    - _Requirements: 12.7_
  
  - [~] 21.4 Optimize performance
    - Add React.memo to expensive components
    - Implement code splitting for routes
    - Optimize Convex queries (indexes, pagination)
    - Minimize bundle size
    - _Requirements: 6.4, 6.5_
  
  - [~] 21.5 Write integration tests
    - Test complete user registration and profile creation flow
    - Test post creation, engagement, and feed display flow
    - Test user discovery, following, and feed filtering flow
    - Test theme switching and persistence
    - _Requirements: 1.5, 4.1, 5.1, 7.1, 10.2_

- [~] 22. Final checkpoint - Comprehensive testing
  - Run all unit tests and ensure they pass
  - Run all property tests and ensure they pass
  - Run all integration tests and ensure they pass
  - Verify test coverage meets 80% threshold
  - Test the application manually on different devices
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test-related sub-tasks that can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate complete user flows end-to-end
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- All property tests should run a minimum of 100 iterations
- The implementation follows a bottom-up approach: infrastructure → authentication → features → integration
