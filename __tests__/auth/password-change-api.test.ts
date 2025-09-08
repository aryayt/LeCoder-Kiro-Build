import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { POST } from "~/app/api/user/change-password/route";
import { db } from "~/server/db";

// Mock the auth module
jest.mock("~/lib/auth", () => ({
	auth: {
		api: {
			getSession: jest.fn(),
		},
	},
}));

// Mock bcrypt
jest.mock("bcryptjs", () => ({
	compare: jest.fn(),
	hash: jest.fn(),
}));

const mockGetSession = require("~/lib/auth").auth.api.getSession;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<
	typeof bcrypt.compare
>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

/**
 * Tests for password change API endpoint
 */

describe("Password Change API", () => {
	beforeEach(async () => {
		jest.clearAllMocks();

		// Clean up test data
		await db.user.deleteMany({
			where: {
				email: {
					contains: "test-password-change",
				},
			},
		});
	});

	afterEach(async () => {
		// Clean up test data
		await db.user.deleteMany({
			where: {
				email: {
					contains: "test-password-change",
				},
			},
		});
	});

	describe("POST /api/user/change-password", () => {
		it("should change password successfully", async () => {
			// Create test user
			const hashedPassword = await bcrypt.hash("oldpassword123", 12);
			const testUser = await db.user.create({
				data: {
					email: "test-password-change-success@example.com",
					name: "Test User",
					password: hashedPassword,
				},
			});

			// Mock session
			mockGetSession.mockResolvedValue({
				user: { id: testUser.id },
			});

			// Mock bcrypt functions
			mockBcryptCompare.mockResolvedValue(true);
			mockBcryptHash.mockResolvedValue("new-hashed-password");

			const request = new NextRequest(
				"http://localhost:3000/api/user/change-password",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						currentPassword: "oldpassword123",
						newPassword: "NewPassword123",
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.message).toBe("Password changed successfully");
			expect(mockBcryptCompare).toHaveBeenCalledWith(
				"oldpassword123",
				hashedPassword,
			);
			expect(mockBcryptHash).toHaveBeenCalledWith("NewPassword123", 12);
		});

		it("should return 401 when not authenticated", async () => {
			mockGetSession.mockResolvedValue(null);

			const request = new NextRequest(
				"http://localhost:3000/api/user/change-password",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						currentPassword: "oldpassword123",
						newPassword: "NewPassword123",
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe("Unauthorized");
		});

		it("should return 400 when current password is incorrect", async () => {
			// Create test user
			const hashedPassword = await bcrypt.hash("oldpassword123", 12);
			const testUser = await db.user.create({
				data: {
					email: "test-password-change-wrong@example.com",
					name: "Test User",
					password: hashedPassword,
				},
			});

			// Mock session
			mockGetSession.mockResolvedValue({
				user: { id: testUser.id },
			});

			// Mock bcrypt compare to return false (wrong password)
			mockBcryptCompare.mockResolvedValue(false);

			const request = new NextRequest(
				"http://localhost:3000/api/user/change-password",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						currentPassword: "wrongpassword",
						newPassword: "NewPassword123",
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Current password is incorrect");
		});

		it("should validate password strength", async () => {
			// Create test user
			const testUser = await db.user.create({
				data: {
					email: "test-password-change-validation@example.com",
					name: "Test User",
					password: "hashed-password",
				},
			});

			// Mock session
			mockGetSession.mockResolvedValue({
				user: { id: testUser.id },
			});

			const request = new NextRequest(
				"http://localhost:3000/api/user/change-password",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						currentPassword: "oldpassword123",
						newPassword: "weak", // Weak password
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("Invalid input data");
			expect(data.details).toBeDefined();
		});

		it("should return 404 when user not found", async () => {
			// Mock session with non-existent user
			mockGetSession.mockResolvedValue({
				user: { id: "non-existent-user-id" },
			});

			const request = new NextRequest(
				"http://localhost:3000/api/user/change-password",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						currentPassword: "oldpassword123",
						newPassword: "NewPassword123",
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe("User not found or no password set");
		});

		it("should handle user without password (OAuth user)", async () => {
			// Create test user without password (OAuth user)
			const testUser = await db.user.create({
				data: {
					email: "test-password-change-oauth@example.com",
					name: "OAuth User",
					password: null,
				},
			});

			// Mock session
			mockGetSession.mockResolvedValue({
				user: { id: testUser.id },
			});

			const request = new NextRequest(
				"http://localhost:3000/api/user/change-password",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						currentPassword: "oldpassword123",
						newPassword: "NewPassword123",
					}),
				},
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe("User not found or no password set");
		});
	});
});
