import neo4j, { Driver, Session } from "neo4j-driver"

type Neo4jGlobal = typeof globalThis & {
  __neo4jDriver?: Driver
  __neo4jInitPromise?: Promise<void>
}

const neo4jGlobal = globalThis as Neo4jGlobal

function getNeo4jEnv() {
  const uri = (process.env.NEO4J_URI || "").trim()
  const username = (process.env.NEO4J_USERNAME || "").trim()
  const password = (process.env.NEO4J_PASSWORD || "").trim()
  const database = (process.env.NEO4J_DATABASE || "neo4j").trim()

  if (!uri || !username || !password) {
    throw new Error(
      "Neo4j environment variables not configured. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD."
    )
  }

  return { uri, username, password, database }
}

function isNeo4jAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  return (
    message.includes("unauthorized") ||
    message.includes("authentication failure") ||
    message.includes("invalid credentials")
  )
}

export function getNeo4jDriver(): Driver {
  if (neo4jGlobal.__neo4jDriver) return neo4jGlobal.__neo4jDriver

  const { uri, username, password } = getNeo4jEnv()
  neo4jGlobal.__neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    maxConnectionLifetime: 60 * 60 * 1000,
    maxConnectionPoolSize: 50,
  })
  return neo4jGlobal.__neo4jDriver
}

export function initializeNeo4j(): Promise<void> {
  if (neo4jGlobal.__neo4jInitPromise) {
    return neo4jGlobal.__neo4jInitPromise
  }

  const driver = getNeo4jDriver()
  neo4jGlobal.__neo4jInitPromise = driver.verifyConnectivity().then(() => undefined)
  return neo4jGlobal.__neo4jInitPromise
}

async function withSession<T>(
  mode: "READ" | "WRITE",
  fn: (session: Session) => Promise<T>
): Promise<T> {
  await initializeNeo4j()

  const { database } = getNeo4jEnv()

  const sessionOptions: Parameters<Driver["session"]>[0] = {
    defaultAccessMode: mode === "READ" ? neo4j.session.READ : neo4j.session.WRITE,
  }

  if (database) {
    sessionOptions.database = database
  }

  const session = getNeo4jDriver().session(sessionOptions)

  try {
    return await fn(session)
  } catch (error) {
    if (isNeo4jAuthError(error)) {
      throw new Error(
        "Database authentication failed. Verify NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD."
      )
    }
    throw error
  } finally {
    await session.close()
  }
}

export function runRead<T>(fn: (session: Session) => Promise<T>): Promise<T> {
  return withSession("READ", fn)
}

export function runWrite<T>(fn: (session: Session) => Promise<T>): Promise<T> {
  return withSession("WRITE", fn)
}

export async function closeNeo4jDriver(): Promise<void> {
  const activeDriver = neo4jGlobal.__neo4jDriver
  neo4jGlobal.__neo4jDriver = undefined
  neo4jGlobal.__neo4jInitPromise = undefined
  await activeDriver?.close()
}

export function toPlain(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(record)) {
    if (v !== null && typeof v === "object" && "low" in (v as object)) {
      out[k] = (v as { low: number; high: number }).low
    } else if (v !== null && typeof v === "object" && "toNumber" in (v as object)) {
      out[k] = (v as { toNumber: () => number }).toNumber()
    } else {
      out[k] = v
    }
  }
  return out
}
