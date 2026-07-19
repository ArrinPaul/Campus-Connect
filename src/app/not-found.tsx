import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-ink-deep">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-ink-deep">Page not found</h2>
      <p className="mt-2 text-sm text-slate">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/feed"
        className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90"
      >
        Go to feed
      </Link>
    </div>
  )
}
