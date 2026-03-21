import { runWrite, runRead, toPlain } from "./neo4j.js"
import { randomUUID } from "crypto"

export interface User {
  authId: string
  id: string
  email: string
  name: string
  password?: string
  username?: string
  bio?: string
  university?: string
  role?: string
  profilePicture?: string
  skills?: string[]
  onboardingCompleted?: boolean
  createdAt: number
  updatedAt: number
}

export async function createUser(data: {
  email: string
  password: string
  name: string
}): Promise<User> {
  return runWrite(async (session) => {
    const authId = randomUUID()
    const now = Date.now()
    
    const result = await session.run(
      `CREATE (u:User {
        authId: $authId,
        id: $id,
        email: $email,
        name: $name,
        password: $password,
        createdAt: $now,
        updatedAt: $now,
        onboardingCompleted: false
       })
       RETURN u`,
      { authId, id: randomUUID(), email: data.email, name: data.name, password: data.password, now }
    )

    const record = result.records[0]
    if (!record) {
      throw new Error("Failed to create user")
    }

    return toPlain(record.get("u").properties) as unknown as User
  })
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {email: $email}) RETURN u`,
      { email: email.toLowerCase().trim() }
    )
    
    if (result.records.length === 0) return null
    return toPlain(result.records[0].get("u").properties) as unknown as User
  })
}

export async function getUserByAuthId(authId: string): Promise<User | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {authId: $authId}) RETURN u`,
      { authId }
    )
    if (result.records.length === 0) return null
    return toPlain(result.records[0].get("u").properties) as unknown as User
  })
}

export async function completeOnboarding(
  authId: string,
  data: {
    username: string
    bio: string
    university: string
    role: string
    skills: string[]
  }
): Promise<User> {
  return runWrite(async (session) => {
    const now = Date.now()
    const result = await session.run(
      `MATCH (u:User {authId: $authId})
       SET u.username = $username,
           u.bio = $bio,
           u.university = $university,
           u.role = $role,
           u.skills = $skills,
           u.onboardingCompleted = true,
           u.updatedAt = $now
       RETURN u`,
      { authId, ...data, now }
    )

    const record = result.records[0]
    if (!record) {
      throw new Error("Failed to complete onboarding")
    }

    return toPlain(record.get("u").properties) as unknown as User
  })
}

export async function getDbUser(authId: string): Promise<User | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {authId: $authId}) RETURN u`,
      { authId }
    )
    if (result.records.length === 0) return null
    const user = toPlain(result.records[0].get("u").properties) as unknown as User
    delete user.password
    return user
  })
}
