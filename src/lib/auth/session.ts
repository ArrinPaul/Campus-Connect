import "server-only"

import { createHmac } from "crypto"

const SESSION_COOKIE = "cc_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

function getSecret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-local-auth-secret"
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input).toString("base64url")
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8")
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url")
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE
}

export function getSessionTtlSeconds(): number {
  return SESSION_TTL_SECONDS
}

export function createSessionToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000)
  const body = JSON.stringify({ sub: userId, iat: now, exp: now + SESSION_TTL_SECONDS })
  const encoded = base64UrlEncode(body)
  const signature = sign(encoded)
  return `${encoded}.${signature}`
}

export function verifySessionToken(token: string): { userId: string } | null {
  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) return null

  const expectedSignature = sign(encoded)
  if (signature !== expectedSignature) return null

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as { sub?: string; exp?: number }
    if (!payload.sub || !payload.exp) return null

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null

    return { userId: payload.sub }
  } catch {
    return null
  }
}
