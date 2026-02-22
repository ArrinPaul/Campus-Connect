import type { Metadata } from "next"
import { SignUp } from "@clerk/nextjs"
import { GraduationCap } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign Up — Campus Connect",
  description: "Create your Campus Connect account to start connecting with academic peers.",
}

// Revalidate the server-rendered shell every hour
export const revalidate = 3600

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-ink-grid opacity-25" />
      <div className="absolute top-1/3 right-1/4 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-[12%] h-[320px] w-[320px] rounded-full bg-accent-rose/10 blur-3xl -z-10" />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl brand-gradient shadow-glow-sm">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Join Campus Connect</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your account to start connecting with peers
          </p>
        </div>
        <SignUp
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
