import "server-only"

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto"
import { promisify } from "util"

const scrypt = promisify(scryptCb)

const KEYLEN = 64
const SALT_BYTES = 16

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex")
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer
  return `${salt}:${derived.toString("hex")}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, expectedHex] = storedHash.split(":")
  if (!salt || !expectedHex) return false

  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer
  const expected = Buffer.from(expectedHex, "hex")

  if (expected.length !== derived.length) return false
  return timingSafeEqual(expected, derived)
}
