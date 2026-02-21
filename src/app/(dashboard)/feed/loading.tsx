export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Story row skeleton */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-full bg-muted" />
                  <div className="h-2 w-10 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>

          {/* Composer skeleton */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-2 w-36 rounded bg-muted" />
              </div>
            </div>
            <div className="h-10 rounded-lg bg-muted" />
          </div>

          {/* Tab skeleton */}
          <div className="rounded-xl border border-border bg-card p-1.5 flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 h-10 rounded-lg bg-muted" />
            ))}
          </div>

          {/* Post card skeletons */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-28 rounded bg-muted" />
                  <div className="h-2 w-20 rounded bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
                <div className="h-3 w-3/5 rounded bg-muted" />
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="h-4 w-12 rounded bg-muted" />
                <div className="h-4 w-12 rounded bg-muted" />
                <div className="h-4 w-12 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar skeleton */}
        <aside className="hidden lg:block lg:col-span-4">
          <div className="sticky top-[76px] space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="h-4 w-32 rounded bg-muted" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-muted" />
                    <div className="h-3 flex-1 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
