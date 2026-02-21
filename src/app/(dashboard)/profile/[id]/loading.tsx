export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 animate-pulse">
      {/* Cover */}
      <div className="h-48 rounded-xl bg-muted" />

      {/* Profile header */}
      <div className="relative px-6 -mt-12">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="h-24 w-24 rounded-full bg-muted border-4 border-background" />
          <div className="flex-1 space-y-2 pb-2">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded-lg bg-muted" />
            <div className="h-9 w-24 rounded-lg bg-muted" />
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 w-8 rounded bg-muted" />
              <div className="h-2 w-14 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="mt-6 border-b border-border flex gap-6 px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-16 rounded bg-muted" />
        ))}
      </div>

      {/* Post skeletons */}
      <div className="mt-6 space-y-4 px-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
            <div className="h-3 w-2/5 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
