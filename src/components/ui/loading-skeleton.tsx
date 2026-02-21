export function PostSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border bg-card p-6 shadow-sm border-border bg-card">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
          <div className="flex gap-4">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function UserCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border bg-card p-4 shadow-sm border-border bg-card">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <div className="h-6 w-16 rounded-full bg-muted" />
        <div className="h-6 w-20 rounded-full bg-muted" />
      </div>
    </div>
  )
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border bg-card p-6 shadow-sm border-border bg-card">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="h-24 w-24 rounded-full bg-muted" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="flex gap-4">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
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
    <div className="animate-pulse flex gap-3">
      <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="rounded-lg bg-muted px-4 py-2 space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
        <div className="h-2 w-16 rounded bg-muted" />
      </div>
    </div>
  )
}

export function FullPageLoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
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
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`flex items-start gap-3 animate-pulse ${
            i % 2 === 0 ? "flex-row-reverse" : ""
          }`}
        >
          <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
          <div className={`max-w-[70%] space-y-1 ${i % 2 === 0 ? "items-end" : ""}`}>
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="rounded-2xl bg-muted p-3 space-y-2">
              <div className="h-3 w-48 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Community Card Skeleton
export function CommunityCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border bg-card p-6 shadow-sm border-border bg-card">
      <div className="space-y-4">
        <div className="h-6 w-3/4 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-muted" />
            <div className="h-6 w-16 rounded-full bg-muted" />
          </div>
          <div className="h-9 w-24 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  )
}

// Event Card Skeleton
export function EventCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border bg-card p-5 shadow-sm border-border bg-card">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-9 w-24 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  )
}

// Listing Detail Skeleton
export function ListingDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image skeleton */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl bg-muted" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-16 rounded-lg bg-muted" />
              ))}
            </div>
          </div>
          {/* Details skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded bg-muted" />
            <div className="h-6 w-1/3 rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
            <div className="flex gap-4 pt-4">
              <div className="h-10 flex-1 rounded-lg bg-muted" />
              <div className="h-10 flex-1 rounded-lg bg-muted" />
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
          className="bg-card border rounded-xl p-4 animate-pulse flex items-center gap-4"
        >
          <div className="w-8 h-8 bg-muted rounded-full" />
          <div className="h-10 w-10 bg-muted rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-16 bg-muted rounded" />
            <div className="h-6 w-12 bg-muted rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
