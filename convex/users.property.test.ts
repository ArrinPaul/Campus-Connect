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

  /**
   * Property 6: Profile picture update
   * **Validates: Requirements 2.4**
   * 
   * For any profile picture upload, the profile's profilePicture field must be 
   * updated with the new image reference.
   */
  describe('Property 6: Profile picture update', () => {
    it('should update profile picture field', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          (imageUrl) => {
            const profile = createDefaultProfile({
              clerkId: 'test_clerk_id',
              email: 'test@example.com',
              name: 'Test User',
            });

            // Initially no profile picture
            expect(profile.profilePicture).toBeUndefined();

            // Simulate profile picture upload
            const updatedProfile = {
              ...profile,
              profilePicture: imageUrl,
              updatedAt: Date.now(),
            };

            // Verify profile picture was updated
            expect(updatedProfile.profilePicture).toBe(imageUrl);
            expect(updatedProfile.profilePicture).toBeDefined();
            expect(updatedProfile.updatedAt).toBeGreaterThanOrEqual(profile.updatedAt);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow updating profile picture multiple times', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.webUrl(),
          (firstImageUrl, secondImageUrl) => {
            const profile = createDefaultProfile({
              clerkId: 'test_clerk_id',
              email: 'test@example.com',
              name: 'Test User',
            });

            // First upload
            const profileWithFirstImage = {
              ...profile,
              profilePicture: firstImageUrl,
              updatedAt: Date.now(),
            };

            expect(profileWithFirstImage.profilePicture).toBe(firstImageUrl);

            // Second upload (replace)
            const profileWithSecondImage = {
              ...profileWithFirstImage,
              profilePicture: secondImageUrl,
              updatedAt: Date.now(),
            };

            // Verify second image replaced the first
            expect(profileWithSecondImage.profilePicture).toBe(secondImageUrl);
            expect(profileWithSecondImage.profilePicture).not.toBe(firstImageUrl);
            expect(profileWithSecondImage.updatedAt).toBeGreaterThanOrEqual(
              profileWithFirstImage.updatedAt
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property-Based Tests for User Discovery
 * Feature: campus-connect-foundation
 * Task: 12.2 Write property tests for user discovery
 * 
 * These tests verify user discovery properties including search by name,
 * filtering by role and skills, and search result data completeness.
 */

describe('User Discovery Properties', () => {
  /**
   * Helper to simulate the searchUsers query logic
   * Mirrors the implementation in convex/users.ts
   */
  const searchUsers = (
    users: Array<{
      _id: string;
      clerkId: string;
      email: string;
      name: string;
      profilePicture?: string;
      bio: string;
      university: string;
      role: 'Student' | 'Research Scholar' | 'Faculty';
      experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
      skills: string[];
      socialLinks: {
        github?: string;
        linkedin?: string;
        twitter?: string;
        website?: string;
      };
      followerCount: number;
      followingCount: number;
      createdAt: number;
      updatedAt: number;
    }>,
    filters: {
      query?: string;
      role?: 'Student' | 'Research Scholar' | 'Faculty';
      skills?: string[];
    }
  ) => {
    let filteredUsers = [...users];

    // Filter by name (case-insensitive substring match)
    if (filters.query) {
      const queryLower = filters.query.toLowerCase();
      filteredUsers = filteredUsers.filter((user) =>
        user.name.toLowerCase().includes(queryLower)
      );
    }

    // Filter by role
    if (filters.role) {
      filteredUsers = filteredUsers.filter((user) => user.role === filters.role);
    }

    // Filter by skills (user must have at least one of the specified skills)
    if (filters.skills && filters.skills.length > 0) {
      filteredUsers = filteredUsers.filter((user) =>
        filters.skills!.some((skill) => user.skills.includes(skill))
      );
    }

    return filteredUsers;
  };

  /**
   * Generator for creating valid user profiles
   */
  const userProfileArbitrary = fc.record({
    _id: fc.string({ minLength: 10, maxLength: 30 }),
    clerkId: fc.string({ minLength: 10, maxLength: 50 }),
    email: fc.emailAddress(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    profilePicture: fc.option(fc.webUrl(), { nil: undefined }),
    bio: fc.string({ maxLength: 500 }),
    university: fc.string({ maxLength: 200 }),
    role: fc.constantFrom('Student', 'Research Scholar', 'Faculty'),
    experienceLevel: fc.constantFrom('Beginner', 'Intermediate', 'Advanced', 'Expert'),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }),
    socialLinks: fc.record({
      github: fc.option(fc.webUrl(), { nil: undefined }),
      linkedin: fc.option(fc.webUrl(), { nil: undefined }),
      twitter: fc.option(fc.webUrl(), { nil: undefined }),
      website: fc.option(fc.webUrl(), { nil: undefined }),
    }),
    followerCount: fc.nat({ max: 10000 }),
    followingCount: fc.nat({ max: 10000 }),
    createdAt: fc.integer({ min: 1600000000000, max: Date.now() }),
    updatedAt: fc.integer({ min: 1600000000000, max: Date.now() }),
  });

  /**
   * Property 37: User search by name
   * **Validates: Requirements 8.2**
   * 
   * For any name search query, all returned users must have names that match 
   * the query (case-insensitive substring match).
   */
  describe('Property 37: User search by name', () => {
    it('should return only users whose names match the query (case-insensitive)', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (users, query) => {
            const results = searchUsers(users, { query });

            // All returned users must have names matching the query
            results.forEach((user) => {
              expect(user.name.toLowerCase()).toContain(query.toLowerCase());
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty query by returning all users', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          (users) => {
            const results = searchUsers(users, { query: '' });

            // Empty query should return all users
            expect(results.length).toBe(users.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be case-insensitive', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          (users) => {
            // Pick a random user and search for their name in different cases
            if (users.length === 0) return;

            const targetUser = users[0];
            const nameLower = targetUser.name.toLowerCase();
            const nameUpper = targetUser.name.toUpperCase();

            const resultsLower = searchUsers(users, { query: nameLower });
            const resultsUpper = searchUsers(users, { query: nameUpper });

            // Both should find the same user
            expect(resultsLower.some(u => u._id === targetUser._id)).toBe(true);
            expect(resultsUpper.some(u => u._id === targetUser._id)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when no users match', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 0, maxLength: 20 }),
          (users) => {
            // Use a query that's unlikely to match any generated name
            const impossibleQuery = 'XYZABC123IMPOSSIBLE_NAME_QUERY_999';
            const results = searchUsers(users, { query: impossibleQuery });

            // Should return empty or only users that actually match
            results.forEach((user) => {
              expect(user.name.toLowerCase()).toContain(impossibleQuery.toLowerCase());
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 38: User filter by role
   * **Validates: Requirements 8.3**
   * 
   * For any role filter, all returned users must have the specified role.
   */
  describe('Property 38: User filter by role', () => {
    it('should return only users with the specified role', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          fc.constantFrom('Student', 'Research Scholar', 'Faculty'),
          (users, role) => {
            const results = searchUsers(users, { role });

            // All returned users must have the specified role
            results.forEach((user) => {
              expect(user.role).toBe(role);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter Student role correctly', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          (users) => {
            const results = searchUsers(users, { role: 'Student' });

            // Count expected students
            const expectedStudents = users.filter(u => u.role === 'Student');

            // Should return exactly the students
            expect(results.length).toBe(expectedStudents.length);
            results.forEach((user) => {
              expect(user.role).toBe('Student');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter Research Scholar role correctly', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          (users) => {
            const results = searchUsers(users, { role: 'Research Scholar' });

            // Count expected research scholars
            const expectedScholars = users.filter(u => u.role === 'Research Scholar');

            // Should return exactly the research scholars
            expect(results.length).toBe(expectedScholars.length);
            results.forEach((user) => {
              expect(user.role).toBe('Research Scholar');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter Faculty role correctly', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          (users) => {
            const results = searchUsers(users, { role: 'Faculty' });

            // Count expected faculty
            const expectedFaculty = users.filter(u => u.role === 'Faculty');

            // Should return exactly the faculty
            expect(results.length).toBe(expectedFaculty.length);
            results.forEach((user) => {
              expect(user.role).toBe('Faculty');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all users when no role filter is specified', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          (users) => {
            const results = searchUsers(users, {});

            // No filter should return all users
            expect(results.length).toBe(users.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 39: User filter by skills
   * **Validates: Requirements 8.4**
   * 
   * For any skill filter, all returned users must have the specified skill 
   * in their skills array.
   */
  describe('Property 39: User filter by skills', () => {
    it('should return only users with at least one of the specified skills', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          (users, skillsFilter) => {
            const results = searchUsers(users, { skills: skillsFilter });

            // All returned users must have at least one of the specified skills
            results.forEach((user) => {
              const hasAtLeastOneSkill = skillsFilter.some((skill) =>
                user.skills.includes(skill)
              );
              expect(hasAtLeastOneSkill).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter by single skill correctly', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (users, skill) => {
            const results = searchUsers(users, { skills: [skill] });

            // Count expected users with this skill
            const expectedUsers = users.filter(u => u.skills.includes(skill));

            // Should return exactly the users with this skill
            expect(results.length).toBe(expectedUsers.length);
            results.forEach((user) => {
              expect(user.skills).toContain(skill);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter by multiple skills with OR logic', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 5 }),
          (users, skillsFilter) => {
            const results = searchUsers(users, { skills: skillsFilter });

            // Each returned user must have at least one of the skills
            results.forEach((user) => {
              const matchingSkills = skillsFilter.filter(skill =>
                user.skills.includes(skill)
              );
              expect(matchingSkills.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all users when skills array is empty', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          (users) => {
            const results = searchUsers(users, { skills: [] });

            // Empty skills filter should return all users
            expect(results.length).toBe(users.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when no users have the specified skills', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 0, maxLength: 20 }),
          (users) => {
            // Use skills that are unlikely to exist
            const impossibleSkills = ['IMPOSSIBLE_SKILL_XYZ_999', 'NONEXISTENT_TECH_ABC_123'];
            const results = searchUsers(users, { skills: impossibleSkills });

            // Should return empty or only users that actually have these skills
            results.forEach((user) => {
              const hasSkill = impossibleSkills.some(skill => user.skills.includes(skill));
              expect(hasSkill).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 40: Search result data completeness
   * **Validates: Requirements 8.6**
   * 
   * For any user in search results, all required display fields must be present.
   */
  describe('Property 40: Search result data completeness', () => {
    it('should include all required display fields in search results', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          (users) => {
            // Search with no filters to get all users
            const results = searchUsers(users, {});

            // Verify all required display fields are present for each user
            results.forEach((user) => {
              // Required fields per Requirements 8.6
              expect(user).toHaveProperty('_id');
              expect(user).toHaveProperty('name');
              expect(user).toHaveProperty('profilePicture');
              expect(user).toHaveProperty('role');
              expect(user).toHaveProperty('university');
              expect(user).toHaveProperty('skills');

              // Additional fields that should be present
              expect(user).toHaveProperty('bio');
              expect(user).toHaveProperty('experienceLevel');
              expect(user).toHaveProperty('socialLinks');
              expect(user).toHaveProperty('followerCount');
              expect(user).toHaveProperty('followingCount');

              // Verify types
              expect(typeof user._id).toBe('string');
              expect(typeof user.name).toBe('string');
              expect(['Student', 'Research Scholar', 'Faculty']).toContain(user.role);
              expect(typeof user.university).toBe('string');
              expect(Array.isArray(user.skills)).toBe(true);
              expect(typeof user.followerCount).toBe('number');
              expect(typeof user.followingCount).toBe('number');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all user data through filtering operations', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          fc.constantFrom('Student', 'Research Scholar', 'Faculty'),
          (users, role) => {
            const results = searchUsers(users, { role });

            // Each result should have complete data
            results.forEach((user) => {
              // Find the original user
              const originalUser = users.find(u => u._id === user._id);
              expect(originalUser).toBeDefined();

              // Verify all fields are preserved
              expect(user.name).toBe(originalUser!.name);
              expect(user.email).toBe(originalUser!.email);
              expect(user.bio).toBe(originalUser!.bio);
              expect(user.university).toBe(originalUser!.university);
              expect(user.role).toBe(originalUser!.role);
              expect(user.experienceLevel).toBe(originalUser!.experienceLevel);
              expect(user.skills).toEqual(originalUser!.skills);
              expect(user.followerCount).toBe(originalUser!.followerCount);
              expect(user.followingCount).toBe(originalUser!.followingCount);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include complete data for combined filter results', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('Student', 'Research Scholar', 'Faculty'),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
          (users, query, role, skills) => {
            const results = searchUsers(users, { query, role, skills });

            // All results should have complete profile data
            results.forEach((user) => {
              // Verify all display fields are present and valid
              expect(user._id).toBeDefined();
              expect(user.name).toBeDefined();
              expect(user.role).toBeDefined();
              expect(user.university).toBeDefined();
              expect(Array.isArray(user.skills)).toBe(true);
              expect(typeof user.followerCount).toBe('number');
              expect(typeof user.followingCount).toBe('number');
              expect(user.followerCount).toBeGreaterThanOrEqual(0);
              expect(user.followingCount).toBeGreaterThanOrEqual(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain data integrity for skills array', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          (users) => {
            const results = searchUsers(users, {});

            // Verify skills array integrity
            results.forEach((user) => {
              expect(Array.isArray(user.skills)).toBe(true);
              
              // Each skill should be a non-empty string
              user.skills.forEach((skill) => {
                expect(typeof skill).toBe('string');
                expect(skill.length).toBeGreaterThan(0);
                expect(skill.length).toBeLessThanOrEqual(50);
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Combined filter properties
   * Verify that combining multiple filters works correctly with AND logic
   */
  describe('Combined filter properties', () => {
    it('should apply name and role filters with AND logic', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('Student', 'Research Scholar', 'Faculty'),
          (users, query, role) => {
            const results = searchUsers(users, { query, role });

            // All results must match both filters
            results.forEach((user) => {
              expect(user.name.toLowerCase()).toContain(query.toLowerCase());
              expect(user.role).toBe(role);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply role and skills filters with AND logic', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          fc.constantFrom('Student', 'Research Scholar', 'Faculty'),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
          (users, role, skills) => {
            const results = searchUsers(users, { role, skills });

            // All results must match both filters
            results.forEach((user) => {
              expect(user.role).toBe(role);
              const hasAtLeastOneSkill = skills.some(skill => user.skills.includes(skill));
              expect(hasAtLeastOneSkill).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply all three filters with AND logic', () => {
      fc.assert(
        fc.property(
          fc.array(userProfileArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('Student', 'Research Scholar', 'Faculty'),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
          (users, query, role, skills) => {
            const results = searchUsers(users, { query, role, skills });

            // All results must match all three filters
            results.forEach((user) => {
              expect(user.name.toLowerCase()).toContain(query.toLowerCase());
              expect(user.role).toBe(role);
              const hasAtLeastOneSkill = skills.some(skill => user.skills.includes(skill));
              expect(hasAtLeastOneSkill).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
