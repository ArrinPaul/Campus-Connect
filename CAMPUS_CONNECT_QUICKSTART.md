# Campus Connect - Quick Start Guide

## 🚀 Get Started in 30 Minutes

This guide will help you set up Campus Connect development environment and start building.

---

## Prerequisites

Before you begin, ensure you have:

- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] GitHub account
- [ ] Clerk account (free tier)
- [ ] Convex account (free tier)
- [ ] Vercel account (free tier)

---

## Step 1: Create Next.js Project (5 minutes)

```bash
# Create new Next.js project
npx create-next-app@latest campus-connect

# Options to select:
# ✓ TypeScript: Yes
# ✓ ESLint: Yes
# ✓ Tailwind CSS: Yes
# ✓ src/ directory: Yes
# ✓ App Router: Yes
# ✓ Import alias: Yes (@/*)

# Navigate to project
cd campus-connect

# Open in VS Code
code .
```

---

## Step 2: Install Dependencies (3 minutes)

```bash
# Install shadcn/ui
npx shadcn-ui@latest init

# Install core dependencies
npm install @clerk/nextjs convex @tanstack/react-query zustand

# Install UI dependencies
npm install lucide-react class-variance-authority clsx tailwind-merge

# Install form dependencies
npm install react-hook-form @hookform/resolvers zod

# Install utility dependencies
npm install date-fns

# Install dev dependencies
npm install -D @types/node prettier eslint-config-prettier
```

---

## Step 3: Setup Clerk Authentication (5 minutes)

### 3.1 Create Clerk Application

1. Go to [clerk.com](https://clerk.com)
2. Sign up / Sign in
3. Click "Add application"
4. Name it "Campus Connect"
5. Enable Google, GitHub, LinkedIn providers
6. Copy your API keys

### 3.2 Configure Clerk

```bash
# Create .env.local file
touch .env.local
```

Add to `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/feed
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### 3.3 Add Clerk Provider

Update `src/app/layout.tsx`:
```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### 3.4 Create Middleware

Create `src/middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

---

## Step 4: Setup Convex Backend (7 minutes)

### 4.1 Initialize Convex

```bash
# Install Convex CLI globally
npm install -g convex

# Initialize Convex in your project
npx convex dev
```

This will:
- Create a Convex account (if needed)
- Create a new project
- Generate `convex/` folder
- Add Convex URL to `.env.local`

### 4.2 Create Schema

Create `convex/schema.ts`:
```typescript
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    university: v.optional(v.string()),
    skills: v.array(v.string()),
    role: v.union(
      v.literal("student"),
      v.literal("researcher"),
      v.literal("faculty")
    ),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  posts: defineTable({
    authorId: v.id("users"),
    content: v.string(),
    images: v.optional(v.array(v.string())),
    likes: v.array(v.id("users")),
    commentCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_createdAt", ["createdAt"]),
})
```

### 4.3 Add Convex Provider

Update `src/app/layout.tsx`:
```typescript
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexClientProvider } from '@/components/providers/convex-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

Create `src/components/providers/convex-provider.tsx`:
```typescript
"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import { ReactNode } from "react"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
```

---

## Step 5: Create First Feature (10 minutes)

### 5.1 Create User Sync

Create `src/app/api/webhooks/clerk/route.ts`:
```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { api } from '@/convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local')
  }

  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data

    await convex.mutation(api.users.create, {
      clerkId: id,
      email: email_addresses[0].email_address,
      firstName: first_name || '',
      lastName: last_name || '',
      imageUrl: image_url,
    })
  }

  return new Response('', { status: 200 })
}
```

### 5.2 Create User Mutations

Create `convex/users.ts`:
```typescript
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      ...args,
      bio: "",
      university: "",
      skills: [],
      role: "student",
      createdAt: Date.now(),
    })
    return userId
  },
})

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first()
    return user
  },
})
```

### 5.3 Create Home Page

Update `src/app/page.tsx`:
```typescript
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const { userId } = auth()

  if (userId) {
    redirect("/feed")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">Campus Connect</h1>
        <p className="text-xl mb-8">Connect. Collaborate. Create.</p>
        <div className="flex gap-4 justify-center">
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </div>
    </main>
  )
}
```

### 5.4 Create Feed Page

Create `src/app/feed/page.tsx`:
```typescript
import { UserButton } from "@clerk/nextjs"

export default function FeedPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Feed</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p>Welcome to Campus Connect! 🎉</p>
          <p className="mt-2">Your feed will appear here.</p>
        </div>
      </div>
    </div>
  )
}
```

---

## Step 6: Run Development Server

```bash
# Start Convex dev server (in one terminal)
npx convex dev

# Start Next.js dev server (in another terminal)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 7: Deploy to Vercel (Optional)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## 🎯 What You've Built

✅ Next.js 14 app with TypeScript
✅ Clerk authentication with social logins
✅ Convex real-time database
✅ User sync between Clerk and Convex
✅ Protected routes
✅ Basic home and feed pages

---

## 📚 Next Steps

Now that you have the foundation, follow the detailed roadmap:

1. **Week 1-2**: Complete user profiles and UI components
2. **Week 3**: Build posts and feed system
3. **Week 4**: Add connections and discovery
4. **Week 5+**: Follow the full roadmap

---

## 🛠️ Useful Commands

```bash
# Development
npm run dev              # Start dev server
npx convex dev          # Start Convex dev

# Building
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format with Prettier

# Testing
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
```

---

## 📖 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Convex Documentation](https://docs.convex.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🐛 Troubleshooting

### Clerk not working
- Check API keys in `.env.local`
- Verify middleware configuration
- Check Clerk dashboard for errors

### Convex connection issues
- Run `npx convex dev` first
- Check Convex URL in `.env.local`
- Verify schema is deployed

### Build errors
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`

---

## 💡 Pro Tips

1. **Use TypeScript strictly** - It catches bugs early
2. **Follow the roadmap** - Don't skip steps
3. **Test as you build** - Write tests early
4. **Commit often** - Small, meaningful commits
5. **Ask for help** - Join Discord communities

---

## 🎉 You're Ready!

You now have a working Campus Connect foundation. Follow the detailed roadmap and task list to build out all features.

**Happy coding! 🚀**
