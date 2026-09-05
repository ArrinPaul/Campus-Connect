import type { LucideIcon } from "lucide-react"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"

interface StateAction {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: StateAction
  className?: string
}

/**
 * Shared "nothing here" card — consolidates a pattern that was hand-rolled
 * slightly differently on ~10+ pages (communities, find-experts,
 * find-partners, bookmarks, etc): centered icon at reduced opacity, a
 * title, an optional description, an optional single action button.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center", className)}>
      <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-40" />
      <h3 className="text-sm font-semibold text-foreground sm:text-base">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-canvas"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  action?: StateAction
  className?: string
}

/**
 * Shared "something went wrong" card — same shape as EmptyState but with a
 * warning icon and copy defaults, so a page only needs to pass what's
 * actually different about its error (usually nothing).
 */
export function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("mx-auto max-w-lg rounded-lg border border-critical/30 bg-critical/5 p-8 text-center", className)}>
      <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-critical opacity-70" />
      <h3 className="text-sm font-semibold text-foreground sm:text-base">{title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-full bg-critical px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-critical/90"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

interface LoadingStateProps {
  label?: string
  className?: string
}

/**
 * Shared inline loading state for a page section that isn't rendering a
 * skeleton (see loading-skeleton.tsx for content-shaped skeletons — use
 * this only where a spinner is actually the right call, e.g. a brief
 * action rather than an initial page load).
 */
export function LoadingState({ label = "Loading...", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}>
      <LoadingSpinner size="md" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
