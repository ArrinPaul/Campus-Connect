import type { Metadata, Viewport } from "next";
import { Syne, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { PostHogPageView } from "@/components/analytics/posthog-pageview";
import { LiveRegionProvider } from "@/components/accessibility/LiveRegion";
import { SkipLink } from "@/components/accessibility/SkipLink";
import { Toaster } from "sonner";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["700", "800"],
});

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
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F2ED" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1918" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#4340C2",
          colorBackground: "hsl(var(--card))",
          colorText: "hsl(var(--foreground))",
          colorInputBackground: "hsl(var(--background))",
          colorInputText: "hsl(var(--foreground))",
          colorDanger: "#ef4444",
          colorSuccess: "#22c55e",
          colorWarning: "#f59e0b",
          borderRadius: "0.5rem",
          fontFamily: "'Manrope', sans-serif",
          fontSize: "0.9375rem",
        },
        elements: {
          // Form and card styling
          card: "shadow-xl border border-border/50 rounded-xl bg-card",
          footer: "border-t border-border/30",
          
          // Header styling
          headerTitle: "font-display text-3xl font-bold text-foreground",
          headerSubtitle: "text-muted-foreground text-base",
          
          // Form elements
          formFieldInput: "border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary rounded-lg",
          formFieldLabel: "text-foreground font-medium text-sm",
          
          // Buttons
          formButtonPrimary: "bg-primary text-primary-foreground font-semibold shadow-md transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] rounded-lg",
          formButtonSecondary: "border border-border/50 bg-background text-foreground hover:bg-accent transition-colors rounded-lg",
          
          // Social button styling
          socialButtonsBlockButton: "border border-border/50 bg-background text-foreground hover:bg-accent/50 transition-colors rounded-lg font-medium",
          
          // Links
          formLink: "text-primary hover:text-primary/80 underline",
          
          // Divider
          dividerLine: "bg-border/30",
          dividerText: "text-muted-foreground text-sm",
          
          // Other text
          formFieldSuccessText: "text-green-600",
          formFieldErrorText: "text-red-600",
          
          // Alternate methods button
          alternativeMethodsBlockButton: "border border-border/50 text-foreground hover:bg-accent/50 rounded-lg",
          
          // Loading spinner
          spinner: "text-primary",
        },
        layout: {
          socialButtonsVariant: "blockButton",
          // @ts-expect-error -- Clerk types don't include termsPageContent but it's valid
          termsPageContent: "text-foreground",
        },
      }}
    >
      <html
        lang="en"
        suppressHydrationWarning
        className={`${manrope.variable} ${syne.variable}`}
      >
        <body className="font-sans antialiased">
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
  );
}
