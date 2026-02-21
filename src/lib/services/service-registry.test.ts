import {
  ServiceRegistry,
  ServiceNotFoundError,
  ServiceVersionNotFoundError,
  OperationNotFoundError,
} from "./service-registry"
import type { ServiceMiddleware } from "./service-registry"

describe("ServiceRegistry", () => {
  let registry: ServiceRegistry

  beforeEach(() => {
    registry = ServiceRegistry.create()
  })

  // ── Registration ────────────────────────────────────────────────────────

  it("registers and lists services", () => {
    registry.register({
      name: "users",
      version: "1.0.0",
      operations: { getUser: async () => ({ id: "u1" }) },
    })
    const list = registry.listServices()
    expect(list).toEqual([{ name: "users", versions: ["1.0.0"] }])
  })

  it("supports multiple versions of the same service", () => {
    registry.register({
      name: "posts",
      version: "1.0.0",
      operations: { list: async () => [] },
    })
    registry.register({
      name: "posts",
      version: "2.0.0",
      operations: { list: async () => [], search: async () => [] },
    })
    const list = registry.listServices()
    expect(list[0].versions).toEqual(["1.0.0", "2.0.0"])
  })

  // ── Execution ───────────────────────────────────────────────────────────

  it("executes an operation on the latest version by default", async () => {
    registry.register({
      name: "auth",
      version: "1.0.0",
      operations: { login: async () => "v1" },
    })
    registry.register({
      name: "auth",
      version: "2.0.0",
      operations: { login: async () => "v2" },
    })
    const result = await registry.execute("auth", "login")
    expect(result).toBe("v2")
  })

  it("executes a specific version when requested", async () => {
    registry.register({
      name: "auth",
      version: "1.0.0",
      operations: { login: async () => "v1" },
    })
    registry.register({
      name: "auth",
      version: "2.0.0",
      operations: { login: async () => "v2" },
    })
    const result = await registry.execute("auth", "login", {}, { version: "1.0.0" })
    expect(result).toBe("v1")
  })

  it("routes via feature flags", async () => {
    registry.register({
      name: "feed",
      version: "1.0.0",
      operations: { get: async () => "old" },
    })
    registry.register({
      name: "feed",
      version: "2.0.0",
      operations: { get: async () => "new" },
    })
    registry.setFeatureFlag("feed", "2.0.0")
    const result = await registry.execute("feed", "get")
    expect(result).toBe("new")
  })

  // ── Middleware ───────────────────────────────────────────────────────────

  it("runs middleware in order around operations", async () => {
    const order: string[] = []
    const mw1: ServiceMiddleware = async (_ctx, _svc, _op, next) => {
      order.push("before-1")
      const r = await next()
      order.push("after-1")
      return r
    }
    const mw2: ServiceMiddleware = async (_ctx, _svc, _op, next) => {
      order.push("before-2")
      const r = await next()
      order.push("after-2")
      return r
    }
    const reg = ServiceRegistry.create({ middleware: [mw1, mw2] })
    reg.register({
      name: "svc",
      version: "1.0.0",
      operations: {
        op: async () => {
          order.push("handler")
          return "done"
        },
      },
    })
    await reg.execute("svc", "op")
    expect(order).toEqual(["before-1", "before-2", "handler", "after-2", "after-1"])
  })

  // ── Health Checks ───────────────────────────────────────────────────────

  it("reports healthy when all checks pass", async () => {
    registry.register({
      name: "db",
      version: "1.0.0",
      operations: {},
      healthCheck: async () => ({ healthy: true, latencyMs: 1 }),
    })
    const health = await registry.healthCheck()
    expect(health.db.healthy).toBe(true)
  })

  it("reports unhealthy when a check fails", async () => {
    registry.register({
      name: "broken",
      version: "1.0.0",
      operations: {},
      healthCheck: async () => ({ healthy: false, latencyMs: 0 }),
    })
    const health = await registry.healthCheck()
    expect(health.broken.healthy).toBe(false)
  })

  // ── Errors ──────────────────────────────────────────────────────────────

  it("throws ServiceNotFoundError for unknown service", async () => {
    await expect(registry.execute("nope", "op")).rejects.toThrow(ServiceNotFoundError)
  })

  it("throws ServiceVersionNotFoundError for unknown version", async () => {
    registry.register({ name: "svc", version: "1.0.0", operations: {} })
    await expect(registry.execute("svc", "op", {}, { version: "9.9.9" })).rejects.toThrow(
      ServiceVersionNotFoundError
    )
  })

  it("throws OperationNotFoundError for unknown operation", async () => {
    registry.register({
      name: "svc",
      version: "1.0.0",
      operations: { real: async () => 1 },
    })
    await expect(registry.execute("svc", "fake")).rejects.toThrow(OperationNotFoundError)
  })

  // ── Unregister ──────────────────────────────────────────────────────────

  it("unregisters a service version", () => {
    registry.register({ name: "svc", version: "1.0.0", operations: {} })
    const removed = registry.unregister("svc", "1.0.0")
    expect(removed).toBe(true)
    expect(registry.listServices()[0].versions).toEqual([])
  })

  it("returns false when unregistering a non-existent version", () => {
    expect(registry.unregister("ghost", "1.0.0")).toBe(false)
  })
})
