import http from "node:http"
import { randomUUID, createHmac } from "node:crypto"
import neo4j from "neo4j-driver"

const PORT = Number(process.env.API_PORT || 4000)
const HOST = process.env.API_HOST || "0.0.0.0"
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000"

function requiredEnv(name, fallback) {
  const value = (process.env[name] || fallback || "").trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const NEO4J_URI = requiredEnv("NEO4J_URI")
const NEO4J_USERNAME = requiredEnv("NEO4J_USERNAME", process.env.NEO4J_USER)
const NEO4J_PASSWORD = requiredEnv("NEO4J_PASSWORD", process.env.NEO4J_PASS)
const NEO4J_DATABASE = (process.env.NEO4J_DATABASE || "neo4j").trim()
const AUTH_SECRET = requiredEnv("AUTH_SECRET")

let neo4jDriver = null
let initPromise = null

function base64UrlDecode(input) {
  return Buffer.from(input, "base64url").toString("utf8")
}

function sign(payload) {
  return createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url")
}

function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null
  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) return null
  if (signature !== sign(encoded)) return null

  try {
    const payload = JSON.parse(base64UrlDecode(encoded))
    if (!payload?.sub || !payload?.exp) return null
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null
    return { userId: payload.sub }
  } catch {
    return null
  }
}

function parseCookies(cookieHeader) {
  const out = {}
  if (!cookieHeader) return out

  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=")
    if (index < 0) continue
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (key) out[key] = decodeURIComponent(value)
  }

  return out
}

function getAuthUserId(req) {
  const cookies = parseCookies(req.headers.cookie)
  const token = cookies.cc_session
  return verifySessionToken(token)?.userId || null
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN)
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
}

function json(res, statusCode, payload) {
  setCorsHeaders(res)
  res.statusCode = statusCode
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ""
    req.on("data", (chunk) => {
      raw += chunk
      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large"))
      }
    })
    req.on("end", () => {
      if (!raw) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error("Invalid JSON body"))
      }
    })
    req.on("error", reject)
  })
}

function getDriver() {
  if (neo4jDriver) return neo4jDriver

  neo4jDriver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD),
    {
      maxConnectionLifetime: 60 * 60 * 1000,
      maxConnectionPoolSize: 50,
    }
  )

  return neo4jDriver
}

async function initializeNeo4j() {
  if (initPromise) return initPromise
  initPromise = getDriver().verifyConnectivity().then(() => undefined)
  return initPromise
}

async function completeOnboarding(authId, data) {
  await initializeNeo4j()

  const session = getDriver().session({
    defaultAccessMode: neo4j.session.WRITE,
    database: NEO4J_DATABASE,
  })

  try {
    const now = Date.now()
    const result = await session.run(
      `MERGE (u:User {authId: $authId})
       ON CREATE SET
           u.id = $id,
           u.createdAt = $now,
           u.name = CASE WHEN $username <> '' THEN $username ELSE 'User' END,
           u.email = ''
       SET u.username = $username,
           u.bio = $bio,
           u.university = $university,
           u.role = $role,
           u.experienceLevel = $experienceLevel,
           u.skills = $skills,
           u.onboardingCompleted = true,
           u.updatedAt = $now
       RETURN u`,
      {
        authId,
        id: randomUUID(),
        now,
        username: data.username,
        bio: data.bio,
        university: data.university,
        role: data.role,
        experienceLevel: data.experienceLevel,
        skills: data.skills,
      }
    )

    const node = result.records[0]?.get("u")
    if (!node) {
      throw new Error("Failed to complete onboarding")
    }

    return node.properties
  } finally {
    await session.close()
  }
}

function sanitizeOnboardingPayload(body) {
  return {
    username: typeof body?.username === "string" ? body.username : "",
    bio: typeof body?.bio === "string" ? body.bio : "",
    university: typeof body?.university === "string" ? body.university : "",
    role: typeof body?.role === "string" ? body.role : "Student",
    experienceLevel: typeof body?.experienceLevel === "string" ? body.experienceLevel : "Beginner",
    skills: Array.isArray(body?.skills)
      ? body.skills.filter((skill) => typeof skill === "string")
      : [],
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      setCorsHeaders(res)
      res.statusCode = 204
      res.end()
      return
    }

    if (req.url === "/health" && req.method === "GET") {
      json(res, 200, { ok: true })
      return
    }

    if (req.url === "/api/auth/session" && req.method === "GET") {
      const userId = getAuthUserId(req)
      json(res, 200, { userId })
      return
    }

    if (req.url === "/api/users/onboarding" && req.method === "POST") {
      const userId = getAuthUserId(req)
      if (!userId) {
        json(res, 401, { error: "Unauthorized" })
        return
      }

      const body = await readJsonBody(req)
      const payload = sanitizeOnboardingPayload(body)
      const user = await completeOnboarding(userId, payload)
      json(res, 200, user)
      return
    }

    json(res, 404, { error: "Not Found" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error"
    json(res, 500, { error: message })
  }
})

initializeNeo4j()
  .then(() => {
    console.log("[api] Neo4j connectivity verified")
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[api] Neo4j initialization failed:", message)
  })

server.listen(PORT, HOST, () => {
  console.log(`[api] listening on http://${HOST}:${PORT}`)
})
