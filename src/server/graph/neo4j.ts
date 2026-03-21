import "server-only"

import neo4j, { Driver, Session } from "neo4j-driver"

let driver: Driver | null = null

function getNeo4jEnv() {
  const uri = (process.env.NEO4J_URI || "").trim()
  const username = (process.env.NEO4J_USERNAME || process.env.NEO4J_USER || "").trim()
  const password = (process.env.NEO4J_PASSWORD || process.env.NEO4J_PASS || "").trim()
  const database = process.env.NEO4J_DATABASE?.trim() || undefined

  if (!uri || !username || !password) {
    throw new Error(
      "Neo4j environment variables are not configured. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD."
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
  if (driver) return driver

  const { uri, username, password } = getNeo4jEnv()
  driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    maxConnectionLifetime: 60 * 60 * 1000,
    maxConnectionPoolSize: 50,
  })
  return driver
}

async function withSession<T>(mode: "READ" | "WRITE", fn: (session: Session) => Promise<T>): Promise<T> {
  const { database } = getNeo4jEnv()

  const sessionOptions: any = {
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
        "Database authentication failed. Verify NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in .env.local."
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
