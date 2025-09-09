import { afterEach, beforeEach, describe, it } from "@jest/globals";
import type { Project, Stage } from "@prisma/client";
/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET as progressSSE } from "~/app/api/projects/[id]/progress/route";
import { GET as progressWebSocket } from "~/app/api/projects/[id]/websocket/route";
import { db } from "~/server/db";

// Mock the database
jest.mock("~/server/db", () => ({
	db: {
		project: {
			findUnique: jest.fn(),
		},
	},
}));

const mockDb = db as jest.Mocked<typeof db>;

describe("Real-time Progress Integration", () => {
	const mockProject: Project & { stages: Stage[] } = {
		id: "test-project-id",
		title: "Test Project",
		status: "PROCESSING",
		currentStage: 2,
		updatedAt: new Date("2023-01-01T10:10:00Z"),
		stages: [
			{
				id: "stage-1",
				stageNumber: 1,
				stageName: "Concept Extraction",
				status: "COMPLETED",
				errorMessage: null,
				startedAt: new Date("2023-01-01T10:00:00Z"),
				completedAt: new Date("2023-01-01T10:05:00Z"),
				createdAt: new Date(),
				projectId: "test-project-id",
				inputData: {},
				outputData: {},
			},
			{
				id: "stage-2",
				stageNumber: 2,
				stageName: "Algorithm Analysis",
				status: "PROCESSING",
				errorMessage: null,
				startedAt: new Date("2023-01-01T10:05:00Z"),
				completedAt: null,
				createdAt: new Date(),
				projectId: "test-project-id",
				inputData: {},
				outputData: {},
			},
		],
		createdAt: new Date(),
		paperContent: "",
		metadata: {},
		userId: null,
	};

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("SSE and WebSocket API Consistency", () => {
		it("should return consistent data format between SSE and WebSocket APIs", async () => {
			mockDb.project.findUnique.mockResolvedValue(mockProject);

			// Test WebSocket API
			const wsRequest = new NextRequest(
				"http://localhost/api/projects/test-project-id/websocket",
			);
			const wsResponse = await progressWebSocket(wsRequest, {
				params: { id: "test-project-id" },
			});
			const wsData = await wsResponse.json();

			// Test SSE API (we can't easily test the stream, but we can test the setup)
			const sseRequest = new NextRequest(
				"http://localhost/api/projects/test-project-id/progress",
			);
			const sseResponse = await progressSSE(sseRequest, {
				params: { id: "test-project-id" },
			});

			// Both should handle the same project successfully
			expect(wsResponse.status).toBe(200);
			expect(sseResponse.status).toBe(200);

			// WebSocket should return project data
			expect(wsData.projectId).toBe("test-project-id");
			expect(wsData.status).toBe("PROCESSING");
			expect(wsData.currentStage).toBe(2);
			expect(wsData.stages).toHaveLength(2);

			// SSE should return proper headers
			expect(sseResponse.headers.get("Content-Type")).toBe("text/event-stream");
		});

		it("should handle project not found consistently", async () => {
			mockDb.project.findUnique.mockResolvedValue(null);

			const wsRequest = new NextRequest(
				"http://localhost/api/projects/nonexistent/websocket",
			);
			const wsResponse = await progressWebSocket(wsRequest, {
				params: { id: "nonexistent" },
			});

			const sseRequest = new NextRequest(
				"http://localhost/api/projects/nonexistent/progress",
			);
			const sseResponse = await progressSSE(sseRequest, {
				params: { id: "nonexistent" },
			});

			expect(wsResponse.status).toBe(404);
			expect(sseResponse.status).toBe(404);

			const wsData = await wsResponse.json();
			expect(wsData.error).toBe("Project not found");
		});

		it("should handle database errors consistently", async () => {
			mockDb.project.findUnique.mockRejectedValue(
				new Error("Database connection failed"),
			);

			const wsRequest = new NextRequest(
				"http://localhost/api/projects/test-project-id/websocket",
			);
			const wsResponse = await progressWebSocket(wsRequest, {
				params: { id: "test-project-id" },
			});

			const sseRequest = new NextRequest(
				"http://localhost/api/projects/test-project-id/progress",
			);
			const sseResponse = await progressSSE(sseRequest, {
				params: { id: "test-project-id" },
			});

			expect(wsResponse.status).toBe(500);
			expect(sseResponse.status).toBe(500); // SSE now returns 500 for database errors

			const wsData = await wsResponse.json();
			expect(wsData.error).toBe("Failed to fetch project progress");
		});
	});

	describe("Long Polling Behavior", () => {
		it("should wait for updates when lastUpdate parameter is provided", async () => {
			const oldDate = new Date("2023-01-01T09:00:00Z");
			const updatedProject = {
				...mockProject,
				currentStage: 3,
				updatedAt: new Date("2023-01-01T10:15:00Z"),
			};

			mockDb.project.findUnique.mockResolvedValue(updatedProject);

			const url = new URL(
				"http://localhost/api/projects/test-project-id/websocket",
			);
			url.searchParams.set("lastUpdate", oldDate.toISOString());

			const request = new NextRequest(url.toString());
			const response = await progressWebSocket(request, {
				params: { id: "test-project-id" },
			});

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.type).toBe("update");
			expect(data.currentStage).toBe(3);
		});

		it("should return final state for completed projects", async () => {
			const completedProject = {
				...mockProject,
				status: "COMPLETED",
				currentStage: 6,
			};

			mockDb.project.findUnique.mockResolvedValue(completedProject);

			const url = new URL(
				"http://localhost/api/projects/test-project-id/websocket",
			);
			url.searchParams.set(
				"lastUpdate",
				new Date("2023-01-01T09:00:00Z").toISOString(),
			);

			const request = new NextRequest(url.toString());
			const response = await progressWebSocket(request, {
				params: { id: "test-project-id" },
			});

			const data = await response.json();
			expect(data.type).toBe("update"); // Will be 'update' since project was updated
			expect(data.status).toBe("COMPLETED");
		});
	});

	describe("Stage Data Transformation", () => {
		it("should properly transform stage data for client consumption", async () => {
			mockDb.project.findUnique.mockResolvedValue(mockProject);

			const request = new NextRequest(
				"http://localhost/api/projects/test-project-id/websocket",
			);
			const response = await progressWebSocket(request, {
				params: { id: "test-project-id" },
			});

			const data = await response.json();
			const stages = data.stages;

			expect(stages).toHaveLength(2);

			// Check first stage (completed)
			expect(stages[0]).toEqual({
				id: "stage-1",
				stageNumber: 1,
				stageName: "Concept Extraction",
				status: "COMPLETED",
				errorMessage: null,
				startedAt: mockProject.stages[0].startedAt.toISOString(),
				completedAt: mockProject.stages[0].completedAt.toISOString(),
			});

			// Check second stage (processing)
			expect(stages[1]).toEqual({
				id: "stage-2",
				stageNumber: 2,
				stageName: "Algorithm Analysis",
				status: "PROCESSING",
				errorMessage: null,
				startedAt: mockProject.stages[1].startedAt.toISOString(),
				completedAt: null,
			});
		});

		it("should include error messages in stage data", async () => {
			const projectWithError = {
				...mockProject,
				stages: [
					...mockProject.stages,
					{
						id: "stage-3",
						stageNumber: 3,
						stageName: "Architecture Planning",
						status: "ERROR",
						errorMessage: "Failed to analyze architecture",
						startedAt: new Date("2023-01-01T10:10:00Z"),
						completedAt: null,
						createdAt: new Date(),
						projectId: "test-project-id",
						inputData: {},
						outputData: {},
					},
				],
			};

			mockDb.project.findUnique.mockResolvedValue(projectWithError);

			const request = new NextRequest(
				"http://localhost/api/projects/test-project-id/websocket",
			);
			const response = await progressWebSocket(request, {
				params: { id: "test-project-id" },
			});

			const data = await response.json();
			const errorStage = data.stages.find((s: Stage) => s.status === "ERROR");

			expect(errorStage).toBeDefined();
			expect(errorStage.errorMessage).toBe("Failed to analyze architecture");
		});
	});

	describe("Response Headers and CORS", () => {
		it("should set proper CORS headers for SSE", async () => {
			mockDb.project.findUnique.mockResolvedValue(mockProject);

			const request = new NextRequest(
				"http://localhost/api/projects/test-project-id/progress",
			);
			const response = await progressSSE(request, {
				params: { id: "test-project-id" },
			});

			expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
			expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
			expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
				"Cache-Control",
			);
		});

		it("should set proper cache headers for SSE", async () => {
			mockDb.project.findUnique.mockResolvedValue(mockProject);

			const request = new NextRequest(
				"http://localhost/api/projects/test-project-id/progress",
			);
			const response = await progressSSE(request, {
				params: { id: "test-project-id" },
			});

			expect(response.headers.get("Cache-Control")).toBe("no-cache");
			expect(response.headers.get("Connection")).toBe("keep-alive");
		});
	});

	describe("Error Recovery", () => {
		it("should handle intermittent database failures gracefully", async () => {
			// First call fails
			mockDb.project.findUnique.mockRejectedValueOnce(
				new Error("Temporary failure"),
			);

			// Second call succeeds
			mockDb.project.findUnique.mockResolvedValueOnce(mockProject);

			const request1 = new NextRequest(
				"http://localhost/api/projects/test-project-id/websocket",
			);
			const response1 = await progressWebSocket(request1, {
				params: { id: "test-project-id" },
			});

			expect(response1.status).toBe(500);

			const request2 = new NextRequest(
				"http://localhost/api/projects/test-project-id/websocket",
			);
			const response2 = await progressWebSocket(request2, {
				params: { id: "test-project-id" },
			});

			expect(response2.status).toBe(200);
		});
	});
});
