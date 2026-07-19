import type { Metadata } from"next"
import { SignIn } from"@/lib/auth/client"

export const metadata: Metadata = {
 title:"Sign In — Campus Connect",
 description:"Sign in to Campus Connect to collaborate with peers and advance your academic career.",
}

export const dynamic ="force-dynamic"

export default function SignInPage() {
 return <SignIn />
}
