import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { db } from "~/server/db";

/**
 * Simple integration tests for the authentication system
 * These tests focus on database operations and basic functionality
 */

describe("Authentication System Integration", () => {
	beforeEach(async () => {
		// Clean up test data before each test
		await db.user.deleteMany({
			where: {
				email: {
					contains: "test-auth-system",
				},
			},
		});
	});

	afterEach(async () => {
		// Clean up test data after each test
		await db.user.deleteMany({
			where: {
				email: {
					contains: "test-auth-system",
				},
			},
		});
	});

	describe("User Management", () => {
		it("should create and manage users successfully", async () => {
			// Create a user
			const user = await db.user.create({
				data: {
					email: "test-auth-system-user@example.com",
					name: "Test User",
				},
			});

			expect(user).toBeDefined();
			expect(user.id).toBeDefined();
			expect(user.email).toBe("test-auth-system-user@example.com");
			expect(user.name).toBe("Test User");
			expect(user.createdAt).toBeDefined();
			expect(user.updatedAt).toBeDefined();

			// Update the user
			const updatedUser = await db.user.update({
				where: { id: user.id },
				data: {
					name: "Updated Test User",
					updatedAt: new Date(),
				},
			});

			expect(updatedUser.name).toBe("Updated Test User");
			expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
				user.updatedAt.getTime(),
			);

			// Delete the user
			await db.user.delete({
				where: { id: user.id },
			});

			const deletedUser = await db.user.findUnique({
				where: { id: user.id },
			});

			expect(deletedUser).toBeNull();
		});

		it("should handle user sessions", async () => {
			// Create a user
			const user = await db.user.create({
				data: {
					email: "test-auth-system-session@example.com",
					name: "Session Test User",
				},
			});

			// Create a session for the user
			const session = await db.session.create({
				data: {
					userId: user.id,
					token: "test-session-token-123",
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
				},
			});

			expect(session.userId).toBe(user.id);
			expect(session.token).toBe("test-session-token-123");
			expect(session.expiresAt).toBeInstanceOf(Date);

			// Fetch user with session
			const userWithSession = await db.user.findUnique({
				where: { id: user.id },
				include: {
					sessions: true,
				},
			});

			expect(userWithSession?.sessions).toHaveLength(1);
			expect(userWithSession?.sessions[0]?.token).toBe(
				"test-session-token-123",
			);
		});

		it("should handle OAuth accounts", async () => {
			// Create a user
			const user = await db.user.create({
				data: {
					email: "test-auth-system-oauth@example.com",
					name: "OAuth Test User",
				},
			});

			// Create an OAuth account for the user
			const account = await db.account.create({
				data: {
					userId: user.id,
					accountId: "google-123456",
					providerId: "google",
					accessToken: "access-token-123",
					refreshToken: "refresh-token-123",
				},
			});

			expect(account.userId).toBe(user.id);
			expect(account.providerId).toBe("google");
			expect(account.accountId).toBe("google-123456");

			// Fetch user with accounts
			const userWithAccounts = await db.user.findUnique({
				where: { id: user.id },
				include: {
					accounts: true,
				},
			});

			expect(userWithAccounts?.accounts).toHaveLength(1);
			expect(userWithAccounts?.accounts[0]?.providerId).toBe("google");
		});
	});

	describe("Database Schema Validation", () => {
		it("should enforce unique email constraint", async () => {
			const email = "test-auth-system-unique@example.com";

			// Create first user
			await db.user.create({
				data: {
					email,
					name: "First User",
				},
			});

			// Try to create second user with same email
			await expect(
				db.user.create({
					data: {
						email,
						name: "Second User",
					},
				}),
			).rejects.toThrow();
		});

		it("should enforce unique session token constraint", async () => {
			const user1 = await db.user.create({
				data: {
					email: "test-auth-system-session1@example.com",
					name: "User 1",
				},
			});

			const user2 = await db.user.create({
				data: {
					email: "test-auth-system-session2@example.com",
					name: "User 2",
				},
			});

			const sessionToken = "duplicate-session-token";

			// Create first session
			await db.session.create({
				data: {
					userId: user1.id,
					token: sessionToken,
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				},
			});

			// Try to create second session with same token
			await expect(
				db.session.create({
					data: {
						userId: user2.id,
						token: sessionToken,
						expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					},
				}),
			).rejects.toThrow();
		});
	});

	describe("User-Project Relationships", () => {
		it("should maintain proper relationships between users and projects", async () => {
			// Create a user
			const user = await db.user.create({
				data: {
					email: "test-auth-system-projects@example.com",
					name: "Project Owner",
				},
			});

			// Create projects for the user
			const project1 = await db.project.create({
				data: {
					userId: user.id,
					title: "Test Project 1",
					paperContent: "Sample paper content 1",
				},
			});

			const project2 = await db.project.create({
				data: {
					userId: user.id,
					title: "Test Project 2",
					paperContent: "Sample paper content 2",
				},
			});

			expect(project1.userId).toBe(user.id);
			expect(project2.userId).toBe(user.id);

			// Fetch user with projects
			const userWithProjects = await db.user.findUnique({
				where: { id: user.id },
				include: {
					projects: {
						orderBy: { createdAt: "asc" },
					},
				},
			});

			expect(userWithProjects?.projects).toHaveLength(2);
			expect(userWithProjects?.projects[0]?.title).toBe("Test Project 1");
			expect(userWithProjects?.projects[1]?.title).toBe("Test Project 2");
		});

		it("should handle user deletion with project orphaning", async () => {
			// Create a user
			const user = await db.user.create({
				data: {
					email: "test-auth-system-orphan@example.com",
					name: "User to be Deleted",
				},
			});

			// Create a project for the user
			const project = await db.project.create({
				data: {
					userId: user.id,
					title: "Project to be Orphaned",
					paperContent: "Content that will be orphaned",
				},
			});

			// Delete user (should set project.userId to null due to SetNull cascade)
			await db.user.delete({
				where: { id: user.id },
			});

			// Check that project still exists but userId is null
			const orphanedProject = await db.project.findUnique({
				where: { id: project.id },
			});

			expect(orphanedProject).toBeDefined();
			expect(orphanedProject?.userId).toBeNull();
			expect(orphanedProject?.title).toBe("Project to be Orphaned");
		});
	});
});
