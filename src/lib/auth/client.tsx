"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

// ─── Types ──────────────────────────────────────────────────────────────────

type AppUser = {
  id: string
  email: string
  name: string
  profilePicture?: string
} | null

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useUser(): {
  isLoaded: boolean
  isSignedIn: boolean
  user: AppUser
} {
  const [isLoaded, setIsLoaded] = useState(false)
  const [user, setUser] = useState<AppUser>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email ?? "",
          name: authUser.user_metadata?.name ?? authUser.email?.split("@")[0] ?? "User",
          profilePicture: authUser.user_metadata?.avatar_url,
        })
      }
      setIsLoaded(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.user_metadata?.name ?? session.user.email?.split("@")[0] ?? "User",
          profilePicture: session.user.user_metadata?.avatar_url,
        })
      } else {
        setUser(null)
      }
      setIsLoaded(true)
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    isLoaded,
    isSignedIn: Boolean(user),
    user,
  }
}

export function useAuth(): {
  isLoaded: boolean
  isSignedIn: boolean
  userId: string | null
  getToken: () => Promise<string | null>
} {
  const { isLoaded, isSignedIn, user } = useUser()
  const supabase = createClient()

  return {
    isLoaded,
    isSignedIn,
    userId: user?.id ?? null,
    getToken: async () => {
      const { data } = await supabase.auth.getSession()
      return data.session?.access_token ?? null
    },
  }
}

export function useAuthActions(): {
  signOut: (options?: { redirectUrl?: string }) => Promise<void>
} {
  const router = useRouter()
  const supabase = createClient()

  return {
    signOut: async (options) => {
      await supabase.auth.signOut()
      router.push(options?.redirectUrl || "/sign-in")
      router.refresh()
    },
  }
}

// ─── Components ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
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
      className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-ink-deep text-sm font-bold border border-hairline hover:bg-hairline-soft transition-colors"
      title="Sign Out"
    >
      {user.name.substring(0, 2).toUpperCase()}
    </button>
  )
}

// ─── Sign In Form ───────────────────────────────────────────────────────────

export function SignIn(_props: Record<string, unknown>) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email.trim() || !password) {
      setError("Email and password are required")
      return
    }
    setIsSubmitting(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) {
        setError(authError.message)
        return
      }
      router.push("/feed")
      router.refresh()
    } catch {
      setError("Unable to sign in")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-ink-deep">Sign in to Campus Connect</h1>
        <p className="text-body-sm text-steel">Enter your details to continue</p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-3">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-steel group-focus-within:text-primary transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-11 pr-4 h-11 rounded-lg border border-hairline bg-canvas text-body-md focus:outline-none focus:ring-2 focus:ring-fb-blue focus:border-transparent transition-all"
              required
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-steel group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-11 pr-4 h-11 rounded-lg border border-hairline bg-canvas text-body-md focus:outline-none focus:ring-2 focus:ring-fb-blue focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-body-sm font-semibold text-critical text-center bg-critical/5 py-2 rounded-lg border border-critical/10">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="lg"
          className="w-full h-11"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Sign In"}
        </Button>
      </form>

      <div className="text-center pt-4 border-t border-hairline-soft">
        <p className="text-body-sm text-steel">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary font-bold hover:underline">
            Create one for free
          </Link>
        </p>
      </div>
    </div>
  )
}

// ─── Sign Up Form ───────────────────────────────────────────────────────────

export function SignUp(_props: Record<string, unknown>) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() || "User" },
        },
      })
      if (authError) {
        setError(authError.message)
        return
      }
      router.push("/onboarding")
      router.refresh()
    } catch {
      setError("Unable to sign up")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-ink-deep">Create your account</h1>
        <p className="text-body-sm text-steel">Join the academic community today</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-3">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-steel group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full pl-11 pr-4 h-11 rounded-lg border border-hairline bg-canvas text-body-md focus:outline-none focus:ring-2 focus:ring-fb-blue focus:border-transparent transition-all"
              required
            />
          </div>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-steel group-focus-within:text-primary transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-11 pr-4 h-11 rounded-lg border border-hairline bg-canvas text-body-md focus:outline-none focus:ring-2 focus:ring-fb-blue focus:border-transparent transition-all"
              required
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-steel group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 chars)"
              className="w-full pl-11 pr-4 h-11 rounded-lg border border-hairline bg-canvas text-body-md focus:outline-none focus:ring-2 focus:ring-fb-blue focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-body-sm font-semibold text-critical text-center bg-critical/5 py-2 rounded-lg border border-critical/10">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="lg"
          className="w-full h-11"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Create Account"}
        </Button>
      </form>

      <div className="text-center pt-4 border-t border-hairline-soft">
        <p className="text-body-sm text-steel">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary font-bold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}

// ─── Server-side Auth Helpers ───────────────────────────────────────────────

export async function currentUser() {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return {
    id: user.id,
    name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
    email: user.email ?? "",
    profilePicture: user.user_metadata?.avatar_url,
  }
}

export async function auth() {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { userId: user?.id ?? null }
}
