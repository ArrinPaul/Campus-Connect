import type { Metadata, Viewport } from "next"
import { Fraunces, Sora } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ConvexClientProvider } from "@/components/providers/convex-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { PostHogProvider } from "@/components/providers/posthog-provider"
import { PostHogPageView } from "@/components/analytics/posthog-pageview"
import { LiveRegionProvider } from "@/components/accessibility/LiveRegion"
import { SkipLink } from "@/components/accessibility/SkipLink"
import { Toaster } from "sonner"
import "./globals.css"

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora",
  weight: ["300", "400", "500", "600", "700"],
})

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: {
    default: "Campus Connect",
    template: "%s | Campus Connect",
  },
  description:
    "The all-in-one academic platform for students and researchers. Connect, collaborate, and accelerate your academic journey.",
  keywords: [
    "campus",
    "connect",
    "academic",
    "collaboration",
    "research",
    "students",
  ],
  authors: [{ name: "Campus Connect" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Campus Connect",
    title: "Campus Connect — Academic Collaboration Platform",
    description:
      "Connect with peers, collaborate on research, and accelerate your academic career.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Connect",
    description:
      "The all-in-one academic platform for students and researchers.",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1117" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#F45D48",
          colorBackground: "hsl(26 25% 97%)",
          colorText: "hsl(228 18% 12%)",
          colorInputBackground: "hsl(0 0% 100%)",
          colorInputText: "hsl(228 18% 12%)",
          borderRadius: "0.625rem",
          fontFamily: "'Sora', sans-serif",
        },
        elements: {
          formButtonPrimary:
            "bg-[#0A84FF] text-white font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] hover:brightness-110",
          card: "shadow-elevation-2 border border-border rounded-xl",
          headerTitle: "text-xl font-semibold tracking-tight",
          headerSubtitle: "text-muted-foreground text-sm",
          socialButtonsBlockButton:
            "border border-border hover:bg-accent transition-colors duration-150 rounded-lg",
          formFieldLabel: "text-foreground font-medium text-sm",
          footerActionLink: "text-primary hover:text-primary/80",
          internal: "font-sans",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning className={`${sora.variable} ${fraunces.variable}`}>
        <body className="font-sans antialiased">
          {/* Skip link — must be the absolute first focusable element */}
          <SkipLink />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <PostHogProvider>
                <LiveRegionProvider>
                  <PostHogPageView />
                  {children}
                </LiveRegionProvider>
              </PostHogProvider>
            </ConvexClientProvider>
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
          <Toaster richColors position="bottom-right" closeButton />
        </body>
      </html>
    </ClerkProvider>
  )
}
