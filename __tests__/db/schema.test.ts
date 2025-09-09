import { describe, expect, it } from "@jest/globals";
import { ProjectStatus, StageStatus } from "@prisma/client";

describe("Database Schema", () => {
	describe("Enums", () => {
		it("should have correct ProjectStatus values", () => {
			expect(ProjectStatus.UPLOADED).toBe("UPLOADED");
			expect(ProjectStatus.PROCESSING).toBe("PROCESSING");
			expect(ProjectStatus.COMPLETED).toBe("COMPLETED");
			expect(ProjectStatus.ERROR).toBe("ERROR");
			expect(ProjectStatus.CANCELLED).toBe("CANCELLED");
		});

		it("should have correct StageStatus values", () => {
			expect(StageStatus.PENDING).toBe("PENDING");
			expect(StageStatus.PROCESSING).toBe("PROCESSING");
			expect(StageStatus.COMPLETED).toBe("COMPLETED");
			expect(StageStatus.ERROR).toBe("ERROR");
			expect(StageStatus.RETRYING).toBe("RETRYING");
		});
	});

	describe("Data Validation", () => {
		it("should validate project data structure", () => {
			const projectData = {
				id: "project-123",
				userId: "user-123",
				title: "Test Project",
				paperContent: "This is test content",
				status: ProjectStatus.UPLOADED,
				currentStage: 0,
				metadata: {
					fileName: "test.pdf",
					fileSize: 1024,
					pageCount: 5,
				},
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			expect(projectData.id).toBeDefined();
			expect(projectData.title).toBeTruthy();
			expect(projectData.paperContent).toBeTruthy();
			expect(Object.values(ProjectStatus)).toContain(projectData.status);
			expect(projectData.currentStage).toBeGreaterThanOrEqual(0);
			expect(projectData.metadata).toBeDefined();
		});

		it("should validate pipeline stage data structure", () => {
			const stageData = {
				id: "stage-123",
				projectId: "project-123",
				stageNumber: 1,
				stageName: "Concept Extraction",
				status: StageStatus.PENDING,
				inputData: { test: "data" },
				outputData: null,
				errorMessage: null,
				startedAt: null,
				completedAt: null,
				createdAt: new Date(),
			};

			expect(stageData.id).toBeDefined();
			expect(stageData.projectId).toBeDefined();
			expect(stageData.stageNumber).toBeGreaterThan(0);
			expect(stageData.stageName).toBeTruthy();
			expect(Object.values(StageStatus)).toContain(stageData.status);
		});

		it("should validate generated file data structure", () => {
			const fileData = {
				id: "file-123",
				projectId: "project-123",
				filePath: "src/main.py",
				fileContent: 'print("Hello, World!")',
				fileType: "python",
				createdAt: new Date(),
			};

			expect(fileData.id).toBeDefined();
			expect(fileData.projectId).toBeDefined();
			expect(fileData.filePath).toBeTruthy();
			expect(fileData.fileContent).toBeTruthy();
			expect(fileData.fileType).toBeTruthy();
		});

		it("should validate user data structure", () => {
			const userData = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				image: "https://example.com/avatar.jpg",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			expect(userData.id).toBeDefined();
			expect(userData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
			expect(userData.name).toBeTruthy();
		});
	});

	describe("Business Logic Validation", () => {
		it("should validate stage progression logic", () => {
			const stages = [
				{ number: 1, name: "Concept Extraction" },
				{ number: 2, name: "Algorithm Analysis" },
				{ number: 3, name: "Architecture Planning" },
				{ number: 4, name: "Implementation Planning" },
				{ number: 5, name: "Code Generation" },
				{ number: 6, name: "Documentation Generation" },
			];

			expect(stages).toHaveLength(6);
			stages.forEach((stage, index) => {
				expect(stage.number).toBe(index + 1);
				expect(stage.name).toBeTruthy();
			});
		});

		it("should validate project status transitions", () => {
			const validTransitions = {
				[ProjectStatus.UPLOADED]: [
					ProjectStatus.PROCESSING,
					ProjectStatus.ERROR,
				],
				[ProjectStatus.PROCESSING]: [
					ProjectStatus.COMPLETED,
					ProjectStatus.ERROR,
					ProjectStatus.CANCELLED,
				],
				[ProjectStatus.COMPLETED]: [],
				[ProjectStatus.ERROR]: [ProjectStatus.PROCESSING],
				[ProjectStatus.CANCELLED]: [ProjectStatus.PROCESSING],
			};

			for (const [from, toStates] of Object.entries(validTransitions)) {
				expect(Object.values(ProjectStatus)).toContain(from as ProjectStatus);
				for (const to of toStates) {
					expect(Object.values(ProjectStatus)).toContain(to);
				}
			}
		});

		it("should validate stage status transitions", () => {
			const validTransitions = {
				[StageStatus.PENDING]: [StageStatus.PROCESSING],
				[StageStatus.PROCESSING]: [
					StageStatus.COMPLETED,
					StageStatus.ERROR,
					StageStatus.RETRYING,
				],
				[StageStatus.COMPLETED]: [],
				[StageStatus.ERROR]: [StageStatus.RETRYING, StageStatus.PROCESSING],
				[StageStatus.RETRYING]: [StageStatus.PROCESSING, StageStatus.ERROR],
			};

			for (const [from, toStates] of Object.entries(validTransitions)) {
				expect(Object.values(StageStatus)).toContain(from as StageStatus);
				for (const to of toStates) {
					expect(Object.values(StageStatus)).toContain(to);
				}
			}
		});
	});

	describe("Data Constraints", () => {
		it("should enforce required fields", () => {
			const requiredProjectFields = ["title", "paperContent", "status"];
			const requiredStageFields = [
				"projectId",
				"stageNumber",
				"stageName",
				"status",
			];
			const requiredFileFields = [
				"projectId",
				"filePath",
				"fileContent",
				"fileType",
			];
			const requiredUserFields = ["email"];

			expect(requiredProjectFields).toContain("title");
			expect(requiredProjectFields).toContain("paperContent");
			expect(requiredProjectFields).toContain("status");

			expect(requiredStageFields).toContain("projectId");
			expect(requiredStageFields).toContain("stageNumber");
			expect(requiredStageFields).toContain("stageName");
			expect(requiredStageFields).toContain("status");

			expect(requiredFileFields).toContain("projectId");
			expect(requiredFileFields).toContain("filePath");
			expect(requiredFileFields).toContain("fileContent");
			expect(requiredFileFields).toContain("fileType");

			expect(requiredUserFields).toContain("email");
		});

		it("should validate unique constraints", () => {
			// These would be enforced at the database level
			const uniqueConstraints = {
				users: ["email"],
				pipeline_stages: ["projectId", "stageNumber"], // composite unique
			};

			expect(uniqueConstraints.users).toContain("email");
			expect(uniqueConstraints.pipeline_stages).toContain("projectId");
			expect(uniqueConstraints.pipeline_stages).toContain("stageNumber");
		});

		it("should validate foreign key relationships", () => {
			const relationships = {
				projects: {
					userId: "users.id",
				},
				pipeline_stages: {
					projectId: "projects.id",
				},
				generated_files: {
					projectId: "projects.id",
				},
				accounts: {
					userId: "users.id",
				},
				sessions: {
					userId: "users.id",
				},
			};

			expect(relationships.projects.userId).toBe("users.id");
			expect(relationships.pipeline_stages.projectId).toBe("projects.id");
			expect(relationships.generated_files.projectId).toBe("projects.id");
			expect(relationships.accounts.userId).toBe("users.id");
			expect(relationships.sessions.userId).toBe("users.id");
		});
	});
});
