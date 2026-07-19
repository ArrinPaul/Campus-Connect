export default function FeedLoading() {
 return (
 <div className="space-y-3 sm:space-y-4">
 {[...Array(3)].map((_, i) => (
 <div key={i} className="animate-pulse rounded-lg bg-card p-4 shadow-elevation-1 sm:p-6">
 <div className="flex items-center gap-2 sm:gap-3">
 <div className="h-8 w-8 rounded-full bg-muted sm:h-10 sm:w-10" />
 <div className="flex-1 space-y-2">
 <div className="h-3 w-24 rounded bg-muted sm:h-4 sm:w-32" />
 <div className="h-2 w-16 rounded bg-muted sm:h-3 sm:w-24" />
 </div>
 </div>
 <div className="mt-3 space-y-2 sm:mt-4">
 <div className="h-3 w-full rounded bg-muted sm:h-4" />
 <div className="h-3 w-3/4 rounded bg-muted sm:h-4" />
 </div>
 </div>
 ))}
 </div>
 )
}
