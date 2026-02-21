// This file is used to register Sentry's instrumentation hook.
// It's automatically loaded by Next.js via the instrumentation API.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }
}

export const onRequestError = async (...args: unknown[]) => {
  const { captureRequestError } = await import("@sentry/nextjs")
  // @ts-expect-error — Sentry's types may lag behind Next.js instrumentation API
  return captureRequestError(...args)
}
