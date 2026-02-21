import { WifiOff, RefreshCw } from "lucide-react"

export const metadata = {
  title: "Offline — Campus Connect",
}

// Fully static — generated at build time
export const revalidate = false

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
      </div>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        You&apos;re offline
      </h1>

      <p className="mt-3 max-w-sm text-muted-foreground">
        It looks like you&apos;ve lost your internet connection. Check your
        network and try again.
      </p>

      <a
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow-sm transition-colors hover:bg-primary/90"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </a>
    </div>
  )
}
