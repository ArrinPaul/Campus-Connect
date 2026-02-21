export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100vh-60px)] animate-pulse">
      {/* Conversation list */}
      <div className="w-80 border-r border-border p-4 space-y-3 hidden md:block">
        <div className="h-10 rounded-lg bg-muted" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="h-11 w-11 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-2 w-full rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border px-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 rounded bg-muted" />
            <div className="h-2 w-16 rounded bg-muted" />
          </div>
        </div>
        {/* Messages area */}
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <div className={`rounded-2xl bg-muted ${i % 2 === 0 ? "w-2/5" : "w-1/3"} h-10`} />
            </div>
          ))}
        </div>
        {/* Input */}
        <div className="h-16 border-t border-border px-4 flex items-center">
          <div className="h-10 flex-1 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  )
}
