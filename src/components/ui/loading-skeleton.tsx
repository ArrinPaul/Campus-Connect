export function PostSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-elevation-1 sm:p-6 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-muted animate-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 rounded-md bg-muted animate-shimmer" />
            <div className="h-4 w-14 rounded-full bg-muted animate-shimmer" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded-md bg-muted animate-shimmer" />
            <div className="h-3 w-5/6 rounded-md bg-muted animate-shimmer" />
          </div>
          <div className="flex gap-3 pt-1">
            <div className="h-7 w-16 rounded-lg bg-muted animate-shimmer" />
            <div className="h-7 w-16 rounded-lg bg-muted animate-shimmer" />
            <div className="h-7 w-16 rounded-lg bg-muted animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function UserCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-elevation-1 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-muted animate-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded-md bg-muted animate-shimmer" />
          <div className="h-3 w-20 rounded-md bg-muted animate-shimmer" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <div className="h-6 w-16 rounded-full bg-muted animate-shimmer" />
        <div className="h-6 w-20 rounded-full bg-muted animate-shimmer" />
      </div>
    </div>
  )
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-elevation-1 animate-pulse">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="h-24 w-24 rounded-full bg-muted animate-shimmer" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-44 rounded-md bg-muted animate-shimmer" />
          <div className="h-4 w-28 rounded-md bg-muted animate-shimmer" />
          <div className="flex gap-4">
            <div className="h-4 w-24 rounded-md bg-muted animate-shimmer" />
            <div className="h-4 w-24 rounded-md bg-muted animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
  }

  return (
    <div
      className={`animate-spin rounded-full border-border border-t-primary ${sizeClasses[size]}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="h-8 w-8 rounded-full bg-muted animate-shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="rounded-xl bg-muted/60 px-4 py-3 space-y-2">
          <div className="h-3 w-24 rounded-md bg-muted animate-shimmer" />
          <div className="h-3 w-full rounded-md bg-muted animate-shimmer" />
          <div className="h-3 w-3/4 rounded-md bg-muted animate-shimmer" />
        </div>
        <div className="h-2 w-16 rounded-md bg-muted animate-shimmer" />
      </div>
    </div>
  )
}

export function FullPageLoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export function ButtonLoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-primary-foreground"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// Message List Skeleton
export function MessageListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`flex items-end gap-2.5 ${
            i % 2 === 0 ? "flex-row-reverse" : ""
          }`}
        >
          {i % 2 !== 0 && <div className="h-7 w-7 rounded-full bg-muted animate-shimmer flex-shrink-0" />}
          <div className={`max-w-[65%] space-y-1 ${i % 2 === 0 ? "items-end" : ""}`}>
            <div className={`rounded-2xl p-3.5 space-y-2 ${
              i % 2 === 0 ? "bg-primary/10 rounded-br-md" : "bg-muted/80 rounded-bl-md"
            }`}>
              <div className="h-3 w-44 rounded-md bg-muted animate-shimmer" />
              <div className="h-3 w-28 rounded-md bg-muted animate-shimmer" />
            </div>
            <div className="h-2 w-12 rounded-md bg-muted/60 animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Community Card Skeleton
export function CommunityCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-elevation-1">
      <div className="space-y-3">
        <div className="h-5 w-3/4 rounded-md bg-muted animate-shimmer" />
        <div className="h-3.5 w-full rounded-md bg-muted animate-shimmer" />
        <div className="h-3.5 w-5/6 rounded-md bg-muted animate-shimmer" />
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-muted animate-shimmer" />
            <div className="h-6 w-16 rounded-full bg-muted animate-shimmer" />
          </div>
          <div className="h-9 w-24 rounded-xl bg-muted animate-shimmer" />
        </div>
      </div>
    </div>
  )
}

// Event Card Skeleton
export function EventCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-elevation-1">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-muted animate-shimmer flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 rounded-md bg-muted animate-shimmer" />
            <div className="h-3 w-1/2 rounded-md bg-muted animate-shimmer" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted animate-shimmer" />
            <div className="h-3 w-32 rounded-md bg-muted animate-shimmer" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted animate-shimmer" />
            <div className="h-3 w-24 rounded-md bg-muted animate-shimmer" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 w-20 rounded-md bg-muted animate-shimmer" />
          <div className="h-9 w-24 rounded-xl bg-muted animate-shimmer" />
        </div>
      </div>
    </div>
  )
}

// Listing Detail Skeleton
export function ListingDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <div className="h-4 w-32 rounded-md bg-muted animate-shimmer" />
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image skeleton */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl bg-muted animate-shimmer" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-16 rounded-lg bg-muted animate-shimmer" />
              ))}
            </div>
          </div>
          {/* Details skeleton */}
          <div className="space-y-4">
            <div className="h-7 w-3/4 rounded-md bg-muted animate-shimmer" />
            <div className="h-6 w-1/3 rounded-md bg-muted animate-shimmer" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded-md bg-muted animate-shimmer" />
              <div className="h-4 w-full rounded-md bg-muted animate-shimmer" />
              <div className="h-4 w-2/3 rounded-md bg-muted animate-shimmer" />
            </div>
            <div className="flex gap-4 pt-4">
              <div className="h-10 flex-1 rounded-xl bg-muted animate-shimmer" />
              <div className="h-10 flex-1 rounded-xl bg-muted animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Leaderboard Entry Skeleton
export function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="w-8 h-8 bg-muted animate-shimmer rounded-full" />
          <div className="h-10 w-10 bg-muted animate-shimmer rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted animate-shimmer rounded-md w-1/4" />
            <div className="h-3 bg-muted animate-shimmer rounded-md w-1/3" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-16 bg-muted animate-shimmer rounded-md" />
            <div className="h-5 w-12 bg-muted animate-shimmer rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
