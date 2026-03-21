import type { Metadata, Viewport } from "next";
import { Syne, Manrope } from "next/font/google";

import { AppQueryProvider } from "@/components/providers/query-provider";
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
            <AppQueryProvider>
              <PostHogProvider>
                <LiveRegionProvider>
                  <PostHogPageView />
                  {children}
                </LiveRegionProvider>
              </PostHogProvider>
            </AppQueryProvider>
          </ThemeProvider>

          <Toaster richColors position="bottom-right" closeButton />
        </body>
      </html>
  );
}
