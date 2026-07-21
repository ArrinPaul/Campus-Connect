'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { PostCard } from '@/components/posts/PostCard';
import { Modal } from '@/components/ui/modal';
import { FeedSkeleton } from '@/app/(components)/feed/skeletons';

export default function PostModal({ params }: { params: { id: string } }) {
  const result = useQuery(api.posts.getPostById, { postId: params.id });

  const post = result?.post ?? (result?._id || result?.id ? result : null);
  const author = result?.author ?? post?.author ?? {
    _id: post?.authorId || post?.author_id,
    name: 'User',
    role: 'Student',
  };

  return (
    <Modal>
      {result === undefined ? (
        <div className="p-4">
          <FeedSkeleton />
        </div>
      ) : post ? (
        <PostCard post={post} author={author} />
      ) : (
        <div className="p-8 text-center text-slate">Post not found</div>
      )}
    </Modal>
  );
}
