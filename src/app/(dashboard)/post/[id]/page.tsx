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

 if (!result || !result.post) {
 return notFound();
 }

 return (
 <div className="max-w-2xl mx-auto pt-6">
 <PostCard post={result.post} author={result.author} />
 </div>
 );
}
