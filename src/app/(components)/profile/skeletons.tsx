const Skeleton = ({ className }: { className?: string }) => (
  <div className={`bg-muted/50 animate-pulse rounded-md ${className}`} />
);

export const ProfileSkeleton = () => {
  return (
    <div>
      {/* Banner */}
      <Skeleton className="h-36 sm:h-48 w-full" />
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="-mt-16 sm:-mt-20 flex items-end gap-4">
          <Skeleton className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-background" />
          <div className="pb-4 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6 space-y-2">
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-4 w-2/3 max-w-md" />
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-4 border-b">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
        </div>

        {/* Post Skeletons */}
        <div className="mt-8 space-y-4 max-w-xl mx-auto">
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
            </div>
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
            </div>
        </div>
      </div>
    </div>
  );
};
