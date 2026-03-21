import type { ReactNode } from "react"

type NullableUser = {
  id: string
  fullName?: string
  imageUrl?: string
  emailAddresses?: Array<{ emailAddress: string }>
} | null

function getDevUserId(): string | null {
  const value = process.env.NEXT_PUBLIC_DEV_USER_ID
  return value && value.trim().length > 0 ? value.trim() : null
}

export function useUser(): {
  isLoaded: boolean
  isSignedIn: boolean
  user: NullableUser
} {
  const userId = getDevUserId()
  return {
    isLoaded: true,
    isSignedIn: Boolean(userId),
    user: userId
      ? {
          id: userId,
          fullName: "Local Dev User",
          imageUrl: "/favicon.ico",
          emailAddresses: [{ emailAddress: "local@example.com" }],
        }
      : null,
  }
}

export function useAuth(): {
  isLoaded: boolean
  isSignedIn: boolean
  userId: string | null
  getToken: () => Promise<string | null>
} {
  const userId = getDevUserId()
  return {
    isLoaded: true,
    isSignedIn: Boolean(userId),
    userId,
    getToken: async () => null,
  }
}

export function useClerk(): { signOut: () => Promise<void> } {
  return {
    signOut: async () => {
      return
    },
  }
}

export function ClerkProvider({ children }: { children: ReactNode; [key: string]: unknown }) {
  return children
}

export function SignedIn({ children }: { children: ReactNode }) {
  const { isSignedIn } = useUser()
  return isSignedIn ? children : null
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { isSignedIn } = useUser()
  return isSignedIn ? null : children
}

export function UserButton(_props: Record<string, unknown>) {
  return null
}

export function SignIn(_props: Record<string, unknown>) {
  return null
}

export function SignUp(_props: Record<string, unknown>) {
  return null
}

export async function currentUser() {
  const { user } = useUser()
  return user
}

export async function auth() {
  const { userId } = useAuth()
  return { userId }
}
