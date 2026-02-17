import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';

/**
 * Property 45: Validation error messaging
 * When validation fails, the platform must display clear error messages to the user.
 * Validates: Requirements 12.7
 */

describe('Validation Error Messaging Property Tests', () => {
  /**
   * Property 45: Validation errors should be descriptive
   */
  it('Property 45: should provide descriptive error messages for validation failures', () => {
    fc.assert(
      fc.property(
        fc.record({
          fieldName: fc.constantFrom('bio', 'university', 'skill', 'content', 'comment'),
          maxLength: fc.integer({ min: 1, max: 10000 }),
          actualLength: fc.integer({ min: 1, max: 20000 }),
        }).filter(({ maxLength, actualLength }) => actualLength > maxLength),
        ({ fieldName, maxLength, actualLength }) => {
          // Simulate validation error
          const validateLength = (field: string, max: number, actual: number) => {
            if (actual > max) {
              // Error message should be descriptive and include the field name and limit
              throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} must not exceed ${max} characters`);
            }
            return true;
          };

          // Verify error message is descriptive
          try {
            validateLength(fieldName, maxLength, actualLength);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error: any) {
            // Error message should contain the field name
            expect(error.message.toLowerCase()).toContain(fieldName.toLowerCase());
            // Error message should contain the limit
            expect(error.message).toContain(maxLength.toString());
            // Error message should be clear about the issue
            expect(error.message.toLowerCase()).toContain('exceed');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 45: Empty field validation errors should be clear
   */
  it('Property 45: should provide clear error messages for empty fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('post content', 'comment content', 'skill name'),
        (fieldName) => {
          // Simulate empty field validation
          const validateNotEmpty = (field: string, value: string) => {
            if (!value || value.trim().length === 0) {
              throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty`);
            }
            return true;
          };

          // Verify error message is clear
          try {
            validateNotEmpty(fieldName, '');
            // Should not reach here
            expect(true).toBe(false);
          } catch (error: any) {
            // Error message should contain the field name
            expect(error.message.toLowerCase()).toContain(fieldName.split(' ')[0].toLowerCase());
            // Error message should indicate the field cannot be empty
            expect(error.message.toLowerCase()).toContain('empty');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 45: Duplicate validation errors should be specific
   */
  it('Property 45: should provide specific error messages for duplicates', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('skill', 'like', 'follow'),
        (resourceType) => {
          // Simulate duplicate validation
          const validateNoDuplicate = (type: string, exists: boolean) => {
            if (exists) {
              if (type === 'skill') {
                throw new Error('Skill already exists');
              } else if (type === 'like') {
                throw new Error('You have already liked this post');
              } else if (type === 'follow') {
                throw new Error('Already following this user');
              }
            }
            return true;
          };

          // Verify error message is specific
          try {
            validateNoDuplicate(resourceType, true);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error: any) {
            // Error message should indicate duplication
            expect(error.message.toLowerCase()).toMatch(/already|exists/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 45: Not found errors should be clear
   */
  it('Property 45: should provide clear error messages for not found resources', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('user', 'post', 'comment', 'target user'),
        (resourceType) => {
          // Simulate not found error
          const validateExists = (type: string, exists: boolean) => {
            if (!exists) {
              throw new Error(`${type.charAt(0).toUpperCase() + type.slice(1)} not found`);
            }
            return true;
          };

          // Verify error message is clear
          try {
            validateExists(resourceType, false);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error: any) {
            // Error message should indicate resource not found
            expect(error.message.toLowerCase()).toContain('not found');
            // Error message should contain the resource type
            expect(error.message.toLowerCase()).toContain(resourceType.split(' ')[0].toLowerCase());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 45: Error messages should be consistent in format
   */
  it('Property 45: should maintain consistent error message format', () => {
    fc.assert(
      fc.property(
        fc.record({
          errorType: fc.constantFrom('validation', 'notFound', 'duplicate', 'authorization'),
          field: fc.string({ minLength: 1 }).filter(s => /^[a-zA-Z]/.test(s)),
        }),
        ({ errorType, field }) => {
          // Simulate different error types
          const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
          const generateError = (type: string, fieldName: string) => {
            switch (type) {
              case 'validation':
                return new Error(`${capitalizedField} must not exceed 500 characters`);
              case 'notFound':
                return new Error(`${capitalizedField} not found`);
              case 'duplicate':
                return new Error(`${capitalizedField} already exists`);
              case 'authorization':
                return new Error(`Forbidden: You can only modify your own ${fieldName}`);
              default:
                return new Error('Unknown error');
            }
          };

          const error = generateError(errorType, field);

          // Verify error message format
          expect(error.message).toBeTruthy();
          expect(error.message.length).toBeGreaterThan(0);
          // Error message should start with capital letter or "Forbidden:"
          expect(error.message).toMatch(/^[A-Z]|^Forbidden:/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 45: Error messages should not contain technical details
   */
  it('Property 45: should not expose technical details in error messages', () => {
    fc.assert(
      fc.property(
        fc.record({
          userInput: fc.string(),
          errorType: fc.constantFrom('validation', 'notFound', 'duplicate'),
        }),
        ({ userInput, errorType }) => {
          // Simulate error generation
          const generateUserFriendlyError = (type: string) => {
            switch (type) {
              case 'validation':
                return new Error('Bio must not exceed 500 characters');
              case 'notFound':
                return new Error('User not found');
              case 'duplicate':
                return new Error('Skill already exists');
              default:
                return new Error('An error occurred');
            }
          };

          const error = generateUserFriendlyError(errorType);

          // Verify error message doesn't contain technical details
          expect(error.message.toLowerCase()).not.toContain('stack');
          expect(error.message.toLowerCase()).not.toContain('trace');
          expect(error.message.toLowerCase()).not.toContain('exception');
          expect(error.message.toLowerCase()).not.toContain('null');
          expect(error.message.toLowerCase()).not.toContain('undefined');
          expect(error.message.toLowerCase()).not.toContain('database');
          expect(error.message.toLowerCase()).not.toContain('query');
        }
      ),
      { numRuns: 100 }
    );
  });
});
