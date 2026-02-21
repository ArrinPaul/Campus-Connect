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
