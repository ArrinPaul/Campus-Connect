declare module "@sentry/nextjs" {
  export function captureException(error: unknown, ...args: unknown[]): void
}
