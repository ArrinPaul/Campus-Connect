import "server-only"

import neo4j, { Driver, Session } from "neo4j-driver"

let driver: Driver | null = null

function getNeo4jEnv() {
  const uri = process.env.NEO4J_URI
  const username = process.env.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !username || !password) {
    throw new Error("Neo4j environment variables are not configured. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD.")
  }

  return { uri, username, password }
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
  const db = process.env.NEO4J_DATABASE || "neo4j"
  const session = getNeo4jDriver().session({
    database: db,
    defaultAccessMode: mode === "READ" ? neo4j.session.READ : neo4j.session.WRITE,
  })

  try {
    return await fn(session)
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
