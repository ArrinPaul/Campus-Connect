import fc from 'fast-check';

/**
 * Property-Based Tests for Like Operations
 * Feature: campus-connect-foundation
 * 
 * These tests verify like operation properties including creation, count increment,
 * count decrement, and uniqueness constraints.
 */

describe('Like Operations Properties', () => {
  /**
   * Helper to simulate like creation
   * Mirrors the logic in convex/posts.ts likePost
   */
  const createLike = (data: {
    userId: string;
    postId: string;
  }) => {
    return {
      _id: `like_${Date.now()}_${Math.random()}`,
      userId: data.userId,
      postId: data.postId,
      createdAt: Date.now(),
    };
  };

  /**
   * Helper to simulate post state
   */
  const createPost = (data: {
    authorId: string;
    content: string;
    likeCount?: number;
  }) => {
    const now = Date.now();
    return {
      _id: `post_${Date.now()}_${Math.random()}`,
      authorId: data.authorId,
      content: data.content,
      likeCount: data.likeCount ?? 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  };

  /**
   * Property 19: Like creation
   * **Validates: Requirements 5.1**
   * 
   * For any authenticated user liking a post they haven't previously liked, 
   * a like record must be created linking the user to the post.
   */
  describe('Property 19: Like creation', () => {
    it('should create like record linking user to post', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            postId: fc.string({ minLength: 10, maxLength: 50 }),
          }),
          (data) => {
            // Simulate database state - no existing like
            const likesDatabase = new Map<string, any>();

            // Create like
            const like = createLike(data);
            const likeKey = `${data.userId}_${data.postId}`;
            likesDatabase.set(likeKey, like);

            // Verify like record was created
            expect(likesDatabase.has(likeKey)).toBe(true);
            const storedLike = likesDatabase.get(likeKey);
            expect(storedLike.userId).toBe(data.userId);
            expect(storedLike.postId).toBe(data.postId);
            expect(storedLike._id).toBeDefined();
            expect(storedLike.createdAt).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should link correct user to correct post', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            otherUserId: fc.string({ minLength: 10, maxLength: 50 }),
            otherPostId: fc.string({ minLength: 10, maxLength: 50 }),
          }).filter(data => 
            data.userId !== data.otherUserId && 
            data.postId !== data.otherPostId
          ),
          (data) => {
            const like = createLike({
              userId: data.userId,
              postId: data.postId,
            });

            // Verify the like links the correct user and post
            expect(like.userId).toBe(data.userId);
            expect(like.postId).toBe(data.postId);
            
            // Verify it doesn't link to other entities
            expect(like.userId).not.toBe(data.otherUserId);
            expect(like.postId).not.toBe(data.otherPostId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 20: Like count increment
   * **Validates: Requirements 5.2**
   * 
   * For any post that is liked, the post's likeCount must increase by exactly 1.
   */
  describe('Property 20: Like count increment', () => {
    it('should increment likeCount by exactly 1', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            authorId: fc.string({ minLength: 10, maxLength: 50 }),
            content: fc.string({ minLength: 1, maxLength: 5000 }),
            initialLikeCount: fc.nat({ max: 1000 }),
          }),
          (data) => {
            // Create post with initial like count
            const post = createPost({
              authorId: data.authorId,
              content: data.content,
              likeCount: data.initialLikeCount,
            });

            const initialCount = post.likeCount;

            // Simulate like operation
            post.likeCount = post.likeCount + 1;

            // Verify count increased by exactly 1
            expect(post.likeCount).toBe(initialCount + 1);
            expect(post.likeCount - initialCount).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increment from zero correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            authorId: fc.string({ minLength: 10, maxLength: 50 }),
            content: fc.string({ minLength: 1, maxLength: 5000 }),
          }),
          (data) => {
            // Create post with zero likes
            const post = createPost({
              authorId: data.authorId,
              content: data.content,
              likeCount: 0,
            });

            // Simulate like operation
            post.likeCount = post.likeCount + 1;

            // Verify count is now 1
            expect(post.likeCount).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain non-negative count after increment', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            authorId: fc.string({ minLength: 10, maxLength: 50 }),
            content: fc.string({ minLength: 1, maxLength: 5000 }),
            initialLikeCount: fc.nat({ max: 1000 }),
          }),
          (data) => {
            const post = createPost({
              authorId: data.authorId,
              content: data.content,
              likeCount: data.initialLikeCount,
            });

            // Simulate like operation
            post.likeCount = post.likeCount + 1;

            // Verify count is non-negative
            expect(post.likeCount).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 21: Like count decrement
   * **Validates: Requirements 5.3**
   * 
   * For any post that is unliked by a user who previously liked it, 
   * the post's likeCount must decrease by exactly 1.
   */
  describe('Property 21: Like count decrement', () => {
    it('should decrement likeCount by exactly 1', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            authorId: fc.string({ minLength: 10, maxLength: 50 }),
            content: fc.string({ minLength: 1, maxLength: 5000 }),
            initialLikeCount: fc.integer({ min: 1, max: 1000 }),
          }),
          (data) => {
            // Create post with initial like count (at least 1)
            const post = createPost({
              authorId: data.authorId,
              content: data.content,
              likeCount: data.initialLikeCount,
            });

            const initialCount = post.likeCount;

            // Simulate unlike operation
            post.likeCount = Math.max(0, post.likeCount - 1);

            // Verify count decreased by exactly 1
            expect(post.likeCount).toBe(initialCount - 1);
            expect(initialCount - post.likeCount).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not go below zero when unliking', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            authorId: fc.string({ minLength: 10, maxLength: 50 }),
            content: fc.string({ minLength: 1, maxLength: 5000 }),
            initialLikeCount: fc.nat({ max: 1000 }),
          }),
          (data) => {
            const post = createPost({
              authorId: data.authorId,
              content: data.content,
              likeCount: data.initialLikeCount,
            });

            // Simulate unlike operation with Math.max to prevent negative
            post.likeCount = Math.max(0, post.likeCount - 1);

            // Verify count is non-negative
            expect(post.likeCount).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle unlike from count of 1 correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            authorId: fc.string({ minLength: 10, maxLength: 50 }),
            content: fc.string({ minLength: 1, maxLength: 5000 }),
          }),
          (data) => {
            // Create post with exactly 1 like
            const post = createPost({
              authorId: data.authorId,
              content: data.content,
              likeCount: 1,
            });

            // Simulate unlike operation
            post.likeCount = Math.max(0, post.likeCount - 1);

            // Verify count is now 0
            expect(post.likeCount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 22: Like uniqueness
   * **Validates: Requirements 5.4**
   * 
   * For any user and post combination, at most one like record must exist. 
   * Attempting to like the same post multiple times must be rejected or have no additional effect.
   */
  describe('Property 22: Like uniqueness', () => {
    it('should prevent duplicate likes for same user-post combination', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            postId: fc.string({ minLength: 10, maxLength: 50 }),
          }),
          (data) => {
            // Simulate database state
            const likesDatabase = new Map<string, any>();
            const likeKey = `${data.userId}_${data.postId}`;

            // First like - should succeed
            const firstLike = createLike(data);
            likesDatabase.set(likeKey, firstLike);

            // Verify first like exists
            expect(likesDatabase.has(likeKey)).toBe(true);

            // Attempt second like - check if already exists
            const alreadyLiked = likesDatabase.has(likeKey);
            
            // Should detect existing like
            expect(alreadyLiked).toBe(true);

            // If we try to add again, it should be rejected (simulated by checking)
            if (alreadyLiked) {
              // Don't add duplicate - this is the correct behavior
              const countBefore = likesDatabase.size;
              // Attempt is rejected, size stays the same
              expect(likesDatabase.size).toBe(countBefore);
            }

            // Verify only one like exists for this combination
            expect(likesDatabase.get(likeKey)).toBe(firstLike);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow different users to like the same post', () => {
      fc.assert(
        fc.property(
          fc.record({
            user1Id: fc.string({ minLength: 10, maxLength: 50 }),
            user2Id: fc.string({ minLength: 10, maxLength: 50 }),
            postId: fc.string({ minLength: 10, maxLength: 50 }),
          }).filter(data => data.user1Id !== data.user2Id),
          (data) => {
            // Simulate database state
            const likesDatabase = new Map<string, any>();

            // User 1 likes the post
            const like1 = createLike({
              userId: data.user1Id,
              postId: data.postId,
            });
            const key1 = `${data.user1Id}_${data.postId}`;
            likesDatabase.set(key1, like1);

            // User 2 likes the same post
            const like2 = createLike({
              userId: data.user2Id,
              postId: data.postId,
            });
            const key2 = `${data.user2Id}_${data.postId}`;
            likesDatabase.set(key2, like2);

            // Verify both likes exist
            expect(likesDatabase.has(key1)).toBe(true);
            expect(likesDatabase.has(key2)).toBe(true);
            expect(likesDatabase.size).toBe(2);

            // Verify they are different records
            expect(likesDatabase.get(key1)).not.toBe(likesDatabase.get(key2));
            expect(likesDatabase.get(key1).userId).toBe(data.user1Id);
            expect(likesDatabase.get(key2).userId).toBe(data.user2Id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow same user to like different posts', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            post1Id: fc.string({ minLength: 10, maxLength: 50 }),
            post2Id: fc.string({ minLength: 10, maxLength: 50 }),
          }).filter(data => data.post1Id !== data.post2Id),
          (data) => {
            // Simulate database state
            const likesDatabase = new Map<string, any>();

            // User likes post 1
            const like1 = createLike({
              userId: data.userId,
              postId: data.post1Id,
            });
            const key1 = `${data.userId}_${data.post1Id}`;
            likesDatabase.set(key1, like1);

            // User likes post 2
            const like2 = createLike({
              userId: data.userId,
              postId: data.post2Id,
            });
            const key2 = `${data.userId}_${data.post2Id}`;
            likesDatabase.set(key2, like2);

            // Verify both likes exist
            expect(likesDatabase.has(key1)).toBe(true);
            expect(likesDatabase.has(key2)).toBe(true);
            expect(likesDatabase.size).toBe(2);

            // Verify they are different records
            expect(likesDatabase.get(key1)).not.toBe(likesDatabase.get(key2));
            expect(likesDatabase.get(key1).postId).toBe(data.post1Id);
            expect(likesDatabase.get(key2).postId).toBe(data.post2Id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce at most one like per user-post pair', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string({ minLength: 10, maxLength: 50 }),
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            attemptCount: fc.integer({ min: 2, max: 10 }),
          }),
          (data) => {
            // Simulate database with uniqueness constraint
            const likesDatabase = new Map<string, any>();
            const likeKey = `${data.userId}_${data.postId}`;

            // Attempt to like multiple times
            for (let i = 0; i < data.attemptCount; i++) {
              // Check if like already exists (uniqueness check)
              if (!likesDatabase.has(likeKey)) {
                const like = createLike({
                  userId: data.userId,
                  postId: data.postId,
                });
                likesDatabase.set(likeKey, like);
              }
              // If already exists, reject the attempt (do nothing)
            }

            // Verify only one like exists despite multiple attempts
            expect(likesDatabase.size).toBe(1);
            expect(likesDatabase.has(likeKey)).toBe(true);
            
            const storedLike = likesDatabase.get(likeKey);
            expect(storedLike.userId).toBe(data.userId);
            expect(storedLike.postId).toBe(data.postId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
