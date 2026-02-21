import type { Metadata, Viewport } from "next"
import { DM_Sans, Bricolage_Grotesque } from "next/font/google"
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

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
})

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
  weight: ["400", "500", "600", "700", "800"],
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
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
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
          colorPrimary: "#DD2A7B",
          colorBackground: "hsl(0 0% 100%)",
          colorText: "hsl(220 25% 10%)",
          colorInputBackground: "hsl(0 0% 100%)",
          colorInputText: "hsl(220 25% 10%)",
          borderRadius: "0.75rem",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        },
        elements: {
          formButtonPrimary:
            "bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#515BD4] text-white font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] hover:opacity-90",
          card: "shadow-elevation-2 border border-border rounded-2xl",
          headerTitle: "text-xl font-semibold tracking-tight",
          headerSubtitle: "text-muted-foreground text-sm",
          socialButtonsBlockButton:
            "border border-border hover:bg-accent transition-colors duration-150 rounded-xl",
          formFieldLabel: "text-foreground font-medium text-sm",
          footerActionLink: "text-primary hover:text-primary/80",
          internal: "font-sans",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${bricolage.variable}`}>
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
