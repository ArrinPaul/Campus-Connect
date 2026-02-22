'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Send, Image as ImageIcon, Poll, File, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { Id } from '@/convex/_generated/dataModel';

type Props = {
    communityId?: Id<'communities'>;
};

export function CreatePost({ communityId }: Props) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const createPost = useMutation(api.posts.createPost);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (content.trim().length === 0) {
      toast.error("Post content cannot be empty.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createPost({
        content,
        ...(communityId && { communityId }),
      });
      setContent('');
      toast.success("Your post has been published!");
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post", {
        description: (error as Error).message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0">
          {currentUser?.profilePicture ? (
            <img src={currentUser.profilePicture} alt={currentUser.name ?? ''} className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="h-full w-full rounded-full bg-primary/10" />
          )}
        </div>
        <div className="w-full">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={communityId ? "Post to this community..." : "What's on your mind?"}
                className="w-full bg-transparent text-base sm:text-lg focus:outline-none placeholder-muted-foreground resize-none"
                rows={3}
                disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-muted-foreground">
                    <button className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50" disabled={isSubmitting}>
                        <ImageIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50" disabled={isSubmitting}>
                        <Poll className="h-5 w-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50" disabled={isSubmitting}>
                        <File className="h-5 w-5" />
                    </button>
                </div>
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || content.trim().length === 0}
                    className="bg-primary text-primary-foreground rounded-full p-2.5 shadow-md hover:bg-primary/90 transition-colors btn-press disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
