import type { ReactNode } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"

type NullableUser = {
  id: string
  fullName?: string
  imageUrl?: string
  emailAddresses?: Array<{ emailAddress: string }>
} | null

function getDevUserId(): string | null {
  if (typeof window !== "undefined") {
    const match = document.cookie.match(/(?:^|; )cc_user_id=([^;]*)/)
    if (match) return decodeURIComponent(match[1])
  }
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
          fullName: "Local User",
          imageUrl: "/favicon.ico",
          emailAddresses: [{ emailAddress: "user@example.com" }],
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

export function useAuthActions(): { signOut: () => Promise<void> } {
  const router = useRouter()
  return {
    signOut: async () => {
      document.cookie = "cc_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      router.push("/sign-in")
      router.refresh()
    },
  }
}

export function AuthProvider({ children }: { children: ReactNode; [key: string]: unknown }) {
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
  const { user } = useUser()
  const { signOut } = useAuthActions()
  if (!user) return null
  
  return (
    <button 
      onClick={() => signOut()}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium"
      title="Sign Out"
    >
      {user.id.substring(0, 2).toUpperCase()}
    </button>
  )
}

export function SignIn(_props: Record<string, unknown>) {
  const [uid, setUid] = useState("")
  const router = useRouter()

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid.trim()) return
    document.cookie = `cc_user_id=${encodeURIComponent(uid.trim())}; path=/; max-age=31536000`
    router.push("/feed")
    router.refresh()
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4 w-full">
      <div className="space-y-2">
        <label className="text-sm font-medium">User ID</label>
        <input
          type="text"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="Enter any user ID (e.g. user_123)"
          className="w-full px-3 py-2 border rounded-md bg-background"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
      >
        Sign In
      </button>
    </form>
  )
}

export function SignUp(_props: Record<string, unknown>) {
  const [uid, setUid] = useState("")
  const router = useRouter()

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid.trim()) return
    document.cookie = `cc_user_id=${encodeURIComponent(uid.trim())}; path=/; max-age=31536000`
    router.push("/onboarding")
    router.refresh()
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4 w-full">
      <div className="space-y-2">
        <label className="text-sm font-medium">Desired User ID</label>
        <input
          type="text"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="e.g. student_hero"
          className="w-full px-3 py-2 border rounded-md bg-background"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
      >
        Create Account
      </button>
    </form>
  )
}

export async function currentUser() {
  const userId = getDevUserId()
  if (!userId) return null
  return {
    id: userId,
    fullName: "Local User",
    imageUrl: "/favicon.ico",
  }
}

export async function auth() {
  const userId = getDevUserId()
  return { userId }
}
