"use client"

/**
 * SkipLink – renders a visually-hidden anchor that becomes visible on focus,
 * allowing keyboard / screen-reader users to jump past the navigation directly
 * to the page's main content area.
 *
 * Usage: place this as the very first child inside <body> and make sure the
 * target element has id="main-content".
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={[
        // Visually hidden by default
        "sr-only",
        // Revealed when focused
        "focus:not-sr-only focus:absolute focus:z-[9999]",
        "focus:top-4 focus:left-4",
        "focus:flex focus:items-center focus:gap-2",
        "focus:rounded-lg focus:border focus:border-primary/30",
        "focus:bg-background focus:px-4 focus:py-2.5",
        "focus:text-sm focus:font-medium focus:text-foreground",
        "focus:shadow-elevation-2 focus:outline-none",
        "focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-none",
      ].join(" ")}
    >
      Skip to main content
    </a>
  )
}
