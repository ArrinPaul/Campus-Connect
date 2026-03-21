"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type NullableUser = {
  id: string
  fullName?: string
  imageUrl?: string
  emailAddresses?: Array<{ emailAddress: string }>
} | null

function getDevUserId(): string | null {
  if (process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH_SHIM !== "true") return null
  const value = process.env.NEXT_PUBLIC_DEV_USER_ID
  return value && value.trim().length > 0 ? value.trim() : null
}

function useSessionUserId() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    void fetch("/api/auth/session", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { userId: null }))
      .then((payload) => {
        if (!mounted) return
        const id = typeof payload?.userId === "string" ? payload.userId : null
        setUserId(id || getDevUserId())
      })
      .catch(() => {
        if (!mounted) return
        setUserId(getDevUserId())
      })
      .finally(() => {
        if (mounted) setIsLoaded(true)
      })

    return () => {
      mounted = false
    }
  }, [])

  return { isLoaded, userId }
}

export function useUser(): {
  isLoaded: boolean
  isSignedIn: boolean
  user: NullableUser
} {
  const { isLoaded, userId } = useSessionUserId()
  return {
    isLoaded,
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
  const { isLoaded, userId } = useSessionUserId()
  return {
    isLoaded,
    isSignedIn: Boolean(userId),
    userId,
    getToken: async () => null,
  }
}

export function useAuthActions(): { signOut: (options?: { redirectUrl?: string }) => Promise<void> } {
  const router = useRouter()
  return {
    signOut: async (options) => {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      }).catch(() => null)
      document.cookie = "cc_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      router.push(options?.redirectUrl || "/sign-in")
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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim() || !password) {
      setError("Email and password are required")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(typeof payload?.error === "string" ? payload.error : "Unable to sign in")
        return
      }

      await fetch("/api/users/me", { credentials: "include" }).catch(() => null)
      router.push("/feed")
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4 w-full">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 border rounded-md bg-background"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-3 py-2 border rounded-md bg-background"
          required
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
      >
        {isSubmitting ? "Signing In..." : "Sign In"}
      </button>
    </form>
  )
}

export function SignUp(_props: Record<string, unknown>) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim() || !password) {
      setError("Email and password are required")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(typeof payload?.error === "string" ? payload.error : "Unable to sign up")
        return
      }

      await fetch("/api/users/me", { credentials: "include" }).catch(() => null)
      router.push("/onboarding")
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4 w-full">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 border rounded-md bg-background"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 8 characters"
          className="w-full px-3 py-2 border rounded-md bg-background"
          required
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
      >
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </button>
    </form>
  )
}

export async function currentUser() {
  const payload = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" })
    .then((res) => (res.ok ? res.json() : { userId: null }))
    .catch(() => ({ userId: null }))
  const userId = typeof payload?.userId === "string" ? payload.userId : getDevUserId()
  if (!userId) return null
  return {
    id: userId,
    fullName: "Local User",
    imageUrl: "/favicon.ico",
  }
}

export async function auth() {
  const payload = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" })
    .then((res) => (res.ok ? res.json() : { userId: null }))
    .catch(() => ({ userId: null }))
  const userId = typeof payload?.userId === "string" ? payload.userId : getDevUserId()
  return { userId }
}
