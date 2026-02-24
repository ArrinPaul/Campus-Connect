'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

type Props = {
    conversationId: Id<'conversations'>;
};

export function ChatWindow({ conversationId }: Props) {
    // These queries will suspend, caught by the parent Suspense boundary
    const messages = useQuery(api.messages.getMessages, { conversationId });
    const conversation = useQuery(api.conversations.getConversation, { conversationId });
    const currentUser = useQuery(api.users.getCurrentUser);
    
    const markAsRead = useMutation(api.messages.markAsRead);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView();
    }

    useEffect(() => {
        // Scroll to bottom on initial load and when new messages arrive
        scrollToBottom();
    }, [messages]);

    // Mark latest message as read when viewing
    useEffect(() => {
        if (messages?.messages && messages.messages.length > 0 && currentUser) {
            const lastMsg = messages.messages[messages.messages.length - 1];
            if (lastMsg.senderId !== currentUser._id) {
                markAsRead({ conversationId, messageId: lastMsg._id }).catch(() => {});
            }
        }
    }, [messages, conversationId, markAsRead, currentUser]);

    const chatPartner = conversation?.participants?.find(p => p._id !== currentUser?._id);

    return (
        <div className="flex flex-col h-full bg-card">
            {/* Chat Header */}
            <div className="p-3 border-b flex items-center gap-3 flex-shrink-0">
                <Link href="/messages" className="md:hidden mr-2 p-2 rounded-full hover:bg-muted">
                    <ArrowLeft className="h-5 w-5"/>
                </Link>
                <div className="relative h-10 w-10 rounded-full bg-muted">
                    {chatPartner?.profilePicture && <Image src={chatPartner.profilePicture} alt={chatPartner.name ?? ''} width={40} height={40} className="h-full w-full rounded-full object-cover" />}
                    {/* TODO: Add online status indicator */}
                </div>
                <p className="font-bold">{chatPartner?.name ?? '...'}</p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto scrollbar-custom">
                <div className="space-y-4">
                    {messages?.messages.map((msg) => (
                        <ChatMessage key={msg._id} message={msg as any} />
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-2 border-t bg-background flex-shrink-0">
                <ChatInput conversationId={conversationId} />
            </div>
        </div>
    );
}
