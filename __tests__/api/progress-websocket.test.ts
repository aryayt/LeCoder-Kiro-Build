/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "~/app/api/projects/[id]/websocket/route";
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

describe("/api/projects/[id]/websocket Route", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("should return 400 if project ID is missing", async () => {
		const request = new NextRequest("http://localhost/api/projects//websocket");
		const response = await GET(request, { params: { id: "" } });

		expect(response.status).toBe(400);

		const data = await response.json();
		expect(data.error).toBe("Project ID is required");
	});

	it("should return 404 if project does not exist", async () => {
		mockDb.project.findUnique.mockResolvedValue(null);

		const request = new NextRequest(
			"http://localhost/api/projects/nonexistent/websocket",
		);
		const response = await GET(request, { params: { id: "nonexistent" } });

		expect(response.status).toBe(404);

		const data = await response.json();
		expect(data.error).toBe("Project not found");
	});

	it("should return current project state immediately", async () => {
		const mockProject = {
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
				},
			],
		};

		mockDb.project.findUnique.mockResolvedValue(mockProject as any);

		const request = new NextRequest(
			"http://localhost/api/projects/test-project-id/websocket",
		);
		const response = await GET(request, { params: { id: "test-project-id" } });

		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.type).toBe("current");
		expect(data.projectId).toBe("test-project-id");
		expect(data.status).toBe("PROCESSING");
		expect(data.currentStage).toBe(1);
		expect(data.stages).toHaveLength(1);
	});

	it("should wait for updates when lastUpdate is provided", async () => {
		const oldDate = new Date("2023-01-01");
		const newDate = new Date("2023-01-02");

		const mockProject = {
			id: "test-project-id",
			status: "PROCESSING",
			currentStage: 2,
			updatedAt: newDate,
			stages: [],
		};

		mockDb.project.findUnique.mockResolvedValue(mockProject as any);

		const url = new URL(
			"http://localhost/api/projects/test-project-id/websocket",
		);
		url.searchParams.set("lastUpdate", oldDate.toISOString());

		const request = new NextRequest(url.toString());
		const response = await GET(request, { params: { id: "test-project-id" } });

		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.type).toBe("update");
		expect(data.projectId).toBe("test-project-id");
	});

	it("should return final state for completed projects", async () => {
		const mockProject = {
			id: "test-project-id",
			status: "COMPLETED",
			currentStage: 6,
			stages: [],
		};

		mockDb.project.findUnique.mockResolvedValue(mockProject as any);

		const request = new NextRequest(
			"http://localhost/api/projects/test-project-id/websocket",
		);
		const response = await GET(request, { params: { id: "test-project-id" } });

		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.type).toBe("current");
		expect(data.status).toBe("COMPLETED");
	});

	it("should handle database errors gracefully", async () => {
		mockDb.project.findUnique.mockRejectedValue(new Error("Database error"));

		const request = new NextRequest(
			"http://localhost/api/projects/test-project-id/websocket",
		);
		const response = await GET(request, { params: { id: "test-project-id" } });

		expect(response.status).toBe(500);

		const data = await response.json();
		expect(data.error).toBe("Failed to fetch project progress");
	});

	it("should include timestamp in all responses", async () => {
		const mockProject = {
			id: "test-project-id",
			status: "PROCESSING",
			currentStage: 1,
			stages: [],
		};

		mockDb.project.findUnique.mockResolvedValue(mockProject as any);

		const request = new NextRequest(
			"http://localhost/api/projects/test-project-id/websocket",
		);
		const response = await GET(request, { params: { id: "test-project-id" } });

		const data = await response.json();
		expect(data.timestamp).toBeDefined();
		expect(new Date(data.timestamp)).toBeInstanceOf(Date);
	});
});
