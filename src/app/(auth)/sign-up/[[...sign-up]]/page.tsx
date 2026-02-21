import { SignUp } from "@clerk/nextjs"
import { GraduationCap } from "lucide-react"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-dot-pattern opacity-30" />
      <div className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-3xl -z-10" />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-glow-sm">
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
