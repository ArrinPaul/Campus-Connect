// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Session Replay for debugging user issues
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media by default for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out noisy/irrelevant errors
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      return null
    }

    // Ignore network errors (user offline, connection issues)
    if (event.message?.includes("Failed to fetch")) {
      return null
    }
    if (event.message?.includes("NetworkError")) {
      return null
    }
    if (event.message?.includes("Network request failed")) {
      return null
    }

    // Ignore 404 errors
    if (event.message?.includes("404")) {
      return null
    }

    // Ignore aborted requests (user navigated away)
    if (event.message?.includes("AbortError")) {
      return null
    }
    if (event.message?.includes("The operation was aborted")) {
      return null
    }

    // Ignore ResizeObserver errors (benign browser quirk)
    if (event.message?.includes("ResizeObserver")) {
      return null
    }

    // Ignore browser extension errors
    if (event.exception?.values?.some(e => 
      e.stacktrace?.frames?.some(f => 
        f.filename?.includes("chrome-extension://") || 
        f.filename?.includes("moz-extension://")
      )
    )) {
      return null
    }

    return event
  },

  environment: process.env.NODE_ENV || "development",
})
