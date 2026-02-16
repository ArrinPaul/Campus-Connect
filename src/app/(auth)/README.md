# Authentication Pages

This directory contains the authentication pages for Campus Connect using Clerk.

## Pages

### Sign In (`/sign-in`)
- Location: `sign-in/[[...sign-in]]/page.tsx`
- Uses Clerk's `<SignIn />` component
- Supports email/password and OAuth providers (Google, GitHub, LinkedIn)
- Accessible to unauthenticated users only

### Sign Up (`/sign-up`)
- Location: `sign-up/[[...sign-up]]/page.tsx`
- Uses Clerk's `<SignUp />` component
- Supports email/password and OAuth providers (Google, GitHub, LinkedIn)
- Accessible to unauthenticated users only

## OAuth Providers

The following OAuth providers are configured:
- **Google** - Sign in with Google account
- **GitHub** - Sign in with GitHub account
- **LinkedIn** - Sign in with LinkedIn account

For detailed OAuth configuration instructions, see [docs/OAUTH_SETUP.md](../../../docs/OAUTH_SETUP.md).

## Route Protection

Authentication routes are public and defined in `src/middleware.ts`:
```typescript
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
])
```

All other routes are protected and require authentication.

## Styling

Both pages use:
- Gradient background (`from-blue-50 to-indigo-100`)
- Centered layout with max-width container
- Custom Clerk appearance configuration from root layout
- Responsive design with proper padding

## User Flow

1. User visits protected route without authentication
2. Middleware redirects to `/sign-in`
3. User signs in or clicks "Sign up" link
4. Clerk handles authentication
5. On success, Clerk webhook creates/updates user in Convex
6. User is redirected to originally requested route or dashboard

## Testing

To test authentication:
1. Start development server: `npm run dev`
2. Navigate to `/sign-in` or `/sign-up`
3. Test email/password authentication
4. Test OAuth providers (requires configuration in Clerk Dashboard)
5. Verify user creation in Convex dashboard

## Requirements Validated

- **Requirement 1.3**: Email/password authentication support
- **Requirement 1.4**: Social login via Google, GitHub, and LinkedIn
