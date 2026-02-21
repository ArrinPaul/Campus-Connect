import type { Metadata } from "next"
import { SignIn } from "@clerk/nextjs"
import { GraduationCap } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign In — Campus Connect",
  description: "Sign in to Campus Connect to collaborate with peers and advance your academic career.",
}

// Revalidate the server-rendered shell every hour (Clerk widget hydrates client-side)
export const revalidate = 3600

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-dot-pattern opacity-30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl -z-10" />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-glow-sm">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue to Campus Connect
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-elevation-2 border border-border rounded-xl",
            },
          }}
        />
      </div>
    </div>
  )
}
