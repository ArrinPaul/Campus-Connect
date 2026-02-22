'use client';

import { useQuery } from 'convex/react';
import type { Doc } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { Mail, Plus, Check, Edit } from 'lucide-react';

// A temporary v2 button. A proper one will be created later as part of the full design system.
const TempButton = ({ children, variant = 'primary' }: { children: React.ReactNode, variant?: 'primary' | 'outline' }) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 py-2 px-4 btn-press";
    const variantClasses = variant === 'primary' 
        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
        : 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground';
    return <button className={`${baseClasses} ${variantClasses}`}>{children}</button>
}


type ProfileHeaderProps = {
    profile: Doc<'users'>;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
    const currentUser = useQuery(api.users.getCurrentUser);
    const isCurrentUser = currentUser?._id === profile._id;

    // TODO: Add follow/unfollow logic
    const isFollowing = false; // Placeholder

    const ActionButton = () => {
        if (isCurrentUser) {
            return <TempButton variant="outline"><Edit className="mr-2 h-4 w-4" />Edit Profile</TempButton>;
        }

        return (
            <div className="flex gap-2">
                <TempButton>
                    {isFollowing ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {isFollowing ? 'Following' : 'Follow'}
                </TempButton>
                <TempButton variant="outline">
                    <Mail className="mr-2 h-4 w-4" /> Message
                </TempButton>
            </div>
        );
    };

    return (
        <div>
            {/* Banner Image */}
            <div className="h-36 sm:h-48 w-full bg-muted" />

            <div className="px-4 sm:px-6 lg:px-8">
                {/* Header Content */}
                <div className="flex items-end gap-4 -mt-16 sm:-mt-20">
                    {/* Profile Picture */}
                    <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-background bg-muted flex-shrink-0">
                        {profile.profilePicture && (
                            <img src={profile.profilePicture} alt={profile.name} className="h-full w-full rounded-full object-cover" />
                        )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex-1 flex justify-end pb-4">
                        <ActionButton />
                    </div>
                </div>

                {/* User Info */}
                <div className="mt-4">
                    <h2 className="text-2xl font-bold">{profile.name}</h2>
                    {profile.username && <p className="text-muted-foreground">@{profile.username}</p>}
                    {profile.bio && (
                        <p className="mt-2 text-base max-w-2xl">{profile.bio}</p>
                    )}
                </div>

                 <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                    <p><span className="font-bold text-foreground">{profile.followingCount ?? 0}</span> Following</p>
                    <p><span className="font-bold text-foreground">{profile.followerCount ?? 0}</span> Followers</p>
                </div>
            </div>
        </div>
    );
}
