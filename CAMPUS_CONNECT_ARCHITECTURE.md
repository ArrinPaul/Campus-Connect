# Campus Connect - Technical Architecture

## 🏗️ System Architecture Overview

Campus Connect is built using a modern, scalable architecture leveraging Next.js 14, Clerk, Convex, and Vercel.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Next.js 14 (App Router)                     │  │
│  │  - React Server Components                            │  │
│  │  - Client Components                                  │  │
│  │  - API Routes                                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Layer                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Clerk Auth                         │  │
│  │  - User Management                                    │  │
│  │  - Social Logins                                      │  │
│  │  - Session Management                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Convex Backend                       │  │
│  │  - Real-time Database                                 │  │
│  │  - Queries & Mutations                                │  │
│  │  - File Storage                                       │  │
│  │  - Actions (Server-side)                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Vercel Platform                      │  │
│  │  - Edge Functions                                     │  │
│  │  - CDN                                                │  │
│  │  - Analytics                                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
campus-connect/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Auth routes group
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (main)/              # Main app routes
│   │   │   ├── feed/
│   │   │   ├── profile/
│   │   │   ├── messages/
│   │   │   ├── hackathons/
│   │   │   └── teams/
│   │   ├── api/                 # API routes
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── layout/              # Layout components
│   │   ├── posts/               # Post-related components
│   │   ├── users/               # User-related components
│   │   └── shared/              # Shared components
│   ├── convex/                  # Convex backend
│   │   ├── schema.ts            # Database schema
│   │   ├── users.ts             # User queries/mutations
│   │   ├── posts.ts             # Post queries/mutations
│   │   ├── messages.ts          # Message queries/mutations
│   │   └── _generated/          # Generated types
│   ├── lib/                     # Utility libraries
│   │   ├── utils.ts
│   │   ├── validations.ts
│   │   └── constants.ts
│   ├── hooks/                   # Custom React hooks
│   │   ├── useUser.ts
│   │   ├── usePosts.ts
│   │   └── useNotifications.ts
│   ├── types/                   # TypeScript types
│   │   ├── index.ts
│   │   └── convex.ts
│   └── styles/                  # Global styles
│       └── globals.css
├── public/                      # Static assets
├── convex/                      # Convex config
│   └── convex.json
├── .env.local                   # Environment variables
├── next.config.js               # Next.js config
├── tailwind.config.ts           # Tailwind config
├── tsconfig.json                # TypeScript config
└── package.json
```

---

## 🗄️ Database Schema (Convex)

### Users Table
```typescript
users: {
  clerkId: string
  email: string
  firstName: string
  lastName: string
  imageUrl?: string
  bio?: string
  university?: string
  graduationYear?: number
  major?: string
  skills: string[]
  role: "student" | "researcher" | "faculty"
  experienceLevel: "beginner" | "intermediate" | "advanced" | "expert"
  githubUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  createdAt: number
  updatedAt: number
}
```

### Posts Table
```typescript
posts: {
  authorId: Id<"users">
  content: string
  images?: string[]
  likes: Id<"users">[]
  commentCount: number
  createdAt: number
  updatedAt: number
}
```

### Comments Table
```typescript
comments: {
  postId: Id<"posts">
  authorId: Id<"users">
  content: string
  parentId?: Id<"comments">
  likes: Id<"users">[]
  createdAt: number
}
```


### Follows Table
```typescript
follows: {
  followerId: Id<"users">
  followingId: Id<"users">
  createdAt: number
}
```

### Notifications Table
```typescript
notifications: {
  userId: Id<"users">
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: number
}
```

### Messages Table
```typescript
messages: {
  conversationId: Id<"conversations">
  senderId: Id<"users">
  content: string
  attachments?: string[]
  read: boolean
  createdAt: number
}
```

### Hackathons Table
```typescript
hackathons: {
  name: string
  description: string
  startDate: number
  endDate: number
  location?: string
  organizerId: Id<"users">
  tags: string[]
  status: "upcoming" | "ongoing" | "completed"
  maxTeamSize: number
  createdAt: number
}
```

### Teams Table
```typescript
teams: {
  hackathonId: Id<"hackathons">
  name: string
  description: string
  leaderId: Id<"users">
  members: Id<"users">[]
  requiredSkills: string[]
  technologies: string[]
  isOpen: boolean
  maxSize: number
  createdAt: number
}
```

---

## 🔐 Authentication Flow

### Clerk Integration

1. **User Signs Up**
   - User creates account via Clerk
   - Clerk webhook triggers
   - User data synced to Convex
   - Welcome email sent

2. **User Signs In**
   - Clerk handles authentication
   - JWT token issued
   - Session created
   - User redirected to feed

3. **Session Management**
   - Clerk manages sessions
   - Automatic token refresh
   - Secure cookie storage
   - Multi-device support

### Authorization

```typescript
// Middleware protection
export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect()
})

// Convex query with auth
export const getUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")
    // Query logic
  }
})
```

---

## 🔄 Real-time Data Flow

### Convex Real-time Updates

```typescript
// Client subscribes to query
const posts = useQuery(api.posts.getPosts)

// Server mutation updates data
const createPost = useMutation(api.posts.create)

// All subscribed clients receive update automatically
```

### Data Flow Diagram

```
User Action → Client Component → Convex Mutation
                                       ↓
                                  Database Update
                                       ↓
                              Real-time Broadcast
                                       ↓
                            All Subscribed Clients
                                       ↓
                              UI Auto-updates
```

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App
├── Providers
│   ├── ClerkProvider
│   ├── ConvexProvider
│   ├── ThemeProvider
│   └── QueryClientProvider
├── Layout
│   ├── TopBar
│   ├── Sidebar
│   └── MobileNav
└── Pages
    ├── Feed
    │   ├── CreatePost
    │   ├── PostList
    │   └── PostCard
    ├── Profile
    │   ├── ProfileHeader
    │   ├── ProfileInfo
    │   └── ProfilePosts
    └── Messages
        ├── ConversationList
        └── ChatWindow
```

### State Management

**Local State:** React useState/useReducer
**Server State:** Convex queries (auto-synced)
**Global State:** Zustand for UI state
**Form State:** React Hook Form

```typescript
// Zustand store example
interface AppState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  toggleTheme: () => void
  toggleSidebar: () => void
}

const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  sidebarOpen: true,
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
}))
```

---

## 🚀 Performance Optimization

### Next.js Optimizations

1. **Server Components**
   - Use RSC for static content
   - Reduce client-side JavaScript
   - Faster initial page load

2. **Image Optimization**
   - Next.js Image component
   - Automatic WebP conversion
   - Lazy loading
   - Responsive images

3. **Code Splitting**
   - Dynamic imports
   - Route-based splitting
   - Component lazy loading

4. **Caching**
   - React Query caching
   - Convex query caching
   - CDN caching (Vercel)

### Convex Optimizations

1. **Query Optimization**
   - Use indexes effectively
   - Limit query results
   - Implement pagination
   - Avoid N+1 queries

2. **Real-time Efficiency**
   - Subscribe only to needed data
   - Use query filters
   - Implement debouncing

---

## 🔒 Security Measures

### Authentication Security
- Clerk handles auth securely
- JWT tokens with expiration
- HTTPS only
- CSRF protection
- XSS prevention

### Data Security
- Input validation (Zod)
- SQL injection prevention (Convex)
- Rate limiting
- Content sanitization
- File upload validation

### Authorization
- Role-based access control
- Resource ownership checks
- Middleware protection
- API route protection

---

## 📊 Monitoring & Analytics

### Vercel Analytics
- Page views
- User interactions
- Performance metrics
- Error tracking

### Custom Analytics
- User engagement
- Feature usage
- Conversion tracking
- A/B testing

### Error Monitoring
- Sentry integration
- Error logging
- Performance monitoring
- User feedback

---

## 🌐 Deployment Strategy

### Vercel Deployment

```yaml
# vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test
      - run: npm run build
      - uses: amondnet/vercel-action@v20
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Component test example
describe('PostCard', () => {
  it('renders post content', () => {
    render(<PostCard post={mockPost} />)
    expect(screen.getByText(mockPost.content)).toBeInTheDocument()
  })
})
```

### Integration Tests
```typescript
// Convex mutation test
test('createPost creates a post', async () => {
  const result = await createPost({ content: 'Test post' })
  expect(result).toBeDefined()
})
```

### E2E Tests
```typescript
// Playwright test
test('user can create a post', async ({ page }) => {
  await page.goto('/feed')
  await page.fill('[data-testid="post-input"]', 'Test post')
  await page.click('[data-testid="post-button"]')
  await expect(page.locator('text=Test post')).toBeVisible()
})
```

---

## 📱 Mobile Responsiveness

### Breakpoints
```typescript
// tailwind.config.ts
theme: {
  screens: {
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1536px',
  }
}
```

### Mobile-First Approach
- Design for mobile first
- Progressive enhancement
- Touch-friendly UI
- Optimized images
- Reduced animations

---

## 🔄 Data Migration Strategy

### Schema Evolution
1. Add new fields as optional
2. Migrate existing data
3. Make fields required
4. Remove old fields

### Backup Strategy
- Daily automated backups
- Point-in-time recovery
- Export functionality
- Disaster recovery plan

---

## 🌍 Scalability Considerations

### Horizontal Scaling
- Convex auto-scales
- Vercel edge functions
- CDN distribution
- Load balancing

### Database Optimization
- Proper indexing
- Query optimization
- Data archiving
- Caching layers

### Future Considerations
- Microservices architecture
- Message queues
- Separate read/write databases
- GraphQL API

---

## 📚 API Documentation

### Convex API Structure

```typescript
// Query example
export const getPosts = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Implementation
  }
})

// Mutation example
export const createPost = mutation({
  args: {
    content: v.string(),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Implementation
  }
})
```

---

## 🎯 Best Practices

### Code Quality
- TypeScript strict mode
- ESLint rules
- Prettier formatting
- Code reviews
- Documentation

### Git Workflow
- Feature branches
- Pull requests
- Semantic commits
- Protected main branch
- Automated testing

### Performance
- Lazy loading
- Code splitting
- Image optimization
- Caching strategies
- Bundle analysis

---

## 🔮 Future Enhancements

### Technical Improvements
- GraphQL API
- WebSocket fallback
- Offline support
- PWA features
- Native mobile apps

### Infrastructure
- Multi-region deployment
- Advanced caching
- Message queues
- Microservices
- Kubernetes

---

**This architecture provides a solid foundation for Campus Connect to scale and evolve! 🚀**
