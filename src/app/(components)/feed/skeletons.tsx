const Skeleton = ({ className }: { className?: string }) => (
  <div className={`bg-muted/50 animate-pulse rounded-md ${className}`} />
);

const PostCardSkeleton = () => (
  <div className="rounded-lg border bg-card p-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="mt-4 flex justify-between">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-16" />
    </div>
  </div>
);

export const FeedSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Create Post Skeleton */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 flex-1 rounded-full" />
        </div>
      </div>
      {/* Post Skeletons */}
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </div>
  );
};
