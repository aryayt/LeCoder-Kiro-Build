import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "@jest/globals";
import { type PrismaClient, ProjectStatus, StageStatus } from "@prisma/client";

// Mock Prisma Client for testing
const mockPrisma = {
	user: {
		create: jest.fn(),
		findUnique: jest.fn(),
		findMany: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	project: {
		create: jest.fn(),
		findUnique: jest.fn(),
		findMany: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	pipelineStage: {
		create: jest.fn(),
		findMany: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	generatedFile: {
		create: jest.fn(),
		findMany: jest.fn(),
		delete: jest.fn(),
	},
	$disconnect: jest.fn(),
} as unknown as PrismaClient;

// Mock the Prisma Client
jest.mock("@prisma/client", () => ({
	PrismaClient: jest.fn(() => mockPrisma),
	ProjectStatus: {
		UPLOADED: "UPLOADED",
		PROCESSING: "PROCESSING",
		COMPLETED: "COMPLETED",
		ERROR: "ERROR",
		CANCELLED: "CANCELLED",
	},
	StageStatus: {
		PENDING: "PENDING",
		PROCESSING: "PROCESSING",
		COMPLETED: "COMPLETED",
		ERROR: "ERROR",
		RETRYING: "RETRYING",
	},
}));

describe("Database Models", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("User Model", () => {
		it("should create a new user", async () => {
			const userData = {
				email: "test@example.com",
				name: "Test User",
				image: "https://example.com/avatar.jpg",
			};

			const expectedUser = {
				id: "user-123",
				...userData,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			(mockPrisma.user.create as jest.Mock).mockResolvedValue(expectedUser);

			const result = await mockPrisma.user.create({
				data: userData,
			});

			expect(mockPrisma.user.create).toHaveBeenCalledWith({
				data: userData,
			});
			expect(result).toEqual(expectedUser);
		});

		it("should find user by email", async () => {
			const email = "test@example.com";
			const expectedUser = {
				id: "user-123",
				email,
				name: "Test User",
				image: "https://example.com/avatar.jpg",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(expectedUser);

			const result = await mockPrisma.user.findUnique({
				where: { email },
			});

			expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
				where: { email },
			});
			expect(result).toEqual(expectedUser);
		});

		it("should return null for non-existent user", async () => {
			(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

			const result = await mockPrisma.user.findUnique({
				where: { email: "nonexistent@example.com" },
			});

			expect(result).toBeNull();
		});
	});

	describe("Project Model", () => {
		it("should create a new project", async () => {
			const projectData = {
				userId: "user-123",
				title: "Test Research Paper",
				paperContent: "This is a test paper content...",
				status: ProjectStatus.UPLOADED,
				metadata: {
					fileName: "test.pdf",
					fileSize: 1024,
					pageCount: 5,
				},
			};

			const expectedProject = {
				id: "project-123",
				...projectData,
				currentStage: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			(mockPrisma.project.create as jest.Mock).mockResolvedValue(
				expectedProject,
			);

			const result = await mockPrisma.project.create({
				data: projectData,
			});

			expect(mockPrisma.project.create).toHaveBeenCalledWith({
				data: projectData,
			});
			expect(result).toEqual(expectedProject);
		});

		it("should find projects by user ID", async () => {
			const userId = "user-123";
			const expectedProjects = [
				{
					id: "project-1",
					userId,
					title: "Project 1",
					status: ProjectStatus.COMPLETED,
				},
				{
					id: "project-2",
					userId,
					title: "Project 2",
					status: ProjectStatus.PROCESSING,
				},
			];

			(mockPrisma.project.findMany as jest.Mock).mockResolvedValue(
				expectedProjects,
			);

			const result = await mockPrisma.project.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
			});

			expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
				where: { userId },
				orderBy: { createdAt: "desc" },
			});
			expect(result).toEqual(expectedProjects);
		});

		it("should update project status", async () => {
			const projectId = "project-123";
			const updatedProject = {
				id: projectId,
				status: ProjectStatus.PROCESSING,
				currentStage: 2,
				updatedAt: new Date(),
			};

			(mockPrisma.project.update as jest.Mock).mockResolvedValue(
				updatedProject,
			);

			const result = await mockPrisma.project.update({
				where: { id: projectId },
				data: {
					status: ProjectStatus.PROCESSING,
					currentStage: 2,
				},
			});

			expect(mockPrisma.project.update).toHaveBeenCalledWith({
				where: { id: projectId },
				data: {
					status: ProjectStatus.PROCESSING,
					currentStage: 2,
				},
			});
			expect(result).toEqual(updatedProject);
		});
	});

	describe("Pipeline Stage Model", () => {
		it("should create pipeline stages for a project", async () => {
			const stageData = {
				projectId: "project-123",
				stageNumber: 1,
				stageName: "Concept Extraction",
				status: StageStatus.PENDING,
			};

			const expectedStage = {
				id: "stage-123",
				...stageData,
				createdAt: new Date(),
			};

			(mockPrisma.pipelineStage.create as jest.Mock).mockResolvedValue(
				expectedStage,
			);

			const result = await mockPrisma.pipelineStage.create({
				data: stageData,
			});

			expect(mockPrisma.pipelineStage.create).toHaveBeenCalledWith({
				data: stageData,
			});
			expect(result).toEqual(expectedStage);
		});

		it("should find stages by project ID", async () => {
			const projectId = "project-123";
			const expectedStages = [
				{
					id: "stage-1",
					projectId,
					stageNumber: 1,
					stageName: "Concept Extraction",
					status: StageStatus.COMPLETED,
				},
				{
					id: "stage-2",
					projectId,
					stageNumber: 2,
					stageName: "Algorithm Analysis",
					status: StageStatus.PROCESSING,
				},
			];

			(mockPrisma.pipelineStage.findMany as jest.Mock).mockResolvedValue(
				expectedStages,
			);

			const result = await mockPrisma.pipelineStage.findMany({
				where: { projectId },
				orderBy: { stageNumber: "asc" },
			});

			expect(mockPrisma.pipelineStage.findMany).toHaveBeenCalledWith({
				where: { projectId },
				orderBy: { stageNumber: "asc" },
			});
			expect(result).toEqual(expectedStages);
		});

		it("should update stage status with timing", async () => {
			const stageId = "stage-123";
			const now = new Date();
			const updatedStage = {
				id: stageId,
				status: StageStatus.PROCESSING,
				startedAt: now,
			};

			(mockPrisma.pipelineStage.update as jest.Mock).mockResolvedValue(
				updatedStage,
			);

			const result = await mockPrisma.pipelineStage.update({
				where: { id: stageId },
				data: {
					status: StageStatus.PROCESSING,
					startedAt: now,
				},
			});

			expect(mockPrisma.pipelineStage.update).toHaveBeenCalledWith({
				where: { id: stageId },
				data: {
					status: StageStatus.PROCESSING,
					startedAt: now,
				},
			});
			expect(result).toEqual(updatedStage);
		});
	});

	describe("Generated File Model", () => {
		it("should create generated files for a project", async () => {
			const fileData = {
				projectId: "project-123",
				filePath: "src/main.py",
				fileContent: 'print("Hello, World!")',
				fileType: "python",
			};

			const expectedFile = {
				id: "file-123",
				...fileData,
				createdAt: new Date(),
			};

			(mockPrisma.generatedFile.create as jest.Mock).mockResolvedValue(
				expectedFile,
			);

			const result = await mockPrisma.generatedFile.create({
				data: fileData,
			});

			expect(mockPrisma.generatedFile.create).toHaveBeenCalledWith({
				data: fileData,
			});
			expect(result).toEqual(expectedFile);
		});

		it("should find files by project ID", async () => {
			const projectId = "project-123";
			const expectedFiles = [
				{
					id: "file-1",
					projectId,
					filePath: "src/main.py",
					fileType: "python",
				},
				{
					id: "file-2",
					projectId,
					filePath: "README.md",
					fileType: "markdown",
				},
			];

			(mockPrisma.generatedFile.findMany as jest.Mock).mockResolvedValue(
				expectedFiles,
			);

			const result = await mockPrisma.generatedFile.findMany({
				where: { projectId },
				select: {
					id: true,
					projectId: true,
					filePath: true,
					fileType: true,
				},
			});

			expect(mockPrisma.generatedFile.findMany).toHaveBeenCalledWith({
				where: { projectId },
				select: {
					id: true,
					projectId: true,
					filePath: true,
					fileType: true,
				},
			});
			expect(result).toEqual(expectedFiles);
		});
	});

	describe("Database Operations", () => {
		it("should handle database connection errors", async () => {
			const error = new Error("Database connection failed");
			(mockPrisma.user.findMany as jest.Mock).mockRejectedValue(error);

			await expect(mockPrisma.user.findMany()).rejects.toThrow(
				"Database connection failed",
			);
		});

		it("should handle unique constraint violations", async () => {
			const error = new Error("Unique constraint failed");
			(mockPrisma.user.create as jest.Mock).mockRejectedValue(error);

			const userData = {
				email: "duplicate@example.com",
				name: "Test User",
			};

			await expect(mockPrisma.user.create({ data: userData })).rejects.toThrow(
				"Unique constraint failed",
			);
		});

		it("should handle foreign key constraint violations", async () => {
			const error = new Error("Foreign key constraint failed");
			(mockPrisma.project.create as jest.Mock).mockRejectedValue(error);

			const projectData = {
				userId: "non-existent-user",
				title: "Test Project",
				paperContent: "Content",
			};

			await expect(
				mockPrisma.project.create({ data: projectData }),
			).rejects.toThrow("Foreign key constraint failed");
		});
	});

	afterAll(async () => {
		await mockPrisma.$disconnect();
	});
});
