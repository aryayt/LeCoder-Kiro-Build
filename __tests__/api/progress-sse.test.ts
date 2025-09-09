/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "~/app/api/projects/[id]/progress/route";
import { db } from "~/server/db";
import type { Project } from "~/types/project";

// Mock the database
jest.mock("~/server/db", () => ({
	db: {
		project: {
			findUnique: jest.fn(),
		},
	},
}));

const mockDb = db as jest.Mocked<typeof db>;

describe("/api/projects/[id]/progress SSE Route", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("should return 400 if project ID is missing", async () => {
		const request = new NextRequest("http://localhost/api/projects//progress");
		const response = await GET(request, { params: { id: "" } });

		expect(response.status).toBe(400);
		expect(await response.text()).toBe("Project ID is required");
	});

	it("should return 404 if project does not exist", async () => {
		mockDb.project.findUnique.mockResolvedValue(null);

		const request = new NextRequest(
			"http://localhost/api/projects/nonexistent/progress",
		);
		const response = await GET(request, { params: { id: "nonexistent" } });

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Project not found");
	});

	it("should create SSE stream for valid project", async () => {
		const mockProject: Project = {
			id: "test-project-id",
			title: "Test Project",
			status: "PROCESSING",
			currentStage: 1,
			stages: [
				{
					id: "stage-1",
					stageNumber: 1,
					stageName: "Concept Extraction",
					status: "PROCESSING",
					errorMessage: null,
					startedAt: new Date(),
					completedAt: null,
					createdAt: new Date(),
					projectId: "test-project-id",
					inputData: null,
					outputData: null,
				},
			],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			metadata: null,
			userId: "test-user",
		};

		mockDb.project.findUnique.mockResolvedValue(mockProject);

		const request = new NextRequest(
			"http://localhost/api/projects/test-project-id/progress",
		);
		const response = await GET(request, { params: { id: "test-project-id" } });

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/event-stream");
		expect(response.headers.get("Cache-Control")).toBe("no-cache");
		expect(response.headers.get("Connection")).toBe("keep-alive");
	});

	it("should handle database errors gracefully", async () => {
		mockDb.project.findUnique.mockRejectedValue(new Error("Database error"));

		const request = new NextRequest(
			"http://localhost/api/projects/test-project-id/progress",
		);
		const response = await GET(request, { params: { id: "test-project-id" } });

		expect(response.status).toBe(500);
		expect(await response.text()).toBe("Database error");
	});

	it("should set correct CORS headers", async () => {
		const mockProject: Partial<Project> = {
			id: "test-project-id",
			status: "PROCESSING",
		};

		mockDb.project.findUnique.mockResolvedValue(mockProject as Project);

		const request = new NextRequest(
			"http://localhost/api/projects/test-project-id/progress",
		);
		const response = await GET(request, { params: { id: "test-project-id" } });

		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
		expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
			"Cache-Control",
		);
	});
});
