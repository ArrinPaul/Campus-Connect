import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ConvexClientProvider } from "@/components/providers/convex-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
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
          colorPrimary: "hsl(239 84% 67%)",
          colorBackground: "hsl(0 0% 100%)",
          colorText: "hsl(224 71% 4%)",
          colorInputBackground: "hsl(0 0% 100%)",
          colorInputText: "hsl(224 71% 4%)",
          borderRadius: "0.625rem",
          fontFamily: "Inter, system-ui, sans-serif",
        },
        elements: {
          formButtonPrimary:
            "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 active:scale-[0.98]",
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
      <html lang="en" suppressHydrationWarning className={inter.variable}>
        <body className="font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
