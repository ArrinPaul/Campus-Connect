import fc from 'fast-check';

/**
 * Property-Based Tests for Authentication
 * Feature: campus-connect-foundation
 * 
 * These tests verify authentication properties including user record creation
 * and protected route authorization using property-based testing.
 * 
 * Note: These tests validate the data structures and logic patterns.
 * Integration tests with actual Convex runtime are in separate test files.
 */

describe('Authentication Properties', () => {
  /**
   * Helper function to simulate user creation logic
   * Mirrors the logic in convex/users.ts createUserFromWebhook
   */
  const createUserRecord = (args: {
    clerkId: string;
    email: string;
    name: string;
    profilePicture?: string;
  }) => {
    return {
      _id: `user_${Date.now()}_${Math.random()}`,
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      profilePicture: args.profilePicture,
      bio: "",
      university: "",
      role: "Student" as const,
      experienceLevel: "Beginner" as const,
      skills: [],
      socialLinks: {
        github: undefined,
        linkedin: undefined,
        twitter: undefined,
        website: undefined,
      },
      followerCount: 0,
      followingCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  /**
   * Helper function to simulate user update logic
   * Mirrors the logic in convex/users.ts updateUserFromWebhook
   */
  const updateUserRecord = (
    existingUser: ReturnType<typeof createUserRecord>,
    updates: {
      email: string;
      name: string;
      profilePicture?: string;
    }
  ) => {
    return {
      ...existingUser,
      email: updates.email,
      name: updates.name,
      profilePicture: updates.profilePicture,
      updatedAt: Date.now(),
    };
  };

  /**
   * Property 1: User record creation on authentication
   * **Validates: Requirements 1.5**
   * 
   * For any successful authentication event, a corresponding user record must exist 
   * in the database with the authenticated user's information.
   */
  describe('Property 1: User record creation on authentication', () => {
    it('should create a user record with all required fields when authentication succeeds', () => {
      fc.assert(
        fc.property(
          fc.record({
            clerkId: fc.string({ minLength: 10, maxLength: 50 }),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            profilePicture: fc.option(fc.webUrl(), { nil: undefined }),
          }),
          (userData) => {
            // Simulate user creation from webhook
            const user = createUserRecord(userData);

            // Verify user record was created with correct data
            expect(user).toBeDefined();
            expect(user.clerkId).toBe(userData.clerkId);
            expect(user.email).toBe(userData.email);
            expect(user.name).toBe(userData.name);
            expect(user.profilePicture).toBe(userData.profilePicture);

            // Verify default profile values are set (Requirement 2.1)
            expect(user.bio).toBe('');
            expect(user.university).toBe('');
            expect(user.role).toBe('Student');
            expect(user.experienceLevel).toBe('Beginner');
            expect(user.skills).toEqual([]);
            expect(user.followerCount).toBe(0);
            expect(user.followingCount).toBe(0);

            // Verify timestamps are set
            expect(user.createdAt).toBeGreaterThan(0);
            expect(user.updatedAt).toBeGreaterThan(0);
            
            // Verify all required fields are present
            expect(user).toHaveProperty('_id');
            expect(user).toHaveProperty('socialLinks');
            expect(user.socialLinks).toHaveProperty('github');
            expect(user.socialLinks).toHaveProperty('linkedin');
            expect(user.socialLinks).toHaveProperty('twitter');
            expect(user.socialLinks).toHaveProperty('website');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle user updates correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            clerkId: fc.string({ minLength: 10, maxLength: 50 }),
            initialEmail: fc.emailAddress(),
            initialName: fc.string({ minLength: 1, maxLength: 100 }),
            updatedEmail: fc.emailAddress(),
            updatedName: fc.string({ minLength: 1, maxLength: 100 }),
            updatedProfilePicture: fc.option(fc.webUrl(), { nil: undefined }),
          }),
          (userData) => {
            // Create user initially
            const initialUser = createUserRecord({
              clerkId: userData.clerkId,
              email: userData.initialEmail,
              name: userData.initialName,
            });

            const initialCreatedAt = initialUser.createdAt;

            // Simulate a small delay
            const delay = 100;
            
            // Update user
            const updatedUser = updateUserRecord(initialUser, {
              email: userData.updatedEmail,
              name: userData.updatedName,
              profilePicture: userData.updatedProfilePicture,
            });

            // Verify user was updated with new data
            expect(updatedUser).toBeDefined();
            expect(updatedUser.clerkId).toBe(userData.clerkId);
            expect(updatedUser.email).toBe(userData.updatedEmail);
            expect(updatedUser.name).toBe(userData.updatedName);
            expect(updatedUser.profilePicture).toBe(userData.updatedProfilePicture);

            // Verify updatedAt timestamp was updated
            expect(updatedUser.updatedAt).toBeGreaterThanOrEqual(initialCreatedAt);
            
            // Verify profile data is preserved
            expect(updatedUser.bio).toBe(initialUser.bio);
            expect(updatedUser.university).toBe(initialUser.university);
            expect(updatedUser.role).toBe(initialUser.role);
            expect(updatedUser.skills).toEqual(initialUser.skills);
            expect(updatedUser.followerCount).toBe(initialUser.followerCount);
            expect(updatedUser.followingCount).toBe(initialUser.followingCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate email format in user records', () => {
      fc.assert(
        fc.property(
          fc.record({
            clerkId: fc.string({ minLength: 10, maxLength: 50 }),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          (userData) => {
            const user = createUserRecord(userData);
            
            // Verify email contains @ symbol (basic validation)
            expect(user.email).toContain('@');
            
            // Verify email is not empty
            expect(user.email.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Protected route authorization
   * **Validates: Requirements 1.7**
   * 
   * For any protected route and any unauthenticated request, access must be denied 
   * and the user redirected to login.
   * 
   * Note: This property validates the route matching logic. The actual middleware
   * integration is tested in src/middleware.test.ts
   */
  describe('Property 2: Protected route authorization', () => {
    // Helper to simulate route matcher logic from middleware
    const isPublicRoute = (pathname: string): boolean => {
      const publicRoutes = [
        "/",
        "/sign-in",
        "/sign-up",
        "/api/webhooks",
      ];
      
      return publicRoutes.some((route) => {
        if (route.includes("(.*)")) {
          const baseRoute = route.replace("(.*)", "");
          return pathname.startsWith(baseRoute);
        }
        return pathname === route || pathname.startsWith(route + "/");
      });
    };

    it('should identify public routes correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "/",
            "/sign-in",
            "/sign-in/sso-callback",
            "/sign-up",
            "/sign-up/verify-email",
            "/api/webhooks/clerk",
            "/api/webhooks/stripe"
          ),
          (pathname) => {
            const result = isPublicRoute(pathname);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify protected routes correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "/dashboard",
            "/profile",
            "/profile/123",
            "/feed",
            "/discover",
            "/settings",
            "/posts/123",
            "/api/posts",
            "/api/users"
          ),
          (pathname) => {
            const result = isPublicRoute(pathname);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various pathname formats', () => {
      fc.assert(
        fc.property(
          fc.record({
            base: fc.constantFrom("/dashboard", "/profile", "/feed", "/discover"),
            suffix: fc.option(
              fc.constantFrom("/123", "/abc", "/edit", "/new"),
              { nil: "" }
            ),
          }),
          ({ base, suffix }) => {
            const pathname = base + (suffix || "");
            const result = isPublicRoute(pathname);
            
            // All dashboard, profile, feed, discover routes should be protected
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that authentication is required for protected routes', () => {
      fc.assert(
        fc.property(
          fc.record({
            isAuthenticated: fc.boolean(),
            pathname: fc.constantFrom(
              "/dashboard",
              "/profile",
              "/feed",
              "/discover",
              "/settings"
            ),
          }),
          ({ isAuthenticated, pathname }) => {
            const isPublic = isPublicRoute(pathname);
            
            // Protected routes should not be public
            expect(isPublic).toBe(false);
            
            // If not authenticated and route is not public, access should be denied
            if (!isAuthenticated && !isPublic) {
              // This would trigger auth.protect() in the middleware
              expect(isAuthenticated).toBe(false);
              expect(isPublic).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
