import "dotenv/config.js"
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { initializeNeo4j, closeNeo4jDriver } from "./db/neo4j.js"
import authRoutes from "./routes/auth.js"
import usersRoutes from "./routes/users.js"

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({ 
  origin: process.env.FRONTEND_URL || "http://localhost:3000", 
  credentials: true 
}))
app.use(express.json())
app.use(cookieParser())

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", usersRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", neo4j: "connected" })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[API] Error:", err)
  res.status(err.status || 500).json({ error: err.message || "Internal server error" })
})

// Initialize DB and start server
async function start() {
  try {
    console.log("[API] Initializing Neo4j connection...")
    await initializeNeo4j()
    console.log("[API] Neo4j connected successfully")

    app.listen(PORT, () => {
      console.log(`[API] Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error("[API] Failed to start:", error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("[API] Shutting down...")
  await closeNeo4jDriver()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  console.log("[API] Shutting down...")
  await closeNeo4jDriver()
  process.exit(0)
})

start()
