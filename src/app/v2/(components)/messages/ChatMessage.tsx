'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Based on the return value of the `getMessages` query
type Message = {
    _id: string;
    content: string;
    createdAt: number;
    isOwn: boolean;
    senderAvatar?: string | null;
    senderName: string;
    messageType: 'text' | 'image' | 'file' | 'system';
};

type Props = {
    message: Message;
};

export function ChatMessage({ message }: Props) {
    const time = format(new Date(message.createdAt), 'p');

    if (message.messageType === 'system') {
        return (
            <div className="text-center text-xs text-muted-foreground py-2">
                {message.content}
            </div>
        );
    }

    return (
        <div className={cn("flex items-end gap-2", { "justify-end": message.isOwn })}>
            {!message.isOwn && (
                 <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0">
                    {message.senderAvatar && <img src={message.senderAvatar} alt={message.senderName} className="h-full w-full rounded-full object-cover" />}
                </div>
            )}
            <div className={cn(
                "group relative max-w-xs md:max-w-md lg:max-w-lg px-3 py-2 rounded-2xl", 
                { "bg-primary text-primary-foreground": message.isOwn },
                { "bg-muted": !message.isOwn }
            )}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                 <div 
                    className="text-2xs text-muted-foreground/70 absolute -bottom-5 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={new Date(message.createdAt).toLocaleString()}
                >
                    {time}
                </div>
            </div>
        </div>
    );
}
