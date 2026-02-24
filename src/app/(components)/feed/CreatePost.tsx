'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Send, Image as ImageIcon, ChartBar, File, Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import type { Id } from '@/convex/_generated/dataModel';

type Props = {
    communityId?: Id<'communities'>;
};

export function CreatePost({ communityId }: Props) {
  const convexAuth = useConvexAuth();
  const isAuthenticated = convexAuth?.isAuthenticated ?? false;
  const isLoading = convexAuth?.isLoading ?? true;
  
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const createPost = useMutation(api.posts.createPost);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to post");
      return;
    }

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
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
      // Filter out irrelevant error details for user-friendly message
      const userMsg = errorMsg.includes("Unauthorized") 
        ? "You need to be signed in to post."
        : errorMsg.includes("ONBOARDING_REQUIRED")
        ? "Please complete onboarding before posting."
        : errorMsg;
      toast.error("Failed to create post", {
        description: userMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    // Show loading skeleton while Convex auth is initializing
    return (
      <div className="rounded-lg border bg-card p-3 sm:p-4 mb-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
          <div className="w-full space-y-2">
            <div className="h-12 bg-muted rounded" />
            <div className="h-8 bg-muted rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Show sign-in prompt
    return (
      <div className="rounded-lg border bg-card p-6 mb-4 text-center">
        <LogIn className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Sign in to post</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Join the conversation by signing in to your account.
        </p>
        <Link href="/sign-in">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium">
            Sign In
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0">
          {currentUser?.profilePicture ? (
            <Image src={currentUser.profilePicture} alt={currentUser.name ?? ''} width={40} height={40} className="h-full w-full rounded-full object-cover" />
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
                        <ChartBar className="h-5 w-5" />
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
