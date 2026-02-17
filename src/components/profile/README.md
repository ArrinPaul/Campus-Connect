# Profile Components

This directory contains components for user profile management and display.

## Components

### UserCard
A compact user card component that displays basic user information with a link to their profile.

**Props:**
- `user`: User object with `_id`, `name`, `profilePicture`, `role`, and `university`

**Usage:**
```tsx
<UserCard user={user} />
```

### FollowersList
Displays a list of users who follow a specific user.

**Props:**
- `userId`: The ID of the user whose followers to display

**Features:**
- Loading state with skeleton placeholders
- Empty state when no followers
- Displays follower count in header
- Uses UserCard for each follower

**Usage:**
```tsx
<FollowersList userId={userId} />
```

### FollowingList
Displays a list of users that a specific user is following.

**Props:**
- `userId`: The ID of the user whose following list to display

**Features:**
- Loading state with skeleton placeholders
- Empty state when not following anyone
- Displays following count in header
- Uses UserCard for each followed user

**Usage:**
```tsx
<FollowingList userId={userId} />
```

### ProfileHeader
Displays the user's profile header with avatar, bio, stats, and follow button.

**Props:**
- `user`: User object with full profile information
- `isOwnProfile`: Boolean indicating if viewing own profile

**Features:**
- Profile picture or initial avatar
- User name, role, and experience level badges
- University and bio display
- Follower and following counts
- Follow/unfollow button (hidden on own profile)
- Optimistic UI updates

### ProfileForm
Form component for editing user profile information.

### SkillsManager
Component for managing user skills (add/remove).

## Example Profile Page Integration

Here's how to use these components together in a profile page:

```tsx
"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { FollowersList } from "@/components/profile/FollowersList"
import { FollowingList } from "@/components/profile/FollowingList"

export default function ProfilePage({ params }: { params: { id: string } }) {
  const userId = params.id as Id<"users">
  const user = useQuery(api.users.getUserById, { userId })
  const currentUser = useQuery(api.users.getCurrentUser)
  
  if (!user) {
    return <div>User not found</div>
  }
  
  const isOwnProfile = currentUser?._id === userId
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Profile Header */}
        <ProfileHeader user={user} isOwnProfile={isOwnProfile} />
        
        {/* Followers and Following Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FollowersList userId={userId} />
          <FollowingList userId={userId} />
        </div>
      </div>
    </div>
  )
}
```

## Requirements Validation

These components validate **Requirement 7.7**:
> THE Platform SHALL display a list of followers and following on each Profile page

The implementation provides:
- ✅ FollowersList component to display followers
- ✅ FollowingList component to display following users
- ✅ UserCard component for consistent user display
- ✅ Loading states for better UX
- ✅ Empty states with helpful messages
- ✅ Real-time updates via Convex subscriptions
- ✅ Responsive design with Tailwind CSS
