import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ProjectStatus, StageStatus } from "@prisma/client";

// Mock the database module before importing operations
jest.mock("~/server/db", () => ({
	db: {
		project: {
			create: jest.fn(),
			findUnique: jest.fn(),
			findMany: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
		},
		pipelineStage: {
			create: jest.fn(),
			findMany: jest.fn(),
			update: jest.fn(),
			deleteMany: jest.fn(),
		},
		generatedFile: {
			create: jest.fn(),
			createMany: jest.fn(),
			findMany: jest.fn(),
			deleteMany: jest.fn(),
		},
		user: {
			findUnique: jest.fn(),
		},
		$queryRaw: jest.fn(),
	},
}));

// Mock the env module
jest.mock("~/env.js", () => ({
	env: {
		DATABASE_URL: "postgresql://test:test@localhost:5432/test",
		NODE_ENV: "test",
	},
}));

import * as dbOps from "~/lib/db/operations";

const mockDb = require("~/server/db").db;

describe("Database Operations", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Project Operations", () => {
		describe("createProject", () => {
			it("should create a new project successfully", async () => {
				const projectData = {
					userId: "user-123",
					title: "Test Project",
					paperContent: "Test content",
					metadata: { fileName: "test.pdf" },
				};

				const expectedProject = {
					id: "project-123",
					...projectData,
					status: ProjectStatus.UPLOADED,
					currentStage: 0,
					createdAt: new Date(),
					updatedAt: new Date(),
					user: { id: "user-123", name: "Test User" },
					stages: [],
				};

				mockDb.project.create.mockResolvedValue(expectedProject);

				const result = await dbOps.createProject(projectData);

				expect(mockDb.project.create).toHaveBeenCalledWith({
					data: {
						...projectData,
						status: ProjectStatus.UPLOADED,
						currentStage: 0,
					},
					include: {
						user: true,
						stages: {
							orderBy: { stageNumber: "asc" },
						},
					},
				});
				expect(result).toEqual(expectedProject);
			});

			it("should handle project creation errors", async () => {
				const projectData = {
					title: "Test Project",
					paperContent: "Test content",
				};

				mockDb.project.create.mockRejectedValue(new Error("Database error"));

				await expect(dbOps.createProject(projectData)).rejects.toThrow(
					"Failed to create project",
				);
			});
		});

		describe("getProjectById", () => {
			it("should fetch project with all relations", async () => {
				const projectId = "project-123";
				const expectedProject = {
					id: projectId,
					title: "Test Project",
					user: { id: "user-123", name: "Test User" },
					stages: [
						{
							stageNumber: 1,
							stageName: "Stage 1",
							status: StageStatus.COMPLETED,
						},
					],
					generatedFiles: [
						{ id: "file-1", filePath: "src/main.py", fileType: "python" },
					],
				};

				mockDb.project.findUnique.mockResolvedValue(expectedProject);

				const result = await dbOps.getProjectById(projectId);

				expect(mockDb.project.findUnique).toHaveBeenCalledWith({
					where: { id: projectId },
					include: {
						user: true,
						stages: {
							orderBy: { stageNumber: "asc" },
						},
						generatedFiles: {
							select: {
								id: true,
								filePath: true,
								fileType: true,
								createdAt: true,
							},
						},
					},
				});
				expect(result).toEqual(expectedProject);
			});

			it("should return null for non-existent project", async () => {
				mockDb.project.findUnique.mockResolvedValue(null);

				const result = await dbOps.getProjectById("non-existent");

				expect(result).toBeNull();
			});
		});

		describe("updateProjectStatus", () => {
			it("should update project status and stage", async () => {
				const projectId = "project-123";
				const newStatus = ProjectStatus.PROCESSING;
				const newStage = 2;

				const updatedProject = {
					id: projectId,
					status: newStatus,
					currentStage: newStage,
					updatedAt: expect.any(Date),
				};

				mockDb.project.update.mockResolvedValue(updatedProject);

				const result = await dbOps.updateProjectStatus(
					projectId,
					newStatus,
					newStage,
				);

				expect(mockDb.project.update).toHaveBeenCalledWith({
					where: { id: projectId },
					data: {
						status: newStatus,
						currentStage: newStage,
						updatedAt: expect.any(Date),
					},
				});
				expect(result).toEqual(updatedProject);
			});
		});

		describe("deleteProject", () => {
			it("should delete project and related records", async () => {
				const projectId = "project-123";
				const deletedProject = { id: projectId, title: "Deleted Project" };

				mockDb.generatedFile.deleteMany.mockResolvedValue({ count: 3 });
				mockDb.pipelineStage.deleteMany.mockResolvedValue({ count: 6 });
				mockDb.project.delete.mockResolvedValue(deletedProject);

				const result = await dbOps.deleteProject(projectId);

				expect(mockDb.generatedFile.deleteMany).toHaveBeenCalledWith({
					where: { projectId },
				});
				expect(mockDb.pipelineStage.deleteMany).toHaveBeenCalledWith({
					where: { projectId },
				});
				expect(mockDb.project.delete).toHaveBeenCalledWith({
					where: { id: projectId },
				});
				expect(result).toEqual(deletedProject);
			});
		});
	});

	describe("Pipeline Stage Operations", () => {
		describe("createPipelineStages", () => {
			it("should create all 6 pipeline stages", async () => {
				const projectId = "project-123";
				const mockStages = Array.from({ length: 6 }, (_, i) => ({
					id: `stage-${i + 1}`,
					projectId,
					stageNumber: i + 1,
					stageName: `Stage ${i + 1}`,
					status: StageStatus.PENDING,
				}));

				mockDb.pipelineStage.create
					.mockResolvedValueOnce(mockStages[0])
					.mockResolvedValueOnce(mockStages[1])
					.mockResolvedValueOnce(mockStages[2])
					.mockResolvedValueOnce(mockStages[3])
					.mockResolvedValueOnce(mockStages[4])
					.mockResolvedValueOnce(mockStages[5]);

				const result = await dbOps.createPipelineStages(projectId);

				expect(mockDb.pipelineStage.create).toHaveBeenCalledTimes(6);
				expect(result).toHaveLength(6);
				expect(result[0].stageName).toBe("Concept Extraction");
				expect(result[5].stageName).toBe("Documentation Generation");
			});
		});

		describe("updateStageStatus", () => {
			it("should update stage to processing with start time", async () => {
				const stageId = "stage-123";
				const updatedStage = {
					id: stageId,
					status: StageStatus.PROCESSING,
					startedAt: expect.any(Date),
				};

				mockDb.pipelineStage.update.mockResolvedValue(updatedStage);

				const result = await dbOps.updateStageStatus(
					stageId,
					StageStatus.PROCESSING,
				);

				expect(mockDb.pipelineStage.update).toHaveBeenCalledWith({
					where: { id: stageId },
					data: {
						status: StageStatus.PROCESSING,
						startedAt: expect.any(Date),
					},
				});
				expect(result).toEqual(updatedStage);
			});

			it("should update stage to completed with end time and output data", async () => {
				const stageId = "stage-123";
				const outputData = { result: "Stage completed successfully" };
				const updatedStage = {
					id: stageId,
					status: StageStatus.COMPLETED,
					completedAt: expect.any(Date),
					outputData,
				};

				mockDb.pipelineStage.update.mockResolvedValue(updatedStage);

				const result = await dbOps.updateStageStatus(
					stageId,
					StageStatus.COMPLETED,
					{
						outputData,
					},
				);

				expect(mockDb.pipelineStage.update).toHaveBeenCalledWith({
					where: { id: stageId },
					data: {
						status: StageStatus.COMPLETED,
						completedAt: expect.any(Date),
						outputData,
					},
				});
				expect(result).toEqual(updatedStage);
			});
		});
	});

	describe("Generated File Operations", () => {
		describe("createGeneratedFiles", () => {
			it("should create multiple files at once", async () => {
				const files = [
					{
						projectId: "project-123",
						filePath: "src/main.py",
						fileContent: 'print("Hello")',
						fileType: "python",
					},
					{
						projectId: "project-123",
						filePath: "README.md",
						fileContent: "# Project",
						fileType: "markdown",
					},
				];

				mockDb.generatedFile.createMany.mockResolvedValue({ count: 2 });

				const result = await dbOps.createGeneratedFiles(files);

				expect(mockDb.generatedFile.createMany).toHaveBeenCalledWith({
					data: files,
				});
				expect(result.count).toBe(2);
			});
		});

		describe("getGeneratedFilesByProjectId", () => {
			it("should fetch all files for a project", async () => {
				const projectId = "project-123";
				const expectedFiles = [
					{
						id: "file-1",
						projectId,
						filePath: "README.md",
						fileType: "markdown",
					},
					{
						id: "file-2",
						projectId,
						filePath: "src/main.py",
						fileType: "python",
					},
				];

				mockDb.generatedFile.findMany.mockResolvedValue(expectedFiles);

				const result = await dbOps.getGeneratedFilesByProjectId(projectId);

				expect(mockDb.generatedFile.findMany).toHaveBeenCalledWith({
					where: { projectId },
					orderBy: { filePath: "asc" },
				});
				expect(result).toEqual(expectedFiles);
			});
		});
	});

	describe("Analytics and Statistics", () => {
		describe("getProjectStats", () => {
			it("should return project statistics for all users", async () => {
				mockDb.project.count
					.mockResolvedValueOnce(100) // total
					.mockResolvedValueOnce(20) // uploaded
					.mockResolvedValueOnce(30) // processing
					.mockResolvedValueOnce(45) // completed
					.mockResolvedValueOnce(5); // error

				const result = await dbOps.getProjectStats();

				expect(result).toEqual({
					total: 100,
					uploaded: 20,
					processing: 30,
					completed: 45,
					error: 5,
				});
			});

			it("should return project statistics for specific user", async () => {
				const userId = "user-123";
				mockDb.project.count
					.mockResolvedValueOnce(10) // total
					.mockResolvedValueOnce(2) // uploaded
					.mockResolvedValueOnce(3) // processing
					.mockResolvedValueOnce(4) // completed
					.mockResolvedValueOnce(1); // error

				const result = await dbOps.getProjectStats(userId);

				expect(mockDb.project.count).toHaveBeenCalledWith({
					where: { userId },
				});
				expect(result).toEqual({
					total: 10,
					uploaded: 2,
					processing: 3,
					completed: 4,
					error: 1,
				});
			});
		});
	});

	describe("Database Health Check", () => {
		it("should return healthy status when database is accessible", async () => {
			mockDb.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

			const result = await dbOps.checkDatabaseConnection();

			expect(mockDb.$queryRaw).toHaveBeenCalledWith(expect.any(Array));
			expect(result.status).toBe("healthy");
			expect(result.timestamp).toBeInstanceOf(Date);
		});

		it("should return unhealthy status when database is not accessible", async () => {
			mockDb.$queryRaw.mockRejectedValue(new Error("Connection failed"));

			const result = await dbOps.checkDatabaseConnection();

			expect(result.status).toBe("unhealthy");
			expect(result.error).toBe("Connection failed");
			expect(result.timestamp).toBeInstanceOf(Date);
		});
	});
});
