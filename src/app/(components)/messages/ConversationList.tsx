'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import type { Id } from '@/lib/api';
import { ConversationListItem } from './ConversationListItem';
import { NewConversationModal } from './NewConversationModal';
import { Search, PlusCircle, MessageSquarePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
    selectedConversationId: Id<'conversations'> | null;
};

export function ConversationList({ selectedConversationId }: Props) {
    const conversations = useQuery(api.conversations.getConversations, {});
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);
    const router = useRouter();

    const filteredConversations = useMemo(() => {
        if (!Array.isArray(conversations)) return [];
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter((c: any) => {
            const name = c.otherUser?.name || c.name || '';
            const lastMsg = c.lastMessage || '';
            return name.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
        });
    }, [conversations, searchQuery]);

    return (
        <div className="flex flex-col h-full bg-transparent border-r border-border">
            <div className="p-4 border-b border-border flex-shrink-0 space-y-3 bg-card">
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight">Inbox</h2>
                     <button
                        onClick={() => setShowNewModal(true)}
                        className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
                        title="Start new conversation"
                     >
                        <MessageSquarePlus className="h-5 w-5" />
                    </button>
                 </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chats..." 
                        className="w-full pl-9 pr-3 py-2 text-[15px] bg-card border-none rounded-full focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground transition-all" 
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-card scrollbar-custom">
                {conversations === undefined && (
                    <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Loading conversations...</div>
                )}
                {Array.isArray(conversations) && filteredConversations.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                        <p>No conversations found</p>
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="text-xs text-primary font-semibold hover:underline"
                        >
                            Start a new chat
                        </button>
                    </div>
                )}
                {filteredConversations.map((convo: any) => (
                    <ConversationListItem 
                        key={convo._id || convo.id}
                        conversation={convo}
                        isSelected={selectedConversationId === (convo._id || convo.id)}
                        onClick={() => router.push(`/messages?c=${convo._id || convo.id}`)}
                    />
                ))}
            </div>

            {showNewModal && (
                <NewConversationModal onClose={() => setShowNewModal(false)} />
            )}
        </div>
    );
}

