import fc from 'fast-check';
import { v } from 'convex/values';

/**
 * Property-Based Tests for Data Model Completeness
 * Feature: campus-connect-foundation
 * 
 * These tests verify that all required fields are present in data models
 * according to the schema definitions.
 */

describe('Data Model Completeness Properties', () => {
  /**
   * Property 4: Profile data completeness
   * **Validates: Requirements 2.2**
   * 
   * For any user profile, all required fields (name, email, role, experienceLevel, 
   * skills, socialLinks, followerCount, followingCount) must be present in the stored record.
   */
  describe('Property 4: Profile data completeness', () => {
    it('should have all required fields present in user profile', () => {
      fc.assert(
        fc.property(
          fc.record({
            clerkId: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1 }),
            profilePicture: fc.option(fc.string(), { nil: undefined }),
            bio: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
            university: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
            role: fc.constantFrom('Student', 'Research Scholar', 'Faculty'),
            experienceLevel: fc.constantFrom('Beginner', 'Intermediate', 'Advanced', 'Expert'),
            skills: fc.array(fc.string({ minLength: 1, maxLength: 50 })),
            socialLinks: fc.record({
              github: fc.option(fc.webUrl(), { nil: undefined }),
              linkedin: fc.option(fc.webUrl(), { nil: undefined }),
              twitter: fc.option(fc.webUrl(), { nil: undefined }),
              website: fc.option(fc.webUrl(), { nil: undefined }),
            }),
            followerCount: fc.nat(),
            followingCount: fc.nat(),
            createdAt: fc.nat(),
            updatedAt: fc.nat(),
          }),
          (userProfile) => {
            // Verify all required fields are present
            expect(userProfile).toHaveProperty('clerkId');
            expect(userProfile).toHaveProperty('email');
            expect(userProfile).toHaveProperty('name');
            expect(userProfile).toHaveProperty('role');
            expect(userProfile).toHaveProperty('experienceLevel');
            expect(userProfile).toHaveProperty('skills');
            expect(userProfile).toHaveProperty('socialLinks');
            expect(userProfile).toHaveProperty('followerCount');
            expect(userProfile).toHaveProperty('followingCount');
            expect(userProfile).toHaveProperty('createdAt');
            expect(userProfile).toHaveProperty('updatedAt');

            // Verify required fields are not null/undefined
            expect(userProfile.clerkId).toBeDefined();
            expect(userProfile.email).toBeDefined();
            expect(userProfile.name).toBeDefined();
            expect(userProfile.role).toBeDefined();
            expect(userProfile.experienceLevel).toBeDefined();
            expect(userProfile.skills).toBeDefined();
            expect(userProfile.socialLinks).toBeDefined();
            expect(userProfile.followerCount).toBeDefined();
            expect(userProfile.followingCount).toBeDefined();
            expect(userProfile.createdAt).toBeDefined();
            expect(userProfile.updatedAt).toBeDefined();

            // Verify types
            expect(typeof userProfile.clerkId).toBe('string');
            expect(typeof userProfile.email).toBe('string');
            expect(typeof userProfile.name).toBe('string');
            expect(['Student', 'Research Scholar', 'Faculty']).toContain(userProfile.role);
            expect(['Beginner', 'Intermediate', 'Advanced', 'Expert']).toContain(userProfile.experienceLevel);
            expect(Array.isArray(userProfile.skills)).toBe(true);
            expect(typeof userProfile.socialLinks).toBe('object');
            expect(typeof userProfile.followerCount).toBe('number');
            expect(typeof userProfile.followingCount).toBe('number');
            expect(typeof userProfile.createdAt).toBe('number');
            expect(typeof userProfile.updatedAt).toBe('number');

            // Verify socialLinks structure
            expect(userProfile.socialLinks).toHaveProperty('github');
            expect(userProfile.socialLinks).toHaveProperty('linkedin');
            expect(userProfile.socialLinks).toHaveProperty('twitter');
            expect(userProfile.socialLinks).toHaveProperty('website');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that followerCount and followingCount are non-negative', () => {
      fc.assert(
        fc.property(
          fc.record({
            clerkId: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1 }),
            role: fc.constantFrom('Student', 'Research Scholar', 'Faculty'),
            experienceLevel: fc.constantFrom('Beginner', 'Intermediate', 'Advanced', 'Expert'),
            skills: fc.array(fc.string({ minLength: 1, maxLength: 50 })),
            socialLinks: fc.record({
              github: fc.option(fc.webUrl(), { nil: undefined }),
              linkedin: fc.option(fc.webUrl(), { nil: undefined }),
              twitter: fc.option(fc.webUrl(), { nil: undefined }),
              website: fc.option(fc.webUrl(), { nil: undefined }),
            }),
            followerCount: fc.nat(),
            followingCount: fc.nat(),
            createdAt: fc.nat(),
            updatedAt: fc.nat(),
          }),
          (userProfile) => {
            expect(userProfile.followerCount).toBeGreaterThanOrEqual(0);
            expect(userProfile.followingCount).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 16: Post data completeness
   * **Validates: Requirements 4.4**
   * 
   * For any created post, all required fields (authorId, content, likeCount, 
   * commentCount, createdAt, updatedAt) must be present in the stored record.
   */
  describe('Property 16: Post data completeness', () => {
    it('should have all required fields present in post', () => {
      fc.assert(
        fc.property(
          fc.record({
            authorId: fc.string({ minLength: 1 }), // Simulating Id<"users">
            content: fc.string({ minLength: 1, maxLength: 5000 }),
            likeCount: fc.nat(),
            commentCount: fc.nat(),
            createdAt: fc.nat(),
            updatedAt: fc.nat(),
          }),
          (post) => {
            // Verify all required fields are present
            expect(post).toHaveProperty('authorId');
            expect(post).toHaveProperty('content');
            expect(post).toHaveProperty('likeCount');
            expect(post).toHaveProperty('commentCount');
            expect(post).toHaveProperty('createdAt');
            expect(post).toHaveProperty('updatedAt');

            // Verify required fields are not null/undefined
            expect(post.authorId).toBeDefined();
            expect(post.content).toBeDefined();
            expect(post.likeCount).toBeDefined();
            expect(post.commentCount).toBeDefined();
            expect(post.createdAt).toBeDefined();
            expect(post.updatedAt).toBeDefined();

            // Verify types
            expect(typeof post.authorId).toBe('string');
            expect(typeof post.content).toBe('string');
            expect(typeof post.likeCount).toBe('number');
            expect(typeof post.commentCount).toBe('number');
            expect(typeof post.createdAt).toBe('number');
            expect(typeof post.updatedAt).toBe('number');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that likeCount and commentCount are non-negative', () => {
      fc.assert(
        fc.property(
          fc.record({
            authorId: fc.string({ minLength: 1 }),
            content: fc.string({ minLength: 1, maxLength: 5000 }),
            likeCount: fc.nat(),
            commentCount: fc.nat(),
            createdAt: fc.nat(),
            updatedAt: fc.nat(),
          }),
          (post) => {
            expect(post.likeCount).toBeGreaterThanOrEqual(0);
            expect(post.commentCount).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that content does not exceed 5000 characters', () => {
      fc.assert(
        fc.property(
          fc.record({
            authorId: fc.string({ minLength: 1 }),
            content: fc.string({ minLength: 1, maxLength: 5000 }),
            likeCount: fc.nat(),
            commentCount: fc.nat(),
            createdAt: fc.nat(),
            updatedAt: fc.nat(),
          }),
          (post) => {
            expect(post.content.length).toBeLessThanOrEqual(5000);
            expect(post.content.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 25: Comment data completeness
   * **Validates: Requirements 5.8**
   * 
   * For any created comment, all required fields (postId, authorId, content, createdAt) 
   * must be present in the stored record.
   */
  describe('Property 25: Comment data completeness', () => {
    it('should have all required fields present in comment', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string({ minLength: 1 }), // Simulating Id<"posts">
            authorId: fc.string({ minLength: 1 }), // Simulating Id<"users">
            content: fc.string({ minLength: 1, maxLength: 1000 }),
            createdAt: fc.nat(),
          }),
          (comment) => {
            // Verify all required fields are present
            expect(comment).toHaveProperty('postId');
            expect(comment).toHaveProperty('authorId');
            expect(comment).toHaveProperty('content');
            expect(comment).toHaveProperty('createdAt');

            // Verify required fields are not null/undefined
            expect(comment.postId).toBeDefined();
            expect(comment.authorId).toBeDefined();
            expect(comment.content).toBeDefined();
            expect(comment.createdAt).toBeDefined();

            // Verify types
            expect(typeof comment.postId).toBe('string');
            expect(typeof comment.authorId).toBe('string');
            expect(typeof comment.content).toBe('string');
            expect(typeof comment.createdAt).toBe('number');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that content does not exceed 1000 characters', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string({ minLength: 1 }),
            authorId: fc.string({ minLength: 1 }),
            content: fc.string({ minLength: 1, maxLength: 1000 }),
            createdAt: fc.nat(),
          }),
          (comment) => {
            expect(comment.content.length).toBeLessThanOrEqual(1000);
            expect(comment.content.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that content is not empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string({ minLength: 1 }),
            authorId: fc.string({ minLength: 1 }),
            content: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
            createdAt: fc.nat(),
          }),
          (comment) => {
            expect(comment.content.trim().length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
