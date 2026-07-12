'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { PostCard } from '@/components/posts/PostCard';
import { Modal } from '@/components/ui/modal';
import { FeedSkeleton } from '@/app/(components)/feed/skeletons';

export default function PostModal({ params }: { params: { id: string } }) {
  const result = useQuery(api.posts.getPostById, { postId: params.id });

  return (
    <Modal>
      {result === undefined ? (
        <div className="p-4">
          <FeedSkeleton />
        </div>
      ) : result?.post ? (
        <PostCard post={result.post} author={result.author} />
      ) : (
        <div className="p-8 text-center text-ink-muted">Post not found</div>
      )}
    </Modal>
  );
}
