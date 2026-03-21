import "server-only"

import neo4j, { Driver, Session } from "neo4j-driver"

let driver: Driver | null = null
let activeUri: string | null = null

function getNeo4jEnv() {
  const uri = process.env.NEO4J_URI
  const username = process.env.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !username || !password) {
    throw new Error("Neo4j environment variables are not configured. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD.")
  }

  return { uri, username, password }
}

function toDirectBoltUri(uri: string): string {
  if (uri.startsWith("neo4j+s://")) return `bolt+s://${uri.slice("neo4j+s://".length)}`
  if (uri.startsWith("neo4j+ssc://")) return `bolt+ssc://${uri.slice("neo4j+ssc://".length)}`
  if (uri.startsWith("neo4j://")) return `bolt://${uri.slice("neo4j://".length)}`
  return uri
}

function isRoutingDiscoveryError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return /could not perform discovery|no routing servers available/i.test(error.message)
}

function isDatabaseNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return /database .* not found|database does not exist/i.test(error.message)
}

function switchToDirectDriver(): boolean {
  const { uri, username, password } = getNeo4jEnv()
  const directUri = toDirectBoltUri(uri)

  if (directUri === uri || activeUri === directUri) {
    return false
  }

  void driver?.close().catch(() => {
    // Ignore close errors during fallback; we'll try opening a fresh driver.
  })

  driver = neo4j.driver(directUri, neo4j.auth.basic(username, password), {
    maxConnectionLifetime: 60 * 60 * 1000,
    maxConnectionPoolSize: 50,
  })
  activeUri = directUri
  return true
}

export function getNeo4jDriver(): Driver {
  if (driver) return driver

  const { uri, username, password } = getNeo4jEnv()
  driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    maxConnectionLifetime: 60 * 60 * 1000,
    maxConnectionPoolSize: 50,
  })
  activeUri = uri
  return driver
}

async function withSession<T>(mode: "READ" | "WRITE", fn: (session: Session) => Promise<T>): Promise<T> {
  const execute = async (): Promise<T> => {
    const session = getNeo4jDriver().session({
      defaultAccessMode: mode === "READ" ? neo4j.session.READ : neo4j.session.WRITE,
    })

    try {
      return await fn(session)
    } finally {
      await session.close()
    }
  }

  try {
    return await execute()
  } catch (error) {
    if ((isRoutingDiscoveryError(error) || isDatabaseNotFoundError(error)) && switchToDirectDriver()) {
      return execute()
    }
    throw error
  }
}

export function runRead<T>(fn: (session: Session) => Promise<T>): Promise<T> {
  return withSession("READ", fn)
}

export function runWrite<T>(fn: (session: Session) => Promise<T>): Promise<T> {
  return withSession("WRITE", fn)
}
