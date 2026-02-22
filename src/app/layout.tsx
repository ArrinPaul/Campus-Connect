import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
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

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
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
    { media: "(prefers-color-scheme: light)", color: "#05050A" },
    { media: "(prefers-color-scheme: dark)", color: "#05050A" },
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
        baseTheme: dark,
        variables: {
          colorPrimary: "#CCFF00",
          colorBackground: "#05050A",
          colorText: "#E0E0E0",
          colorInputBackground: "#1A1A1E",
          colorInputText: "#E0E0E0",
          borderRadius: "0.25rem",
          fontFamily: "'Outfit', sans-serif",
        },
        elements: {
          formButtonPrimary:
            "bg-primary text-[#05050A] font-bold tracking-wide uppercase transition-all duration-200 hover:bg-white active:scale-[0.98]",
          card: "bg-[#0A0A0F] border border-[#222] shadow-none rounded-md",
          headerTitle:
            "font-display text-2xl font-bold tracking-wider text-primary",
          headerSubtitle: "text-muted-foreground text-sm font-sans",
          socialButtonsBlockButton:
            "border border-[#222] hover:bg-[#111] transition-colors duration-150 rounded-md",
          formFieldLabel: "text-foreground font-medium text-sm font-sans",
          footerActionLink: "text-primary hover:text-primary/80",
          internal: "font-sans",
        },
      }}
    >
      <html
        lang="en"
        suppressHydrationWarning
        className={`${outfit.variable} ${spaceGrotesk.variable}`}
      >
        <body className="font-sans antialiased">
          {/* Skip link — must be the absolute first focusable element */}
          <SkipLink />
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
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
          <Toaster
            theme="dark"
            richColors
            position="bottom-right"
            closeButton
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
