/**
 * Service Registry — Strangler Fig Pattern
 *
 * Provides a facade that wraps legacy (monolithic) Convex calls behind a clean
 * service interface.  New features are built against the service layer; old
 * call-sites are migrated one by one until the legacy path can be removed.
 *
 * Each "service" is a named collection of operations.  The registry supports:
 *   • versioning      – route to v1 or v2 of an operation at runtime
 *   • feature flags   – toggle between legacy and new implementations
 *   • middleware       – cross-cutting concerns (logging, auth, metrics)
 *   • health checks   – each service can expose a lightweight check
 *
 * Usage:
 *   import { ServiceRegistry } from "@/lib/services/service-registry"
 *
 *   const registry = ServiceRegistry.create()
 *   registry.register("posts", postsService)
 *   const result = await registry.execute("posts", "create", payload)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Any async function that accepts a context + args object and returns a result. */
export type ServiceOperation<TArgs = unknown, TResult = unknown> = (
  ctx: ServiceContext,
  args: TArgs
) => Promise<TResult>

/** Minimal execution context passed to every service operation. */
export interface ServiceContext {
  /** Authenticated user id (Convex _id) — undefined for anonymous callers. */
  userId?: string
  /** Trace / correlation id for distributed tracing. */
  traceId: string
  /** ISO-8601 timestamp when the call was initiated. */
  timestamp: string
  /** Arbitrary metadata propagated through the call chain. */
  metadata: Record<string, unknown>
}

/** A service is simply a named map of operations. */
export interface ServiceDefinition {
  name: string
  version: string
  operations: Record<string, ServiceOperation<any, any>>
  healthCheck?: () => Promise<HealthCheckResult>
}

export interface HealthCheckResult {
  healthy: boolean
  latencyMs: number
  details?: Record<string, unknown>
}

/** Middleware that can wrap every service call. */
export type ServiceMiddleware = (
  ctx: ServiceContext,
  serviceName: string,
  operationName: string,
  next: () => Promise<unknown>
) => Promise<unknown>

export interface ServiceRegistryOptions {
  /** Feature flags: `{ "posts.create": "v2" }` routes to the v2 service. */
  featureFlags?: Record<string, string>
  /** Ordered middleware stack applied to every `execute` call. */
  middleware?: ServiceMiddleware[]
}

// ─── Implementation ──────────────────────────────────────────────────────────

export class ServiceRegistry {
  private services = new Map<string, Map<string, ServiceDefinition>>()
  private featureFlags: Record<string, string>
  private middlewareStack: ServiceMiddleware[]

  private constructor(opts: ServiceRegistryOptions = {}) {
    this.featureFlags = { ...opts.featureFlags }
    this.middlewareStack = [...(opts.middleware ?? [])]
  }

  /** Factory so construction details can evolve without breaking callers. */
  static create(opts?: ServiceRegistryOptions): ServiceRegistry {
    return new ServiceRegistry(opts)
  }

  // ── Registration ────────────────────────────────────────────────────────

  /**
   * Register a service (optionally with a version tag).
   * Re-registering the same name+version overwrites the previous definition.
   */
  register(definition: ServiceDefinition): void {
    const key = definition.name
    if (!this.services.has(key)) {
      this.services.set(key, new Map())
    }
    this.services.get(key)!.set(definition.version, definition)
  }

  /** Remove a specific service version. */
  unregister(name: string, version: string): boolean {
    return this.services.get(name)?.delete(version) ?? false
  }

  // ── Execution ───────────────────────────────────────────────────────────

  /**
   * Execute a service operation.
   *
   * Resolution order for the version:
   *   1. Explicit `version` argument
   *   2. Feature flag `"<name>.<operation>"` or `"<name>"`
   *   3. The highest registered version (lexicographic)
   */
  async execute<TResult = unknown>(
    serviceName: string,
    operationName: string,
    args: unknown = {},
    opts: { userId?: string; version?: string; metadata?: Record<string, unknown> } = {}
  ): Promise<TResult> {
    const versions = this.services.get(serviceName)
    if (!versions || versions.size === 0) {
      throw new ServiceNotFoundError(serviceName)
    }

    // Resolve version
    const flagKey = `${serviceName}.${operationName}`
    const resolvedVersion =
      opts.version ??
      this.featureFlags[flagKey] ??
      this.featureFlags[serviceName] ??
      this.latestVersion(versions)

    const definition = versions.get(resolvedVersion)
    if (!definition) {
      throw new ServiceVersionNotFoundError(serviceName, resolvedVersion)
    }

    const operation = definition.operations[operationName]
    if (!operation) {
      throw new OperationNotFoundError(serviceName, operationName)
    }

    const ctx: ServiceContext = {
      userId: opts.userId,
      traceId: generateTraceId(),
      timestamp: new Date().toISOString(),
      metadata: { ...opts.metadata },
    }

    // Build the middleware chain (last middleware calls the actual operation)
    const invokeOperation = () => operation(ctx, args)
    const chain = this.middlewareStack.reduceRight<() => Promise<unknown>>(
      (next, mw) => () => mw(ctx, serviceName, operationName, next),
      invokeOperation
    )

    return chain() as Promise<TResult>
  }

  // ── Health ──────────────────────────────────────────────────────────────

  /** Run health checks on all registered services. */
  async healthCheck(): Promise<Record<string, HealthCheckResult>> {
    const results: Record<string, HealthCheckResult> = {}
    for (const [name, versions] of Array.from(this.services.entries())) {
      const latest = versions.get(this.latestVersion(versions))
      if (latest?.healthCheck) {
        try {
          results[name] = await latest.healthCheck()
        } catch {
          results[name] = { healthy: false, latencyMs: -1, details: { error: "healthCheck threw" } }
        }
      } else {
        results[name] = { healthy: true, latencyMs: 0, details: { note: "no healthCheck defined" } }
      }
    }
    return results
  }

  // ── Feature flags ───────────────────────────────────────────────────────

  /** Update a feature flag at runtime (e.g. A/B testing). */
  setFeatureFlag(key: string, version: string): void {
    this.featureFlags[key] = version
  }

  removeFeatureFlag(key: string): void {
    delete this.featureFlags[key]
  }

  // ── Introspection ───────────────────────────────────────────────────────

  /** List all registered services with their versions. */
  listServices(): Array<{ name: string; versions: string[] }> {
    return Array.from(this.services.entries()).map(([name, versionMap]) => ({
      name,
      versions: Array.from(versionMap.keys()),
    }))
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private latestVersion(versions: Map<string, ServiceDefinition>): string {
    const keys = Array.from(versions.keys()).sort()
    return keys[keys.length - 1]
  }
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export class ServiceNotFoundError extends Error {
  constructor(name: string) {
    super(`Service "${name}" is not registered`)
    this.name = "ServiceNotFoundError"
  }
}

export class ServiceVersionNotFoundError extends Error {
  constructor(name: string, version: string) {
    super(`Service "${name}" version "${version}" is not registered`)
    this.name = "ServiceVersionNotFoundError"
  }
}

export class OperationNotFoundError extends Error {
  constructor(service: string, operation: string) {
    super(`Operation "${operation}" not found in service "${service}"`)
    this.name = "OperationNotFoundError"
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

let traceCounter = 0

/** Simple trace-id generator. Replace with OpenTelemetry in production. */
function generateTraceId(): string {
  traceCounter += 1
  const time = Date.now().toString(36)
  const seq = traceCounter.toString(36).padStart(4, "0")
  const rand = Math.random().toString(36).slice(2, 6)
  return `trc_${time}_${seq}_${rand}`
}
