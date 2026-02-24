'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ConversationListItem } from './ConversationListItem';
import { NewConversationModal } from './NewConversationModal';
import { Search, PlusCircle } from 'lucide-react';

type Props = {
    selectedConversationId: Id<'conversations'> | null;
};

export function ConversationList({ selectedConversationId }: Props) {
    const conversations = useQuery(api.conversations.getConversations, {});
    const [showNewModal, setShowNewModal] = useState(false);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b flex-shrink-0">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Messages</h2>
                     <button
                        onClick={() => setShowNewModal(true)}
                        className="text-primary hover:text-primary/80"
                        title="Start new conversation"
                     >
                        <PlusCircle className="h-6 w-6" />
                    </button>
                 </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="text" placeholder="Search messages..." className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-custom">
                {conversations === undefined && (
                    <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                )}
                {conversations?.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet.</div>
                )}
                {conversations?.map((convo) => (
                    <ConversationListItem 
                        key={convo._id}
                        conversation={convo}
                        isSelected={selectedConversationId === convo._id}
                    />
                ))}
            </div>
        </div>
    );
}
