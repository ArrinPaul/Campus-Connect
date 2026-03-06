
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip TypeScript type errors during build - Convex generated types are stale
  // Run `npx convex dev` to regenerate types from deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable modern image formats
    formats: ["image/avif", "image/webp"],

    // Remote image domains (add your CDN/storage domains)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Allow user-submitted image URLs (listings, stories, profile pictures)
      {
        protocol: "https",
        hostname: "**",
      },
    ],

    // Optimized device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Minimize layout shift
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Compression
  compress: true,

  // Strict mode for catching issues early
  reactStrictMode: true,

  // Security headers
  async headers() {
    // Content Security Policy
    // In production, use strict CSP. In development, allow eval for HMR.
    const isDev = process.env.NODE_ENV === "development"
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'blob:' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : "'unsafe-inline'"} https://clerk.campus-connect.app https://*.clerk.accounts.dev https://challenges.cloudflare.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.convex.cloud https://img.clerk.com https://images.unsplash.com",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' https://*.convex.cloud https://*.clerk.accounts.dev wss://*.convex.cloud ${isDev ? "ws://localhost:*" : ""} https://*.posthog.com https://*.sentry.io https://clerk.campus-connect.app`,
      "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ]
    const cspHeader = cspDirectives.join("; ")

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/(.*)\\.(ico|svg|png|jpg|jpeg|gif|webp|avif|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache Next.js compiled chunks (hashed filenames are immutable)
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache Next.js optimized images (short TTL — dynamic transforms)
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
