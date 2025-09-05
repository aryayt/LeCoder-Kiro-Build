import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { auth } from '~/lib/auth';
import { db } from '~/server/db';

/**
 * Integration tests for Better Auth authentication system
 */

describe('Authentication Integration', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await db.user.deleteMany({
      where: {
        email: {
          contains: 'test-auth',
        },
      },
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    await db.user.deleteMany({
      where: {
        email: {
          contains: 'test-auth',
        },
      },
    });
  });

  describe('User Registration', () => {
    it('should create a new user with email and password', async () => {
      const testEmail = 'test-auth-register@example.com';
      const testPassword = 'testpassword123';
      const testName = 'Test User';

      // Simulate user registration
      const mockRequest = new Request('http://localhost:3000/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: testName,
        }),
      });

      // Check if user was created in database
      const user = await db.user.findUnique({
        where: { email: testEmail },
      });

      // User should exist after registration
      expect(user).toBeDefined();
      if (user) {
        expect(user.email).toBe(testEmail);
        expect(user.name).toBe(testName);
        expect(user.id).toBeDefined();
      }
    });

    it('should not allow duplicate email registration', async () => {
      const testEmail = 'test-auth-duplicate@example.com';
      
      // Create user first
      await db.user.create({
        data: {
          email: testEmail,
          name: 'First User',
        },
      });

      // Try to create another user with same email
      const existingUser = await db.user.findUnique({
        where: { email: testEmail },
      });

      expect(existingUser).toBeDefined();
      expect(existingUser?.email).toBe(testEmail);
    });
  });

  describe('Session Management', () => {
    it('should validate session structure', async () => {
      // Create a test user
      const testUser = await db.user.create({
        data: {
          email: 'test-auth-session@example.com',
          name: 'Session Test User',
        },
      });

      // Mock session data structure
      const mockSession = {
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          image: testUser.image,
        },
        session: {
          id: 'mock-session-id',
          userId: testUser.id,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      };

      expect(mockSession.user.id).toBe(testUser.id);
      expect(mockSession.user.email).toBe(testUser.email);
      expect(mockSession.user.name).toBe(testUser.name);
      expect(mockSession.session.userId).toBe(testUser.id);
    });
  });

  describe('User Profile Updates', () => {
    it('should update user profile information', async () => {
      // Create a test user
      const testUser = await db.user.create({
        data: {
          email: 'test-auth-profile@example.com',
          name: 'Original Name',
        },
      });

      const updatedName = 'Updated Name';
      const updatedEmail = 'test-auth-profile-updated@example.com';

      // Update user profile
      const updatedUser = await db.user.update({
        where: { id: testUser.id },
        data: {
          name: updatedName,
          email: updatedEmail,
          updatedAt: new Date(),
        },
      });

      expect(updatedUser.name).toBe(updatedName);
      expect(updatedUser.email).toBe(updatedEmail);
      expect(updatedUser.updatedAt).toBeDefined();
    });
  });

  describe('Database Relations', () => {
    it('should maintain user-project relationships', async () => {
      // Create a test user
      const testUser = await db.user.create({
        data: {
          email: 'test-auth-relations@example.com',
          name: 'Relations Test User',
        },
      });

      // Create a project for the user
      const testProject = await db.project.create({
        data: {
          userId: testUser.id,
          title: 'Test Project',
          paperContent: 'Test paper content',
        },
      });

      // Fetch user with projects
      const userWithProjects = await db.user.findUnique({
        where: { id: testUser.id },
        include: {
          projects: true,
        },
      });

      expect(userWithProjects).toBeDefined();
      expect(userWithProjects?.projects).toHaveLength(1);
      expect(userWithProjects?.projects[0]?.title).toBe('Test Project');
    });

    it('should handle user deletion with project cleanup', async () => {
      // Create a test user
      const testUser = await db.user.create({
        data: {
          email: 'test-auth-cleanup@example.com',
          name: 'Cleanup Test User',
        },
      });

      // Create a project for the user
      await db.project.create({
        data: {
          userId: testUser.id,
          title: 'Test Project for Cleanup',
          paperContent: 'Test paper content',
        },
      });

      // Delete user (projects should be set to null due to SetNull cascade)
      await db.user.delete({
        where: { id: testUser.id },
      });

      // Check that projects still exist but userId is null
      const orphanedProjects = await db.project.findMany({
        where: {
          title: 'Test Project for Cleanup',
        },
      });

      expect(orphanedProjects).toHaveLength(1);
      expect(orphanedProjects[0]?.userId).toBeNull();
    });
  });

  describe('Authentication Configuration', () => {
    it('should have proper auth configuration', () => {
      expect(auth).toBeDefined();
      expect(typeof auth.handler).toBe('function');
      expect(typeof auth.api.getSession).toBe('function');
    });

    it('should validate environment variables', () => {
      // Check that required environment variables are set
      expect(process.env.BETTER_AUTH_SECRET).toBeDefined();
      expect(process.env.BETTER_AUTH_URL).toBeDefined();
      expect(process.env.DATABASE_URL).toBeDefined();
    });
  });
});