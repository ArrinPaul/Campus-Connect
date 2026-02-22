'use client';

import type { Doc } from '@/convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useMediaQuery } from '@/hooks/useMediaQuery'; // Assuming a useMediaQuery hook exists

// Manually define the type based on the getConversations query
export type Conversation = Doc<'conversations'> & {
    otherUsers: {
        _id: Doc<'users'>['_id'];
        name: Doc<'users'>['name'];
        profilePicture: Doc<'users'>['profilePicture'];
    }[];
    unreadCount: number;
};

type Props = {
    conversation: Conversation;
    isSelected: boolean;
};

export function ConversationListItem({ conversation, isSelected }: Props) {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const otherUser = conversation.otherUsers[0];
    const lastMessageTime = conversation.lastMessageAt ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true }) : null;

    const href = isMobile ? `/messages/${conversation._id}` : `/messages?c=${conversation._id}`;

    return (
        <Link href={href} scroll={false} className={`block w-full ${isSelected ? 'bg-primary/10' : ''}`}>
            <div className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50">
                <div className="relative h-12 w-12 rounded-full bg-muted flex-shrink-0">
                    {otherUser?.profilePicture && (
                        <img src={otherUser.profilePicture} alt={otherUser.name ?? ''} className="h-full w-full rounded-full object-cover" />
                    )}
                     {conversation.otherUsers.length > 1 && (
                        <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-muted border-2 border-card flex items-center justify-center text-2xs font-bold">{conversation.otherUsers.length}</div>
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <p className="font-bold truncate">{conversation.name ?? otherUser?.name ?? 'Unknown User'}</p>
                        {lastMessageTime && <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">{lastMessageTime}</p>}
                    </div>
                    <div className="flex justify-between items-start">
                        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessagePreview ?? 'No messages yet'}</p>
                        {conversation.unreadCount > 0 && (
                            <span className="ml-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center flex-shrink-0">
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
