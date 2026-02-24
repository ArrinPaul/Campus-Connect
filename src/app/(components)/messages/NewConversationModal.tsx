'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { X, Search, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface NewConversationModalProps {
  onClose: () => void;
}

export function NewConversationModal({ onClose }: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation);

  const users = useQuery(
    api.users.searchUsers,
    searchQuery.trim().length >= 2 ? { query: searchQuery.trim() } : 'skip'
  );

  const handleSelectUser = async (userId: Id<'users'>) => {
    setIsCreating(true);
    try {
      const conversationId = await getOrCreateConversation({ otherUserId: userId });
      onClose();
      router.push(`/messages?c=${conversationId}`);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card border rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">New Conversation</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {searchQuery.trim().length < 2 && (
            <p className="text-sm text-muted-foreground text-center py-8">Type at least 2 characters to search</p>
          )}
          {searchQuery.trim().length >= 2 && users === undefined && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {users?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
          )}
          {users?.map((user: any) => (
            <button
              key={user._id}
              onClick={() => handleSelectUser(user._id)}
              disabled={isCreating}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                {user.profilePicture ? (
                  <Image src={user.profilePicture} alt={user.name} width={40} height={40} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{user.name}</p>
                {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
