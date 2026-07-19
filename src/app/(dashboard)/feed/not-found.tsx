import Link from"next/link"

export default function FeedNotFound() {
 return (
 <div className="flex flex-col items-center justify-center py-16 text-center">
 <h2 className="text-xl font-semibold text-ink-deep">Feed not found</h2>
 <p className="mt-2 text-sm text-muted-foreground">
 The feed you&apos;re looking for doesn&apos;t exist.
 </p>
 <Link
 href="/feed"
 className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary/90"
 >
 Go to feed
 </Link>
 </div>
 )
}
