import fc from 'fast-check';
import {
  validateBio,
  validateUniversity,
  validateRole,
  validateExperienceLevel,
  validateSkill,
} from './validations';

/**
 * Property-Based Tests for Profile Validation
 * Feature: campus-connect-foundation
 * 
 * These tests verify validation properties for profile fields and skills.
 */

describe('Profile Validation Properties', () => {
  /**
   * Property 7: Profile field validation
   * **Validates: Requirements 2.5, 2.6, 2.7, 2.8**
   * 
   * For any profile update, the following validation rules must be enforced:
   * - Bio text must not exceed 500 characters
   * - University name must not exceed 200 characters
   * - Role must be one of: "Student", "Research Scholar", or "Faculty"
   * - Experience level must be one of: "Beginner", "Intermediate", "Advanced", or "Expert"
   */
  describe('Property 7: Profile field validation', () => {
    it('should reject bio text exceeding 500 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 501, maxLength: 1000 }),
          (longBio) => {
            const result = validateBio(longBio);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('500');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept bio text up to 500 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 500 }),
          (bio) => {
            const result = validateBio(bio);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject university name exceeding 200 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 201, maxLength: 500 }),
          (longUniversity) => {
            const result = validateUniversity(longUniversity);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('200');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept university name up to 200 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 200 }),
          (university) => {
            const result = validateUniversity(university);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid role values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Student', 'Research Scholar', 'Faculty'),
          (role) => {
            const result = validateRole(role);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid role values', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['Student', 'Research Scholar', 'Faculty'].includes(s)),
          (invalidRole) => {
            const result = validateRole(invalidRole);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid experience level values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Beginner', 'Intermediate', 'Advanced', 'Expert'),
          (level) => {
            const result = validateExperienceLevel(level);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid experience level values', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(s)),
          (invalidLevel) => {
            const result = validateExperienceLevel(invalidLevel);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Skill validation
   * **Validates: Requirements 3.3, 3.4**
   * 
   * For any skill addition, the following validation rules must be enforced:
   * - Skill name must not be empty
   * - Skill name must not exceed 50 characters
   */
  describe('Property 11: Skill validation', () => {
    it('should reject empty skill names', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\t', '\n'),
          (emptySkill) => {
            const result = validateSkill(emptySkill);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('empty');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject skill names exceeding 50 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 51, maxLength: 100 }),
          (longSkill) => {
            const result = validateSkill(longSkill);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('50');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid skill names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (skill) => {
            const result = validateSkill(skill);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
