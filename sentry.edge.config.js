import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://mock-dsn@sentry.io/mock",
  tracesSampleRate: 0.1,
});
