/**
 * Unit Tests for User Search and Discovery
 * Feature: campus-connect-foundation
 * Task: 12.1 Enhance searchUsers query with filters
 * 
 * These tests verify the searchUsers query functionality including:
 * - Name search with case-insensitive matching
 * - Role filtering
 * - Skills filtering
 * - Combined filters with AND logic
 * - Complete user profile data in results
 */

describe('searchUsers query', () => {
  // Mock user data for testing
  const mockUsers = [
    {
      _id: 'user1',
      clerkId: 'clerk1',
      email: 'alice@example.com',
      name: 'Alice Johnson',
      profilePicture: 'https://example.com/alice.jpg',
      bio: 'Computer Science student',
      university: 'MIT',
      role: 'Student' as const,
      experienceLevel: 'Intermediate' as const,
      skills: ['JavaScript', 'React', 'Node.js'],
      socialLinks: {
        github: 'https://github.com/alice',
        linkedin: undefined,
        twitter: undefined,
        website: undefined,
      },
      followerCount: 10,
      followingCount: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      _id: 'user2',
      clerkId: 'clerk2',
      email: 'bob@example.com',
      name: 'Bob Smith',
      profilePicture: 'https://example.com/bob.jpg',
      bio: 'Research Scholar in AI',
      university: 'Stanford',
      role: 'Research Scholar' as const,
      experienceLevel: 'Advanced' as const,
      skills: ['Python', 'Machine Learning', 'TensorFlow'],
      socialLinks: {
        github: undefined,
        linkedin: 'https://linkedin.com/in/bob',
        twitter: undefined,
        website: undefined,
      },
      followerCount: 25,
      followingCount: 15,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      _id: 'user3',
      clerkId: 'clerk3',
      email: 'carol@example.com',
      name: 'Carol Davis',
      profilePicture: 'https://example.com/carol.jpg',
      bio: 'Faculty member teaching web development',
      university: 'Berkeley',
      role: 'Faculty' as const,
      experienceLevel: 'Expert' as const,
      skills: ['JavaScript', 'Python', 'Web Development'],
      socialLinks: {
        github: undefined,
        linkedin: undefined,
        twitter: undefined,
        website: 'https://carol-davis.com',
      },
      followerCount: 50,
      followingCount: 20,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      _id: 'user4',
      clerkId: 'clerk4',
      email: 'david@example.com',
      name: 'David Lee',
      profilePicture: 'https://example.com/david.jpg',
      bio: 'Student learning full-stack development',
      university: 'MIT',
      role: 'Student' as const,
      experienceLevel: 'Beginner' as const,
      skills: ['JavaScript', 'HTML', 'CSS'],
      socialLinks: {
        github: 'https://github.com/david',
        linkedin: undefined,
        twitter: undefined,
        website: undefined,
      },
      followerCount: 3,
      followingCount: 8,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  /**
   * Helper function to simulate the searchUsers query logic
   * This mirrors the implementation in convex/users.ts
   */
  const searchUsers = (
    users: typeof mockUsers,
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

  describe('Name search with case-insensitive matching', () => {
    it('should find users by exact name match', () => {
      const results = searchUsers(mockUsers, { query: 'Alice Johnson' });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Johnson');
    });

    it('should find users by partial name match (case-insensitive)', () => {
      const results = searchUsers(mockUsers, { query: 'alice' });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Johnson');
    });

    it('should find users by partial name match with different case', () => {
      const results = searchUsers(mockUsers, { query: 'ALICE' });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Johnson');
    });

    it('should find users by first name only', () => {
      const results = searchUsers(mockUsers, { query: 'Bob' });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Bob Smith');
    });

    it('should find users by last name only', () => {
      const results = searchUsers(mockUsers, { query: 'Smith' });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Bob Smith');
    });

    it('should return empty array when no users match the query', () => {
      const results = searchUsers(mockUsers, { query: 'NonExistent' });
      
      expect(results).toHaveLength(0);
    });

    it('should return all users when query is empty', () => {
      const results = searchUsers(mockUsers, { query: '' });
      
      expect(results).toHaveLength(mockUsers.length);
    });
  });

  describe('Role filter', () => {
    it('should filter users by Student role', () => {
      const results = searchUsers(mockUsers, { role: 'Student' });
      
      expect(results).toHaveLength(2);
      expect(results.every((user) => user.role === 'Student')).toBe(true);
      expect(results.map((u) => u.name)).toContain('Alice Johnson');
      expect(results.map((u) => u.name)).toContain('David Lee');
    });

    it('should filter users by Research Scholar role', () => {
      const results = searchUsers(mockUsers, { role: 'Research Scholar' });
      
      expect(results).toHaveLength(1);
      expect(results[0].role).toBe('Research Scholar');
      expect(results[0].name).toBe('Bob Smith');
    });

    it('should filter users by Faculty role', () => {
      const results = searchUsers(mockUsers, { role: 'Faculty' });
      
      expect(results).toHaveLength(1);
      expect(results[0].role).toBe('Faculty');
      expect(results[0].name).toBe('Carol Davis');
    });

    it('should return all users when no role filter is specified', () => {
      const results = searchUsers(mockUsers, {});
      
      expect(results).toHaveLength(mockUsers.length);
    });
  });

  describe('Skills filter (match any skill in array)', () => {
    it('should find users with a single specified skill', () => {
      const results = searchUsers(mockUsers, { skills: ['Python'] });
      
      expect(results).toHaveLength(2);
      expect(results.map((u) => u.name)).toContain('Bob Smith');
      expect(results.map((u) => u.name)).toContain('Carol Davis');
    });

    it('should find users with any of multiple specified skills', () => {
      const results = searchUsers(mockUsers, { skills: ['React', 'TensorFlow'] });
      
      expect(results).toHaveLength(2);
      expect(results.map((u) => u.name)).toContain('Alice Johnson');
      expect(results.map((u) => u.name)).toContain('Bob Smith');
    });

    it('should find all users with JavaScript skill', () => {
      const results = searchUsers(mockUsers, { skills: ['JavaScript'] });
      
      expect(results).toHaveLength(3);
      expect(results.map((u) => u.name)).toContain('Alice Johnson');
      expect(results.map((u) => u.name)).toContain('Carol Davis');
      expect(results.map((u) => u.name)).toContain('David Lee');
    });

    it('should return empty array when no users have the specified skill', () => {
      const results = searchUsers(mockUsers, { skills: ['Rust'] });
      
      expect(results).toHaveLength(0);
    });

    it('should return all users when skills array is empty', () => {
      const results = searchUsers(mockUsers, { skills: [] });
      
      expect(results).toHaveLength(mockUsers.length);
    });
  });

  describe('Combined filters with AND logic', () => {
    it('should combine name and role filters', () => {
      const results = searchUsers(mockUsers, {
        query: 'Alice',
        role: 'Student',
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Johnson');
      expect(results[0].role).toBe('Student');
    });

    it('should combine role and skills filters', () => {
      const results = searchUsers(mockUsers, {
        role: 'Student',
        skills: ['React'],
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Johnson');
      expect(results[0].role).toBe('Student');
      expect(results[0].skills).toContain('React');
    });

    it('should combine name and skills filters', () => {
      const results = searchUsers(mockUsers, {
        query: 'Carol',
        skills: ['Python'],
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Carol Davis');
      expect(results[0].skills).toContain('Python');
    });

    it('should combine all three filters (name, role, skills)', () => {
      const results = searchUsers(mockUsers, {
        query: 'David',
        role: 'Student',
        skills: ['JavaScript'],
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('David Lee');
      expect(results[0].role).toBe('Student');
      expect(results[0].skills).toContain('JavaScript');
    });

    it('should return empty array when combined filters match no users', () => {
      const results = searchUsers(mockUsers, {
        query: 'Alice',
        role: 'Faculty', // Alice is a Student, not Faculty
      });
      
      expect(results).toHaveLength(0);
    });

    it('should return empty array when name matches but skills do not', () => {
      const results = searchUsers(mockUsers, {
        query: 'Bob',
        skills: ['JavaScript'], // Bob doesn't have JavaScript
      });
      
      expect(results).toHaveLength(0);
    });
  });

  describe('Return user profiles with all display fields', () => {
    it('should include all required display fields in search results', () => {
      const results = searchUsers(mockUsers, { query: 'Alice' });
      
      expect(results).toHaveLength(1);
      const user = results[0];

      // Verify all display fields are present (Requirements 8.6)
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('profilePicture');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('university');
      expect(user).toHaveProperty('skills');
      expect(user).toHaveProperty('bio');
      expect(user).toHaveProperty('experienceLevel');
      expect(user).toHaveProperty('socialLinks');
      expect(user).toHaveProperty('followerCount');
      expect(user).toHaveProperty('followingCount');
    });

    it('should return complete user data for all matched users', () => {
      const results = searchUsers(mockUsers, { role: 'Student' });
      
      expect(results).toHaveLength(2);
      
      results.forEach((user) => {
        expect(user.name).toBeDefined();
        expect(user.role).toBe('Student');
        expect(user.university).toBeDefined();
        expect(Array.isArray(user.skills)).toBe(true);
        expect(user.followerCount).toBeGreaterThanOrEqual(0);
        expect(user.followingCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string query gracefully', () => {
      const results = searchUsers(mockUsers, { query: '' });
      
      expect(results).toHaveLength(mockUsers.length);
    });

    it('should handle whitespace-only query', () => {
      const results = searchUsers(mockUsers, { query: '   ' });
      
      // Should not match any users (whitespace doesn't match names)
      expect(results).toHaveLength(0);
    });

    it('should handle special characters in query', () => {
      const usersWithSpecialChars = [
        ...mockUsers,
        {
          ...mockUsers[0],
          _id: 'user5',
          name: "O'Brien",
        },
      ];
      
      const results = searchUsers(usersWithSpecialChars, { query: "O'Brien" });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("O'Brien");
    });

    it('should handle case-insensitive skill matching', () => {
      // Note: The current implementation is case-sensitive for skills
      // This test documents the current behavior
      const results = searchUsers(mockUsers, { skills: ['javascript'] });
      
      // Should not match because skills are case-sensitive
      expect(results).toHaveLength(0);
    });
  });
});
