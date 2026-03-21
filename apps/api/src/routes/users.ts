import { Router, Request, Response } from "express"
import { getSessionCookieName, verifySessionToken } from "../lib/session.js"
import { completeOnboarding, getDbUser } from "../db/users.js"

const router = Router()

export interface AuthRequest extends Request {
  userId?: string
}

// Auth middleware
function requireAuth(req: AuthRequest, res: Response, next: Function) {
  const token = req.cookies?.[getSessionCookieName()]
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const verified = verifySessionToken(token)
  if (!verified) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  req.userId = verified.userId
  next()
}

router.use(requireAuth)

router.post("/onboarding", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const body = req.body as Record<string, unknown>
    const payload = {
      username: typeof body?.username === "string" ? body.username : "",
      bio: typeof body?.bio === "string" ? body.bio : "",
      university: typeof body?.university === "string" ? body.university : "",
      role: typeof body?.role === "string" ? body.role : "Student",
      skills: Array.isArray(body?.skills)
        ? body.skills.filter((skill): skill is string => typeof skill === "string")
        : [],
    }

    const user = await completeOnboarding(userId, payload)
    res.json(user)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to complete onboarding"
    res.status(500).json({ error: message })
  }
})

router.get("/me", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const user = await getDbUser(userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(user)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch user"
    res.status(500).json({ error: message })
  }
})

export default router
