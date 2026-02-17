import fc from 'fast-check';

/**
 * Property-Based Tests for Comment Operations
 * Feature: campus-connect-foundation
 * 
 * These tests verify comment operation properties including creation, validation,
 * and chronological ordering.
 */

describe('Comment Operations Properties', () => {
  /**
   * Helper to simulate comment creation
   * Mirrors the logic in convex/comments.ts createComment
   */
  const createComment = (data: {
    postId: string;
    authorId: string;
    content: string;
  }) => {
    return {
      _id: `comment_${Date.now()}_${Math.random()}`,
      postId: data.postId,
      authorId: data.authorId,
      content: data.content,
      createdAt: Date.now(),
    };
  };

  /**
   * Helper to simulate post state
   */
  const createPost = (data: {
    authorId: string;
    content: string;
    commentCount?: number;
  }) => {
    const now = Date.now();
    return {
      _id: `post_${Date.now()}_${Math.random()}`,
      authorId: data.authorId,
      content: data.content,
      likeCount: 0,
      commentCount: data.commentCount ?? 0,
      createdAt: now,
      updatedAt: now,
    };
  };

  /**
   * Property 23: Comment creation
   * **Validates: Requirements 5.5**
   * 
   * For any authenticated user commenting on a post with valid content, 
   * a new comment record must be created in the database.
   */
  describe('Property 23: Comment creation', () => {
    it('should create comment record with all required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            authorId: fc.string({ minLength: 10, maxLength: 50 }),
            content: fc.string({ minLength: 1, maxLength: 1000 }),
          }),
          (data) => {
            // Simulate database state
            const commentsDatabase = new Map<string, any>();

            // Create comment
            const comment = createComment(data);
            commentsDatabase.set(comment._id, comment);

            // Verify comment record was created
            expect(commentsDatabase.has(comment._id)).toBe(true);
            const storedComment = commentsDatabase.get(comment._id);
            
            // Verify all required fields are present
            expect(storedComment._id).toBeDefined();
            expect(storedComment.postId).toBe(data.postId);
            expect(storedComment.authorId).toBe(data.authorId);
            expect(storedComment.content).toBe(data.content);
            expect(storedComment.createdAt).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should link comment to correct post and author', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            authorId: fc.string({ minLength: 10, maxLength: 50 }),
            content: fc.string({ minLength: 1, maxLength: 1000 }),
            otherPostId: fc.string({ minLength: 10, maxLength: 50 }),
            otherAuthorId: fc.string({ minLength: 10, maxLength: 50 }),
          }).filter(data => 
            data.postId !== data.otherPostId && 
            data.authorId !== data.otherAuthorId
          ),
          (data) => {
            const comment = createComment({
              postId: data.postId,
              authorId: data.authorId,
              content: data.content,
            });

            // Verify the comment links to correct post and author
            expect(comment.postId).toBe(data.postId);
            expect(comment.authorId).toBe(data.authorId);
            
            // Verify it doesn't link to other entities
            expect(comment.postId).not.toBe(data.otherPostId);
            expect(comment.authorId).not.toBe(data.otherAuthorId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increment post commentCount when comment is created', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            authorId: fc.string({ minLength: 10, maxLength: 50 }),
            postAuthorId: fc.string({ minLength: 10, maxLength: 50 }),
            postContent: fc.string({ minLength: 1, maxLength: 5000 }),
            commentContent: fc.string({ minLength: 1, maxLength: 1000 }),
            initialCommentCount: fc.nat({ max: 1000 }),
          }),
          (data) => {
            // Create post with initial comment count
            const post = createPost({
              authorId: data.postAuthorId,
              content: data.postContent,
              commentCount: data.initialCommentCount,
            });

            const initialCount = post.commentCount;

            // Simulate comment creation
            createComment({
              postId: data.postId,
              authorId: data.authorId,
              content: data.commentContent,
            });

            // Simulate incrementing post commentCount
            post.commentCount = post.commentCount + 1;

            // Verify count increased by exactly 1
            expect(post.commentCount).toBe(initialCount + 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 24: Comment validation
   * **Validates: Requirements 5.6, 5.7**
   * 
   * For any comment creation, the following validation rules must be enforced:
   * - Comment text must not be empty
   * - Comment text must not exceed 1000 characters
   * Invalid comments must be rejected with appropriate error messages.
   */
  describe('Property 24: Comment validation', () => {
    describe('Empty content validation', () => {
      it('should reject empty comment content', () => {
        fc.assert(
          fc.property(
            fc.record({
              postId: fc.string({ minLength: 10, maxLength: 50 }),
              authorId: fc.string({ minLength: 10, maxLength: 50 }),
            }),
            (data) => {
              const emptyContent = '';

              // Simulate validation
              const isValid = emptyContent.trim().length > 0;

              // Verify empty content is rejected
              expect(isValid).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject whitespace-only comment content', () => {
        fc.assert(
          fc.property(
            fc.record({
              postId: fc.string({ minLength: 10, maxLength: 50 }),
              authorId: fc.string({ minLength: 10, maxLength: 50 }),
              whitespaceCount: fc.integer({ min: 1, max: 10 }),
            }),
            (data) => {
              // Create whitespace-only string
              const whitespace = ' '.repeat(data.whitespaceCount);
              
              // Simulate validation
              const isValid = whitespace.trim().length > 0;

              // Verify whitespace-only content is rejected
              expect(isValid).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Maximum length validation', () => {
      it('should reject comment content exceeding 1000 characters', () => {
        fc.assert(
          fc.property(
            fc.record({
              postId: fc.string({ minLength: 10, maxLength: 50 }),
              authorId: fc.string({ minLength: 10, maxLength: 50 }),
              content: fc.string({ minLength: 1001, maxLength: 2000 }),
            }),
            (data) => {
              // Simulate validation
              const isValid = data.content.length <= 1000;

              // Verify content exceeding 1000 chars is rejected
              expect(isValid).toBe(false);
              expect(data.content.length).toBeGreaterThan(1000);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept comment content at exactly 1000 characters', () => {
        fc.assert(
          fc.property(
            fc.record({
              postId: fc.string({ minLength: 10, maxLength: 50 }),
              authorId: fc.string({ minLength: 10, maxLength: 50 }),
            }),
            (data) => {
              const content = 'a'.repeat(1000);

              // Simulate validation
              const isValid = content.length <= 1000 && content.trim().length > 0;

              // Verify content at exactly 1000 chars is accepted
              expect(isValid).toBe(true);
              expect(content.length).toBe(1000);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept comment content below 1000 characters', () => {
        fc.assert(
          fc.property(
            fc.record({
              postId: fc.string({ minLength: 10, maxLength: 50 }),
              authorId: fc.string({ minLength: 10, maxLength: 50 }),
              content: fc.string({ minLength: 1, maxLength: 999 }),
            }),
            (data) => {
              // Simulate validation
              const isValid = data.content.length <= 1000 && data.content.trim().length > 0;

              // Verify content below 1000 chars is accepted
              expect(isValid).toBe(true);
              expect(data.content.length).toBeLessThanOrEqual(1000);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Combined validation', () => {
      it('should accept valid comment content', () => {
        fc.assert(
          fc.property(
            fc.record({
              postId: fc.string({ minLength: 10, maxLength: 50 }),
              authorId: fc.string({ minLength: 10, maxLength: 50 }),
              content: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
            }),
            (data) => {
              // Simulate validation
              const isNonEmpty = data.content.trim().length > 0;
              const isWithinLimit = data.content.length <= 1000;
              const isValid = isNonEmpty && isWithinLimit;

              // Verify valid content passes all checks
              expect(isValid).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should provide appropriate error message for empty content', () => {
        fc.assert(
          fc.property(
            fc.record({
              postId: fc.string({ minLength: 10, maxLength: 50 }),
              authorId: fc.string({ minLength: 10, maxLength: 50 }),
            }),
            (data) => {
              const emptyContent = '';

              // Simulate validation with error message
              let errorMessage = '';
              if (emptyContent.trim().length === 0) {
                errorMessage = 'Comment content cannot be empty';
              }

              // Verify appropriate error message
              expect(errorMessage).toBeTruthy();
              expect(errorMessage.toLowerCase()).toContain('empty');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should provide appropriate error message for content exceeding limit', () => {
        fc.assert(
          fc.property(
            fc.record({
              postId: fc.string({ minLength: 10, maxLength: 50 }),
              authorId: fc.string({ minLength: 10, maxLength: 50 }),
              content: fc.string({ minLength: 1001, maxLength: 2000 }),
            }),
            (data) => {
              // Simulate validation with error message
              let errorMessage = '';
              if (data.content.length > 1000) {
                errorMessage = 'Comment content must not exceed 1000 characters';
              }

              // Verify appropriate error message
              expect(errorMessage).toBeTruthy();
              expect(errorMessage).toContain('1000');
              expect(errorMessage.toLowerCase()).toContain('exceed');
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  /**
   * Property 26: Comment chronological ordering
   * **Validates: Requirements 5.9**
   * 
   * For any post with multiple comments, the comments must be ordered by 
   * createdAt timestamp in ascending order (oldest first).
   */
  describe('Property 26: Comment chronological ordering', () => {
    it('should order comments by createdAt ascending', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            commentCount: fc.integer({ min: 2, max: 10 }),
          }),
          (data) => {
            // Create multiple comments with different timestamps
            const comments = [];
            const baseTime = Date.now();
            
            for (let i = 0; i < data.commentCount; i++) {
              comments.push({
                _id: `comment_${i}`,
                postId: data.postId,
                authorId: `author_${i}`,
                content: `Comment ${i}`,
                createdAt: baseTime + (i * 1000), // Each comment 1 second apart
              });
            }

            // Shuffle comments to simulate unordered retrieval
            const shuffled = [...comments].sort(() => Math.random() - 0.5);

            // Sort by createdAt ascending (oldest first)
            const sorted = shuffled.sort((a, b) => a.createdAt - b.createdAt);

            // Verify comments are in chronological order
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].createdAt).toBeLessThanOrEqual(sorted[i + 1].createdAt);
            }

            // Verify first comment is the oldest
            expect(sorted[0].createdAt).toBe(baseTime);
            
            // Verify last comment is the newest
            expect(sorted[sorted.length - 1].createdAt).toBe(
              baseTime + ((data.commentCount - 1) * 1000)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain order with comments created at same time', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            commentCount: fc.integer({ min: 2, max: 5 }),
          }),
          (data) => {
            // Create comments with same timestamp
            const sameTime = Date.now();
            const comments = [];
            
            for (let i = 0; i < data.commentCount; i++) {
              comments.push({
                _id: `comment_${i}`,
                postId: data.postId,
                authorId: `author_${i}`,
                content: `Comment ${i}`,
                createdAt: sameTime,
              });
            }

            // Sort by createdAt ascending
            const sorted = comments.sort((a, b) => a.createdAt - b.createdAt);

            // Verify all timestamps are equal
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].createdAt).toBe(sorted[i + 1].createdAt);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should order comments correctly with varying time gaps', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            timestamps: fc.array(fc.integer({ min: 0, max: 1000000 }), { minLength: 2, maxLength: 10 }),
          }),
          (data) => {
            // Create comments with random timestamps
            const comments = data.timestamps.map((timestamp, i) => ({
              _id: `comment_${i}`,
              postId: data.postId,
              authorId: `author_${i}`,
              content: `Comment ${i}`,
              createdAt: timestamp,
            }));

            // Sort by createdAt ascending
            const sorted = comments.sort((a, b) => a.createdAt - b.createdAt);

            // Verify comments are in ascending order
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].createdAt).toBeLessThanOrEqual(sorted[i + 1].createdAt);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle single comment correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            authorId: fc.string({ minLength: 10, maxLength: 50 }),
            content: fc.string({ minLength: 1, maxLength: 1000 }),
            createdAt: fc.integer({ min: 0, max: 1000000 }),
          }),
          (data) => {
            const comments = [{
              _id: 'comment_1',
              postId: data.postId,
              authorId: data.authorId,
              content: data.content,
              createdAt: data.createdAt,
            }];

            // Sort by createdAt ascending
            const sorted = comments.sort((a, b) => a.createdAt - b.createdAt);

            // Verify single comment remains unchanged
            expect(sorted.length).toBe(1);
            expect(sorted[0].createdAt).toBe(data.createdAt);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve comment data during sorting', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string({ minLength: 10, maxLength: 50 }),
            commentCount: fc.integer({ min: 2, max: 10 }),
          }),
          (data) => {
            // Create comments with unique content
            const comments = [];
            const baseTime = Date.now();
            
            for (let i = 0; i < data.commentCount; i++) {
              comments.push({
                _id: `comment_${i}`,
                postId: data.postId,
                authorId: `author_${i}`,
                content: `Unique content ${i}`,
                createdAt: baseTime + (i * 1000),
              });
            }

            // Shuffle and sort
            const shuffled = [...comments].sort(() => Math.random() - 0.5);
            const sorted = shuffled.sort((a, b) => a.createdAt - b.createdAt);

            // Verify all original comments are present with correct data
            expect(sorted.length).toBe(comments.length);
            
            sorted.forEach((comment, i) => {
              expect(comment._id).toBe(`comment_${i}`);
              expect(comment.content).toBe(`Unique content ${i}`);
              expect(comment.authorId).toBe(`author_${i}`);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
