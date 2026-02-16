# OAuth Provider Configuration

This document explains how to configure OAuth providers (Google, GitHub, LinkedIn) for Campus Connect authentication.

## Overview

Campus Connect uses Clerk for authentication, which supports multiple OAuth providers. The authentication pages are located at:
- Sign In: `/sign-in`
- Sign Up: `/sign-up`

## Configuring OAuth Providers in Clerk

### 1. Access Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your Campus Connect application
3. Navigate to **User & Authentication** → **Social Connections**

### 2. Enable Google OAuth

1. Click on **Google** in the social connections list
2. Toggle **Enable for sign-up and sign-in**
3. Choose between:
   - **Use Clerk's development keys** (for testing)
   - **Use custom credentials** (for production)

#### Custom Google OAuth Setup (Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   ```
   https://your-domain.clerk.accounts.dev/v1/oauth_callback
   https://your-production-domain.com/sign-in
   https://your-production-domain.com/sign-up
   ```
7. Copy **Client ID** and **Client Secret**
8. Paste them in Clerk Dashboard under Google settings
9. Click **Save**

### 3. Enable GitHub OAuth

1. Click on **GitHub** in the social connections list
2. Toggle **Enable for sign-up and sign-in**
3. Choose between development keys or custom credentials

#### Custom GitHub OAuth Setup (Production)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in application details:
   - **Application name**: Campus Connect
   - **Homepage URL**: Your production URL
   - **Authorization callback URL**: 
     ```
     https://your-domain.clerk.accounts.dev/v1/oauth_callback
     ```
4. Click **Register application**
5. Copy **Client ID**
6. Generate a new **Client Secret** and copy it
7. Paste them in Clerk Dashboard under GitHub settings
8. Click **Save**

### 4. Enable LinkedIn OAuth

1. Click on **LinkedIn** in the social connections list
2. Toggle **Enable for sign-up and sign-in**
3. Choose between development keys or custom credentials

#### Custom LinkedIn OAuth Setup (Production)

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **Create app**
3. Fill in application details:
   - **App name**: Campus Connect
   - **LinkedIn Page**: Your company page
   - **App logo**: Upload your logo
4. In the **Auth** tab, add redirect URLs:
   ```
   https://your-domain.clerk.accounts.dev/v1/oauth_callback
   ```
5. Request access to **Sign In with LinkedIn** product
6. Copy **Client ID** and **Client Secret**
7. Paste them in Clerk Dashboard under LinkedIn settings
8. Click **Save**

## Testing OAuth Providers

### Development Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/sign-up` or `/sign-in`

3. Click on the OAuth provider buttons (Google, GitHub, LinkedIn)

4. Complete the OAuth flow

5. Verify that:
   - User is redirected back to the application
   - User record is created in Convex (check via Convex dashboard)
   - User can access protected routes

### Production Testing

1. Deploy your application to production

2. Update OAuth redirect URIs in each provider's settings to include production URLs

3. Test each OAuth provider:
   - Sign up with new account
   - Sign in with existing account
   - Verify user data synchronization

## Troubleshooting

### Common Issues

**OAuth callback error**
- Verify redirect URIs are correctly configured in provider settings
- Ensure Clerk webhook is properly set up for user synchronization
- Check that CLERK_WEBHOOK_SECRET is set in environment variables

**User not created in Convex**
- Verify Clerk webhook is configured and pointing to your Convex HTTP endpoint
- Check Convex logs for webhook processing errors
- Ensure webhook signature verification is working

**Provider button not showing**
- Verify provider is enabled in Clerk Dashboard
- Check that social connections are properly configured
- Clear browser cache and try again

### Debug Mode

Enable Clerk debug mode to see detailed authentication logs:

```typescript
// In your ClerkProvider configuration
<ClerkProvider
  appearance={{ ... }}
  debug={process.env.NODE_ENV === 'development'}
>
  {children}
</ClerkProvider>
```

## Security Considerations

1. **Never commit OAuth credentials** to version control
2. Use environment variables for all sensitive keys
3. Rotate OAuth secrets regularly
4. Use different OAuth apps for development and production
5. Monitor OAuth usage in provider dashboards
6. Implement rate limiting for authentication endpoints
7. Review OAuth scopes and only request necessary permissions

## Required Scopes

### Google
- `email` - User's email address
- `profile` - Basic profile information

### GitHub
- `user:email` - User's email address
- `read:user` - Basic profile information

### LinkedIn
- `r_emailaddress` - User's email address
- `r_liteprofile` - Basic profile information

## Environment Variables

Ensure these environment variables are set:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Convex
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
```

## Additional Resources

- [Clerk Social Connections Documentation](https://clerk.com/docs/authentication/social-connections/overview)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [LinkedIn OAuth Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)
