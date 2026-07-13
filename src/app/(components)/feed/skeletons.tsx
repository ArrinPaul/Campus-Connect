const Skeleton = ({ className }: { className?: string }) => (
  <div className={`bg-muted/50 animate-pulse rounded-md ${className}`} />
);

const PostCardSkeleton = () => (
  <div className="w-full bg-canvas/70 dark:bg-canvas/40 backdrop-blur-md border-b border-hairline py-lg md:py-xl">
    <div className="max-w-2xl mx-auto px-4 md:px-0 flex gap-3 md:gap-4">
      {/* Left Column: Avatar */}
      <div className="shrink-0 mt-1">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Right Column: Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        <div className="space-y-2 mt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="mt-4 flex justify-between pr-4">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

export const FeedSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Create Post Skeleton */}
      <div className="w-full bg-canvas/70 dark:bg-canvas/40 backdrop-blur-md border-b border-hairline p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <Skeleton className="h-12 flex-1 rounded-full" />
        </div>
      </div>
      {/* Post Skeletons */}
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </div>
  );
};
