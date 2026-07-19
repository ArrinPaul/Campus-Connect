import type { Metadata } from"next"
import { SignUp } from"@/lib/auth/client"

export const metadata: Metadata = {
 title:"Sign Up — Campus Connect",
 description:"Create your Campus Connect account to start connecting with academic peers.",
}

export const dynamic ="force-dynamic"

export default function SignUpPage() {
 return <SignUp />
}
