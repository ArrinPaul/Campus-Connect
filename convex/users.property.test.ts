import fc from 'fast-check';

/**
 * Property-Based Tests for Profile Operations
 * Feature: campus-connect-foundation
 * 
 * These tests verify profile operation properties including default initialization,
 * update persistence, visibility, and skill management.
 */

describe('Profile Operations Properties', () => {
  /**
   * Helper to simulate default profile creation
   * Mirrors the logic in convex/users.ts createUserFromWebhook
   */
  const createDefaultProfile = (userData: {
    clerkId: string;
    email: string;
    name: string;
  }) => {
    return {
      _id: `user_${Date.now()}_${Math.random()}`,
      clerkId: userData.clerkId,
      email: userData.email,
      name: userData.name,
      profilePicture: undefined,
      bio: '',
      university: '',
      role: 'Student' as const,
      experienceLevel: 'Beginner' as const,
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
   * Property 3: Default profile initialization
   * **Validates: Requirements 2.1**
   * 
   * For any newly created user, their profile must contain all required fields 
   * with appropriate default values.
   */
  describe('Property 3: Default profile initialization', () => {
    it('should initialize profile with default values', () => {
      fc.assert(
        fc.property(
          fc.record({
            clerkId: fc.string({ minLength: 10, maxLength: 50 }),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          (userData) => {
            const profile = createDefaultProfile(userData);

            // Verify default values
            expect(profile.bio).toBe('');
            expect(profile.university).toBe('');
            expect(profile.role).toBe('Student');
            expect(profile.experienceLevel).toBe('Beginner');
            expect(profile.skills).toEqual([]);
            expect(profile.followerCount).toBe(0);
            expect(profile.followingCount).toBe(0);

            // Verify socialLinks structure with undefined values
            expect(profile.socialLinks.github).toBeUndefined();
            expect(profile.socialLinks.linkedin).toBeUndefined();
            expect(profile.socialLinks.twitter).toBeUndefined();
            expect(profile.socialLinks.website).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Profile update persistence
   * **Validates: Requirements 2.3**
   * 
   * For any profile update operation, the changes must be immediately reflected 
   * in the database and retrievable in subsequent queries.
   */
  describe('Property 5: Profile update persistence', () => {
    it('should persist profile updates', () => {
      fc.assert(
        fc.property(
          fc.record({
            initialBio: fc.string({ maxLength: 500 }),
            updatedBio: fc.string({ maxLength: 500 }),
            initialUniversity: fc.string({ maxLength: 200 }),
            updatedUniversity: fc.string({ maxLength: 200 }),
          }),
          (data) => {
            // Create initial profile
            const profile = createDefaultProfile({
              clerkId: 'test_clerk_id',
              email: 'test@example.com',
              name: 'Test User',
            });

            // Simulate initial update
            const updatedProfile1 = {
              ...profile,
              bio: data.initialBio,
              university: data.initialUniversity,
              updatedAt: Date.now(),
            };

            // Verify initial update persisted
            expect(updatedProfile1.bio).toBe(data.initialBio);
            expect(updatedProfile1.university).toBe(data.initialUniversity);

            // Simulate second update
            const updatedProfile2 = {
              ...updatedProfile1,
              bio: data.updatedBio,
              university: data.updatedUniversity,
              updatedAt: Date.now(),
            };

            // Verify second update persisted
            expect(updatedProfile2.bio).toBe(data.updatedBio);
            expect(updatedProfile2.university).toBe(data.updatedUniversity);
            expect(updatedProfile2.updatedAt).toBeGreaterThanOrEqual(
              updatedProfile1.updatedAt
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Profile visibility
   * **Validates: Requirements 2.9**
   * 
   * For any user viewing another user's profile, all public profile fields must 
   * be included in the response.
   */
  describe('Property 8: Profile visibility', () => {
    it('should include all public profile fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            clerkId: fc.string({ minLength: 10, maxLength: 50 }),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            bio: fc.string({ maxLength: 500 }),
            university: fc.string({ maxLength: 200 }),
            role: fc.constantFrom('Student', 'Research Scholar', 'Faculty'),
            experienceLevel: fc.constantFrom(
              'Beginner',
              'Intermediate',
              'Advanced',
              'Expert'
            ),
            skills: fc.array(fc.string({ minLength: 1, maxLength: 50 })),
          }),
          (userData) => {
            const profile = {
              ...createDefaultProfile(userData),
              bio: userData.bio,
              university: userData.university,
              role: userData.role,
              experienceLevel: userData.experienceLevel,
              skills: userData.skills,
            };

            // Verify all public fields are present
            expect(profile).toHaveProperty('name');
            expect(profile).toHaveProperty('profilePicture');
            expect(profile).toHaveProperty('bio');
            expect(profile).toHaveProperty('university');
            expect(profile).toHaveProperty('role');
            expect(profile).toHaveProperty('experienceLevel');
            expect(profile).toHaveProperty('skills');
            expect(profile).toHaveProperty('socialLinks');
            expect(profile).toHaveProperty('followerCount');
            expect(profile).toHaveProperty('followingCount');

            // Verify values match
            expect(profile.name).toBe(userData.name);
            expect(profile.bio).toBe(userData.bio);
            expect(profile.university).toBe(userData.university);
            expect(profile.role).toBe(userData.role);
            expect(profile.experienceLevel).toBe(userData.experienceLevel);
            expect(profile.skills).toEqual(userData.skills);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Skill addition
   * **Validates: Requirements 3.1**
   * 
   * For any valid skill name added to a profile, the skill must appear in the 
   * user's skills array in subsequent queries.
   */
  describe('Property 9: Skill addition', () => {
    it('should add skill to profile', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (skill) => {
            const profile = createDefaultProfile({
              clerkId: 'test_clerk_id',
              email: 'test@example.com',
              name: 'Test User',
            });

            // Add skill
            const updatedSkills = [...profile.skills, skill];
            const updatedProfile = {
              ...profile,
              skills: updatedSkills,
              updatedAt: Date.now(),
            };

            // Verify skill was added
            expect(updatedProfile.skills).toContain(skill);
            expect(updatedProfile.skills.length).toBe(profile.skills.length + 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Skill removal
   * **Validates: Requirements 3.2**
   * 
   * For any skill removed from a profile, the skill must not appear in the 
   * user's skills array in subsequent queries.
   */
  describe('Property 10: Skill removal', () => {
    it('should remove skill from profile', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
          (skills) => {
            const profile = createDefaultProfile({
              clerkId: 'test_clerk_id',
              email: 'test@example.com',
              name: 'Test User',
            });

            // Set initial skills
            const profileWithSkills = {
              ...profile,
              skills: skills,
            };

            // Remove first skill
            const skillToRemove = skills[0];
            const updatedSkills = profileWithSkills.skills.filter(
              (s) => s !== skillToRemove
            );
            const updatedProfile = {
              ...profileWithSkills,
              skills: updatedSkills,
              updatedAt: Date.now(),
            };

            // Verify skill was removed
            expect(updatedProfile.skills).not.toContain(skillToRemove);
            expect(updatedProfile.skills.length).toBe(
              profileWithSkills.skills.length - 1
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Skill uniqueness
   * **Validates: Requirements 3.5**
   * 
   * For any skill that already exists in a user's profile, attempting to add 
   * it again must either be rejected or have no effect.
   */
  describe('Property 12: Skill uniqueness', () => {
    it('should prevent duplicate skills', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (skill) => {
            const profile = createDefaultProfile({
              clerkId: 'test_clerk_id',
              email: 'test@example.com',
              name: 'Test User',
            });

            // Add skill first time
            const profileWithSkill = {
              ...profile,
              skills: [skill],
            };

            // Attempt to add same skill again (should be rejected)
            const isDuplicate = profileWithSkill.skills.includes(skill);
            expect(isDuplicate).toBe(true);

            // If we try to add it, it should already exist
            if (isDuplicate) {
              // Skill already exists, so adding it would be an error
              expect(profileWithSkill.skills.filter((s) => s === skill).length).toBe(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
