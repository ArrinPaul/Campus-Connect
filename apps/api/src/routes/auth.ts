import { Router, Request, Response } from "express"
import bcryptjs from "bcryptjs"
import { createSessionToken, getSessionCookieName, getSessionTtlSeconds, verifySessionToken } from "../lib/session.js"
import { findUserByEmail, createUser } from "../db/users.js"

const router = Router()

router.post("/sign-up", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: "Invalid email or password (min 8 chars)" })
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return res.status(409).json({ error: "Email already registered" })
    }

    const hashedPassword = await bcryptjs.hash(password, 10)
    const user = await createUser({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name || "User",
    })

    const token = createSessionToken(user.authId)
    res.cookie(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: getSessionTtlSeconds() * 1000,
    })

    res.json({ ok: true, user: { id: user.authId, email: user.email, name: user.name } })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign up failed"
    res.status(500).json({ error: message })
  }
})

router.post("/sign-in", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" })
    }

    const user = await findUserByEmail(email.toLowerCase().trim())
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const validPassword = await bcryptjs.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = createSessionToken(user.authId)
    res.cookie(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: getSessionTtlSeconds() * 1000,
    })

    res.json({ ok: true, user: { id: user.authId, email: user.email, name: user.name } })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in failed"
    res.status(500).json({ error: message })
  }
})

router.get("/session", (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[getSessionCookieName()]
    if (!token) {
      return res.json({ userId: null })
    }

    const verified = verifySessionToken(token)
    if (!verified) {
      return res.json({ userId: null })
    }

    res.json({ userId: verified.userId })
  } catch (err) {
    res.json({ userId: null })
  }
})

router.post("/sign-out", (req: Request, res: Response) => {
  res.clearCookie(getSessionCookieName())
  res.json({ ok: true })
})

export default router
