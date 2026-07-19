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
"focus:rounded-lg focus:border focus:border-hairline",
"focus:bg-canvas focus:px-4 focus:py-2.5",
"focus:text-sm focus:font-medium focus:text-ink-deep",
"focus:shadow-sm focus:outline-none",
"focus:ring-2 focus:ring-primary focus:ring-offset-2",
"transition-none",
 ].join(" ")}
 >
 Skip to main content
 </a>
 )
}
