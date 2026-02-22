const Skeleton = ({ className }: { className?: string }) => (
  <div className={`bg-muted/50 animate-pulse rounded-md ${className}`} />
);

const ConversationListItemSkeleton = () => (
    <div className="flex items-center gap-3 p-2">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
        </div>
    </div>
);

const ConversationListSkeleton = () => (
    <div className="p-2 space-y-2">
        <ConversationListItemSkeleton />
        <ConversationListItemSkeleton />
        <ConversationListItemSkeleton />
        <ConversationListItemSkeleton />
        <ConversationListItemSkeleton />
        <ConversationListItemSkeleton />
        <ConversationListItemSkeleton />
    </div>
);

const ChatWindowSkeleton = () => (
    <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                    <Skeleton className="h-5 w-32" />
                </div>
            </div>
        </div>
        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-hidden">
            <div className="flex justify-end">
                <Skeleton className="h-12 w-2/5 rounded-lg" />
            </div>
            <div className="flex justify-start">
                <Skeleton className="h-16 w-3/5 rounded-lg" />
            </div>
             <div className="flex justify-end">
                <Skeleton className="h-8 w-1/4 rounded-lg" />
            </div>
             <div className="flex justify-start">
                <Skeleton className="h-12 w-2/5 rounded-lg" />
            </div>
        </div>
        {/* Input */}
        <div className="p-4 border-t flex-shrink-0">
            <Skeleton className="h-10 w-full rounded-lg" />
        </div>
    </div>
);


export const MessagesSkeleton = () => {
    return (
        <div className="flex h-[calc(100vh-60px)] md:h-screen">
            <div className="hidden md:flex flex-col w-full max-w-xs border-r">
                <div className="p-4 border-b"><Skeleton className="h-8 w-full"/></div>
                <ConversationListSkeleton />
            </div>
            <div className="hidden md:flex flex-1">
                <ChatWindowSkeleton />
            </div>
            <div className="md:hidden w-full">
                <ConversationListSkeleton/>
            </div>
        </div>
    );
}
