'use client';

import {
  MessageCircle,
  Repeat2,
  Heart,
  Bookmark,
  MoreHorizontal,
} from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { FeedItem } from './types';

type PostCardProps = {
  item: FeedItem;
};

const PostAuthorHeader = ({ author, createdAt }: { author: FeedItem['post']['author'], createdAt: number }) => {
    if (!author) return null;

    return (
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0">
                {author.profilePicture && (
                    <Image src={author.profilePicture} alt={author.name} width={40} height={40} className="h-full w-full rounded-full object-cover" />
                )}
            </div>
            <div>
                <p className="font-bold">{author.name}</p>
                <p className="text-sm text-muted-foreground">
                    @{author.username} · {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </p>
            </div>
             <button className="ml-auto p-2 rounded-full hover:bg-muted">
                <MoreHorizontal className="h-5 w-5" />
            </button>
        </div>
    )
}

const PostActions = ({ post }: { post: FeedItem['post'] }) => (
    <div className="mt-4 flex items-center justify-between text-muted-foreground">
        <button className="flex items-center gap-2 rounded-full p-2 hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">{post.commentCount}</span>
        </button>
        <button className="flex items-center gap-2 rounded-full p-2 hover:bg-green-500/10 hover:text-green-500 transition-colors">
            <Repeat2 className="h-5 w-5" />
            <span className="text-sm font-semibold">{post.shareCount}</span>
        </button>
        <button className="flex items-center gap-2 rounded-full p-2 hover:bg-red-500/10 hover:text-red-500 transition-colors">
            <Heart className="h-5 w-5" />
            <span className="text-sm font-semibold">{post.likeCount}</span>
        </button>
        <button className="rounded-full p-2 hover:bg-yellow-500/10 hover:text-yellow-500 transition-colors">
            <Bookmark className="h-5 w-5" />
        </button>
    </div>
)


export function PostCard({ item }: PostCardProps) {
  const { post } = item;
  
  return (
    <article className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30">
      {item.type === 'repost' && item.reposter && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 ml-8">
              <Repeat2 className="h-4 w-4" />
              <span>{item.reposter.name} reposted</span>
          </div>
      )}

      <div className="flex flex-col">
        <PostAuthorHeader author={post.author} createdAt={post.createdAt} />
        
        <div className="mt-4 pl-[52px]">
            <p className="whitespace-pre-wrap text-base">{post.content}</p>

            {/* TODO: Render media (images, link previews, etc.) */}
            
            {item.type === 'repost' && item.quoteContent && (
                <div className="mt-3 rounded-lg border p-3">
                     <p className="whitespace-pre-wrap text-sm">{item.quoteContent}</p>
                </div>
            )}
        </div>

        <div className="pl-[52px]">
            <PostActions post={post} />
        </div>
      </div>
    </article>
  );
}
