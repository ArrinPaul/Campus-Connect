'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { PostCard } from '@/components/posts/PostCard';
import { notFound } from 'next/navigation';
import { FeedSkeleton } from '@/app/(components)/feed/skeletons';

export default function PostPage({ params }: { params: { id: string } }) {
  const result = useQuery(api.posts.getPostById, { postId: params.id });

  if (result === undefined) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <FeedSkeleton />
      </div>
    );
  }

  const post = result?.post ?? (result?.id ? result : null);
  const author = result?.author ?? post?.author ?? {
    id: post?.author_id,
    name: 'User',
    role: 'Student',
  };

  if (!post) {
    return notFound();
  }

  return (
    <div className="max-w-2xl mx-auto pt-6">
      <PostCard post={post} author={author} />
    </div>
  );
}
