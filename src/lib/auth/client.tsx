"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, User, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

    void fetch(`${apiUrl}/api/auth/session`, { credentials: "include", cache: "no-store" })
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
  return {
    signOut: async (options) => {
      await fetch(`${apiUrl}/api/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      }).catch(() => null)
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
      className="btn-press flex h-10 w-10 items-center justify-center rounded-full bg-canvas-parchment text-ink text-sm font-semibold border border-hairline shadow-sm"
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    try {
      const response = await fetch(`${apiUrl}/api/auth/sign-in`, {
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
      router.push("/feed")
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-xl animate-in">
      <div className="text-center space-y-2">
        <h1 className="text-display-md font-bold text-ink">Sign in to Campus Connect.</h1>
        <p className="text-body text-ink-muted-48">Enter your details to continue.</p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-md">
        <div className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted-48 group-focus-within:text-primary transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-11 pr-4 h-12 rounded-sm border border-hairline bg-canvas text-body focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
              required
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted-48 group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-11 pr-4 h-12 rounded-sm border border-hairline bg-canvas text-body focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
              required
            />
          </div>
        </div>

        {error && <p className="text-caption font-semibold text-destructive text-center bg-destructive/5 py-2 rounded-sm border border-destructive/10">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="lg"
          className="w-full h-12"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Sign In"}
        </Button>
      </form>

      <div className="text-center pt-md border-t border-hairline">
        <p className="text-caption text-ink-muted-48">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary font-semibold hover:underline">
            Create one for free
          </Link>
        </p>
      </div>
    </div>
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    try {
      const response = await fetch(`${apiUrl}/api/auth/sign-up`, {
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
      router.push("/onboarding")
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-xl animate-in">
      <div className="text-center space-y-2">
        <h1 className="text-display-md font-bold text-ink">Create your account.</h1>
        <p className="text-body text-ink-muted-48">Join the academic revolution today.</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-md">
        <div className="space-y-4">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted-48 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full pl-11 pr-4 h-12 rounded-sm border border-hairline bg-canvas text-body focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
              required
            />
          </div>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted-48 group-focus-within:text-primary transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-11 pr-4 h-12 rounded-sm border border-hairline bg-canvas text-body focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
              required
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted-48 group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 chars)"
              className="w-full pl-11 pr-4 h-12 rounded-sm border border-hairline bg-canvas text-body focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
              required
            />
          </div>
        </div>

        {error && <p className="text-caption font-semibold text-destructive text-center bg-destructive/5 py-2 rounded-sm border border-destructive/10">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="lg"
          className="w-full h-12"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Create Account"}
        </Button>
      </form>

      <div className="text-center pt-md border-t border-hairline">
        <p className="text-caption text-ink-muted-48">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary font-semibold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}

export async function currentUser() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
  const payload = await fetch(`${apiUrl}/api/auth/session`, { credentials: "include", cache: "no-store" })
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
