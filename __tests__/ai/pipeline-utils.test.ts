import { describe, expect, it } from "@jest/globals";
import { ProjectStatus, StageStatus } from "@prisma/client";
import {
	PipelineErrorHandler,
	PipelineErrorType,
} from "~/lib/ai/pipeline-errors";
import {
	PIPELINE_STAGES,
	PipelineDataUtils,
	PipelineStageUtils,
	PipelineStatusUtils,
	PipelineTimingUtils,
	PipelineValidationUtils,
} from "~/lib/ai/pipeline-utils";
import type { PipelineContext, PipelineStage } from "~/types/ai";

describe("Pipeline Utilities", () => {
	describe("PipelineStageUtils", () => {
		it("should have correct pipeline stages defined", () => {
			expect(PIPELINE_STAGES).toHaveLength(6);
			expect(PIPELINE_STAGES[0]).toEqual({
				id: 1,
				name: "Concept Extraction",
				description: "Extract research concepts and objectives",
			});
			expect(PIPELINE_STAGES[5]).toEqual({
				id: 6,
				name: "Documentation Generation",
				description: "Create documentation and setup instructions",
			});
		});

		it("should get stage definition by ID", () => {
			const stage1 = PipelineStageUtils.getStageDefinition(1);
			expect(stage1).toEqual({
				id: 1,
				name: "Concept Extraction",
				description: "Extract research concepts and objectives",
			});

			const invalidStage = PipelineStageUtils.getStageDefinition(99);
			expect(invalidStage).toBeUndefined();
		});

		it("should validate stage IDs correctly", () => {
			expect(PipelineStageUtils.isValidStageId(1)).toBe(true);
			expect(PipelineStageUtils.isValidStageId(6)).toBe(true);
			expect(PipelineStageUtils.isValidStageId(0)).toBe(false);
			expect(PipelineStageUtils.isValidStageId(7)).toBe(false);
			expect(PipelineStageUtils.isValidStageId(-1)).toBe(false);
		});

		it("should get next stage ID correctly", () => {
			expect(PipelineStageUtils.getNextStageId(1)).toBe(2);
			expect(PipelineStageUtils.getNextStageId(5)).toBe(6);
			expect(PipelineStageUtils.getNextStageId(6)).toBeNull();
		});

		it("should get previous stage ID correctly", () => {
			expect(PipelineStageUtils.getPreviousStageId(2)).toBe(1);
			expect(PipelineStageUtils.getPreviousStageId(6)).toBe(5);
			expect(PipelineStageUtils.getPreviousStageId(1)).toBeNull();
		});

		it("should identify first and final stages", () => {
			expect(PipelineStageUtils.isFirstStage(1)).toBe(true);
			expect(PipelineStageUtils.isFirstStage(2)).toBe(false);
			expect(PipelineStageUtils.isFinalStage(6)).toBe(true);
			expect(PipelineStageUtils.isFinalStage(5)).toBe(false);
		});
	});

	describe("PipelineStatusUtils", () => {
		it("should convert stage statuses correctly", () => {
			expect(PipelineStatusUtils.convertStageStatus(StageStatus.PENDING)).toBe(
				"pending",
			);
			expect(
				PipelineStatusUtils.convertStageStatus(StageStatus.PROCESSING),
			).toBe("processing");
			expect(
				PipelineStatusUtils.convertStageStatus(StageStatus.COMPLETED),
			).toBe("completed");
			expect(PipelineStatusUtils.convertStageStatus(StageStatus.ERROR)).toBe(
				"error",
			);
			expect(PipelineStatusUtils.convertStageStatus(StageStatus.RETRYING)).toBe(
				"processing",
			);
		});

		it("should convert to Prisma statuses correctly", () => {
			expect(PipelineStatusUtils.convertToPrismaStatus("pending")).toBe(
				StageStatus.PENDING,
			);
			expect(PipelineStatusUtils.convertToPrismaStatus("processing")).toBe(
				StageStatus.PROCESSING,
			);
			expect(PipelineStatusUtils.convertToPrismaStatus("completed")).toBe(
				StageStatus.COMPLETED,
			);
			expect(PipelineStatusUtils.convertToPrismaStatus("error")).toBe(
				StageStatus.ERROR,
			);
		});

		it("should determine project status from stages", () => {
			// Empty stages
			expect(PipelineStatusUtils.determineProjectStatus([])).toBe(
				ProjectStatus.UPLOADED,
			);

			// All pending
			const allPending: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "pending" },
				{ id: 2, name: "Stage 2", status: "pending" },
			];
			expect(PipelineStatusUtils.determineProjectStatus(allPending)).toBe(
				ProjectStatus.UPLOADED,
			);

			// Some completed
			const someCompleted: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "pending" },
			];
			expect(PipelineStatusUtils.determineProjectStatus(someCompleted)).toBe(
				ProjectStatus.PROCESSING,
			);

			// All completed
			const allCompleted: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "completed" },
			];
			expect(PipelineStatusUtils.determineProjectStatus(allCompleted)).toBe(
				ProjectStatus.COMPLETED,
			);

			// Has error
			const hasError: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "error" },
			];
			expect(PipelineStatusUtils.determineProjectStatus(hasError)).toBe(
				ProjectStatus.ERROR,
			);

			// Has processing
			const hasProcessing: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "processing" },
			];
			expect(PipelineStatusUtils.determineProjectStatus(hasProcessing)).toBe(
				ProjectStatus.PROCESSING,
			);
		});

		it("should calculate progress correctly", () => {
			const stages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "completed" },
				{ id: 3, name: "Stage 3", status: "pending" },
				{ id: 4, name: "Stage 4", status: "pending" },
			];
			expect(PipelineStatusUtils.calculateProgress(stages)).toBe(50);

			expect(PipelineStatusUtils.calculateProgress([])).toBe(0);

			const allCompleted: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "completed" },
			];
			expect(PipelineStatusUtils.calculateProgress(allCompleted)).toBe(100);
		});

		it("should get current active stage", () => {
			const stages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "processing" },
				{ id: 3, name: "Stage 3", status: "pending" },
			];

			const currentStage = PipelineStatusUtils.getCurrentStage(stages);
			expect(currentStage?.id).toBe(2);
			expect(currentStage?.status).toBe("processing");

			// Test error stage priority
			const stagesWithError: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "error" },
				{ id: 3, name: "Stage 3", status: "pending" },
			];

			const errorStage = PipelineStatusUtils.getCurrentStage(stagesWithError);
			expect(errorStage?.id).toBe(2);
			expect(errorStage?.status).toBe("error");

			// Test pending stage
			const pendingStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "completed" },
				{ id: 3, name: "Stage 3", status: "pending" },
			];

			const pendingStage = PipelineStatusUtils.getCurrentStage(pendingStages);
			expect(pendingStage?.id).toBe(3);
			expect(pendingStage?.status).toBe("pending");
		});

		it("should get comprehensive pipeline summary", () => {
			const stages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "processing" },
				{ id: 3, name: "Stage 3", status: "pending" },
				{ id: 4, name: "Stage 4", status: "error" },
			];

			const summary = PipelineStatusUtils.getPipelineSummary(stages);
			expect(summary.total).toBe(4);
			expect(summary.completed).toBe(1);
			expect(summary.processing).toBe(1);
			expect(summary.pending).toBe(1);
			expect(summary.error).toBe(1);
			expect(summary.progress).toBe(25);
			expect(summary.status).toBe(ProjectStatus.ERROR);
		});
	});

	describe("PipelineTimingUtils", () => {
		it("should calculate stage duration correctly", () => {
			const startTime = new Date("2024-01-01T10:00:00Z");
			const endTime = new Date("2024-01-01T10:05:00Z");

			const stage: PipelineStage = {
				id: 1,
				name: "Test Stage",
				status: "completed",
				startTime,
				endTime,
			};

			const duration = PipelineTimingUtils.calculateStageDuration(stage);
			expect(duration).toBe(5 * 60 * 1000); // 5 minutes in milliseconds
		});

		it("should return null for incomplete timing", () => {
			const stageWithoutEnd: PipelineStage = {
				id: 1,
				name: "Test Stage",
				status: "processing",
				startTime: new Date(),
			};

			expect(
				PipelineTimingUtils.calculateStageDuration(stageWithoutEnd),
			).toBeNull();

			const stageWithoutStart: PipelineStage = {
				id: 1,
				name: "Test Stage",
				status: "pending",
			};

			expect(
				PipelineTimingUtils.calculateStageDuration(stageWithoutStart),
			).toBeNull();
		});

		it("should format duration correctly", () => {
			expect(PipelineTimingUtils.formatDuration(5000)).toBe("5s");
			expect(PipelineTimingUtils.formatDuration(65000)).toBe("1m 5s");
			expect(PipelineTimingUtils.formatDuration(3665000)).toBe("1h 1m 5s");
			expect(PipelineTimingUtils.formatDuration(7265000)).toBe("2h 1m 5s");
			expect(PipelineTimingUtils.formatDuration(125000)).toBe("2m 5s");
		});

		it("should calculate total pipeline duration", () => {
			const stages: PipelineStage[] = [
				{
					id: 1,
					name: "Stage 1",
					status: "completed",
					startTime: new Date("2024-01-01T10:00:00Z"),
					endTime: new Date("2024-01-01T10:02:00Z"),
				},
				{
					id: 2,
					name: "Stage 2",
					status: "completed",
					startTime: new Date("2024-01-01T10:02:00Z"),
					endTime: new Date("2024-01-01T10:05:00Z"),
				},
			];

			const totalDuration = PipelineTimingUtils.calculateTotalDuration(stages);
			expect(totalDuration).toBe(5 * 60 * 1000); // 5 minutes total

			// Test with no completed stages
			const incompleteStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "pending" },
			];
			expect(
				PipelineTimingUtils.calculateTotalDuration(incompleteStages),
			).toBeNull();
		});

		it("should estimate remaining time", () => {
			const stages: PipelineStage[] = [
				{
					id: 1,
					name: "Stage 1",
					status: "completed",
					startTime: new Date("2024-01-01T10:00:00Z"),
					endTime: new Date("2024-01-01T10:02:00Z"),
				},
				{
					id: 2,
					name: "Stage 2",
					status: "completed",
					startTime: new Date("2024-01-01T10:02:00Z"),
					endTime: new Date("2024-01-01T10:04:00Z"),
				},
				{ id: 3, name: "Stage 3", status: "pending" },
				{ id: 4, name: "Stage 4", status: "pending" },
			];

			const estimatedTime = PipelineTimingUtils.estimateRemainingTime(stages);
			expect(estimatedTime).toBe(2 * 60 * 1000 * 2); // Average 2 minutes * 2 remaining stages

			// Test with no completed stages
			const noCompletedStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "pending" },
			];
			expect(
				PipelineTimingUtils.estimateRemainingTime(noCompletedStages),
			).toBeNull();
		});
	});

	describe("PipelineValidationUtils", () => {
		it("should validate valid context", () => {
			const validContext: PipelineContext = {
				projectId: "test-project-id",
				paperContent:
					"This is a valid paper content with sufficient length to pass validation checks and requirements for processing.",
				stages: [
					{ id: 1, name: "Stage 1", status: "pending" },
					{ id: 2, name: "Stage 2", status: "pending" },
				],
				metadata: {
					fileName: "test.pdf",
					fileSize: 1024000,
				},
			};

			const result = PipelineValidationUtils.validateContext(validContext);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should detect validation errors", () => {
			const invalidContext: PipelineContext = {
				projectId: "",
				paperContent: "short",
				stages: [
					{ id: 1, name: "Stage 1", status: "pending" },
					{ id: 1, name: "Stage 1 Duplicate", status: "pending" }, // Duplicate ID
				],
				metadata: {
					fileName: "",
					fileSize: -1,
				},
			};

			const result = PipelineValidationUtils.validateContext(invalidContext);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors).toContain("Project ID is required");
			expect(result.errors).toContain("File name is required");
			expect(result.errors).toContain("Valid file size is required");
			expect(result.errors).toContain("Duplicate stage IDs found");
		});

		it("should detect warnings", () => {
			// Test short content warning
			const contextWithShortContent: PipelineContext = {
				projectId: "test-id",
				paperContent: "Short content",
				stages: [
					{ id: 1, name: "Stage 1", status: "pending" },
					{ id: 2, name: "Stage 2", status: "pending" },
				],
				metadata: {
					fileName: "test.pdf",
					fileSize: 1000,
				},
			};

			const result = PipelineValidationUtils.validateContext(
				contextWithShortContent,
			);
			expect(result.valid).toBe(true);
			expect(result.warnings.length).toBeGreaterThan(0);
			expect(
				result.warnings.some((warning) =>
					warning.includes("Paper content seems very short"),
				),
			).toBe(true);
		});

		it("should validate stage transitions", () => {
			// Valid transitions
			expect(
				PipelineValidationUtils.validateStageTransition("pending", "processing")
					.valid,
			).toBe(true);
			expect(
				PipelineValidationUtils.validateStageTransition(
					"processing",
					"completed",
				).valid,
			).toBe(true);
			expect(
				PipelineValidationUtils.validateStageTransition("processing", "error")
					.valid,
			).toBe(true);
			expect(
				PipelineValidationUtils.validateStageTransition("error", "processing")
					.valid,
			).toBe(true);

			// Invalid transitions
			const invalidTransition = PipelineValidationUtils.validateStageTransition(
				"completed",
				"processing",
			);
			expect(invalidTransition.valid).toBe(false);
			expect(invalidTransition.reason).toContain("Invalid transition");

			const anotherInvalid = PipelineValidationUtils.validateStageTransition(
				"pending",
				"completed",
			);
			expect(anotherInvalid.valid).toBe(false);
		});

		it("should check if pipeline can be started", () => {
			// Can start - has pending stages
			const pendingStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "pending" },
				{ id: 2, name: "Stage 2", status: "pending" },
			];

			const canStart = PipelineValidationUtils.canStartPipeline(pendingStages);
			expect(canStart.canStart).toBe(true);

			// Cannot start - already processing
			const processingStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "processing" },
				{ id: 2, name: "Stage 2", status: "pending" },
			];

			const cannotStart =
				PipelineValidationUtils.canStartPipeline(processingStages);
			expect(cannotStart.canStart).toBe(false);
			expect(cannotStart.reason).toContain("already running");

			// Cannot start - already completed
			const completedStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "completed" },
			];

			const alreadyCompleted =
				PipelineValidationUtils.canStartPipeline(completedStages);
			expect(alreadyCompleted.canStart).toBe(false);
			expect(alreadyCompleted.reason).toContain("already completed");

			// Cannot start - no stages
			const noStages: PipelineStage[] = [];
			const noStagesResult = PipelineValidationUtils.canStartPipeline(noStages);
			expect(noStagesResult.canStart).toBe(false);
			expect(noStagesResult.reason).toContain("No stages defined");
		});

		it("should check if pipeline can be retried", () => {
			// Can retry - has error stages
			const errorStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "error" },
			];

			const canRetry = PipelineValidationUtils.canRetryPipeline(errorStages);
			expect(canRetry.canRetry).toBe(true);

			// Cannot retry - no errors
			const noErrorStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "completed" },
			];

			const cannotRetry =
				PipelineValidationUtils.canRetryPipeline(noErrorStages);
			expect(cannotRetry.canRetry).toBe(false);
			expect(cannotRetry.reason).toContain("No failed stages");

			// Cannot retry - currently processing
			const processingStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "error" },
				{ id: 2, name: "Stage 2", status: "processing" },
			];

			const currentlyRunning =
				PipelineValidationUtils.canRetryPipeline(processingStages);
			expect(currentlyRunning.canRetry).toBe(false);
			expect(currentlyRunning.reason).toContain("currently running");
		});
	});

	describe("PipelineDataUtils", () => {
		it("should serialize and deserialize context", () => {
			const context: PipelineContext = {
				projectId: "test-id",
				paperContent: "Test content",
				stages: [
					{
						id: 1,
						name: "Stage 1",
						status: "completed",
						startTime: new Date("2024-01-01T10:00:00Z"),
						endTime: new Date("2024-01-01T10:02:00Z"),
						result: { data: "test" },
					},
				],
				metadata: {
					fileName: "test.pdf",
					fileSize: 1000,
				},
			};

			const serialized = PipelineDataUtils.serializeContext(context);
			const deserialized = PipelineDataUtils.deserializeContext(serialized);

			expect(deserialized.projectId).toBe(context.projectId);
			expect(deserialized.paperContent).toBe(context.paperContent);
			expect(deserialized.stages[0].startTime).toEqual(
				context.stages[0].startTime,
			);
			expect(deserialized.stages[0].endTime).toEqual(context.stages[0].endTime);
		});

		it("should extract stage results", () => {
			const stages: PipelineStage[] = [
				{
					id: 1,
					name: "Stage 1",
					status: "completed",
					result: { data: "stage1" },
				},
				{
					id: 2,
					name: "Stage 2",
					status: "completed",
					result: { data: "stage2" },
				},
				{ id: 3, name: "Stage 3", status: "pending" },
			];

			const stage1Result = PipelineDataUtils.extractStageResults(stages, 1);
			expect(stage1Result).toEqual({ data: "stage1" });

			const stage3Result = PipelineDataUtils.extractStageResults(stages, 3);
			expect(stage3Result).toBeNull();

			const invalidResult = PipelineDataUtils.extractStageResults(stages, 99);
			expect(invalidResult).toBeNull();
		});

		it("should get all results", () => {
			const stages: PipelineStage[] = [
				{
					id: 1,
					name: "Stage 1",
					status: "completed",
					result: { data: "stage1" },
				},
				{
					id: 2,
					name: "Stage 2",
					status: "completed",
					result: { data: "stage2" },
				},
				{ id: 3, name: "Stage 3", status: "pending" },
			];

			const allResults = PipelineDataUtils.getAllResults(stages);
			expect(allResults).toEqual({
				1: { data: "stage1" },
				2: { data: "stage2" },
			});
		});

		it("should create stage summary", () => {
			const stage: PipelineStage = {
				id: 1,
				name: "Test Stage",
				status: "completed",
				startTime: new Date("2024-01-01T10:00:00Z"),
				endTime: new Date("2024-01-01T10:02:00Z"),
				result: { data: "test" },
				error: "Test error",
			};

			const summary = PipelineDataUtils.createStageSummary(stage);
			expect(summary.id).toBe(1);
			expect(summary.name).toBe("Test Stage");
			expect(summary.status).toBe("completed");
			expect(summary.duration).toBe("2m 0s");
			expect(summary.hasResult).toBe(true);
			expect(summary.hasError).toBe(true);
		});

		it("should create pipeline summary", () => {
			const context: PipelineContext = {
				projectId: "test-project",
				paperContent: "Test content",
				stages: [
					{
						id: 1,
						name: "Stage 1",
						status: "completed",
						startTime: new Date("2024-01-01T10:00:00Z"),
						endTime: new Date("2024-01-01T10:02:00Z"),
					},
					{ id: 2, name: "Stage 2", status: "processing" },
				],
				metadata: {
					fileName: "test.pdf",
					fileSize: 1000,
				},
			};

			const summary = PipelineDataUtils.createPipelineSummary(context);
			expect(summary.projectId).toBe("test-project");
			expect(summary.totalStages).toBe(2);
			expect(summary.completedStages).toBe(1);
			expect(summary.progress).toBe(50);
			expect(summary.status).toBe(ProjectStatus.PROCESSING);
			expect(summary.stages).toHaveLength(2);
		});
	});

	describe("PipelineErrorHandler", () => {
		it("should create errors with correct properties", () => {
			const error = PipelineErrorHandler.createError(
				PipelineErrorType.AI_SERVICE_ERROR,
				"AI service is temporarily unavailable",
				{
					stage: 1,
					stageName: "Concept Extraction",
					projectId: "test-project-id",
					retryable: true,
				},
			);

			expect(error.type).toBe(PipelineErrorType.AI_SERVICE_ERROR);
			expect(error.message).toBe("AI service is temporarily unavailable");
			expect(error.stage).toBe(1);
			expect(error.stageName).toBe("Concept Extraction");
			expect(error.retryable).toBe(true);
			expect(error.projectId).toBe("test-project-id");
			expect(error.timestamp).toBeInstanceOf(Date);
			expect(error.code).toBeDefined();
		});

		it("should parse different error types correctly", () => {
			// Rate limit error
			const rateLimitError = new Error("Rate limit exceeded for requests");
			const parsedRateLimit = PipelineErrorHandler.parseError(rateLimitError);
			expect(parsedRateLimit.type).toBe(PipelineErrorType.RATE_LIMIT_ERROR);
			expect(parsedRateLimit.retryable).toBe(false);

			// Timeout error
			const timeoutError = new Error("Request timed out after 30 seconds");
			const parsedTimeout = PipelineErrorHandler.parseError(timeoutError);
			expect(parsedTimeout.type).toBe(PipelineErrorType.TIMEOUT_ERROR);
			expect(parsedTimeout.retryable).toBe(true);

			// Configuration error
			const configError = new Error("API key not configured");
			const parsedConfig = PipelineErrorHandler.parseError(configError);
			expect(parsedConfig.type).toBe(PipelineErrorType.CONFIGURATION_ERROR);
			expect(parsedConfig.retryable).toBe(false);

			// Database error
			const dbError = new Error("Database connection failed");
			const parsedDb = PipelineErrorHandler.parseError(dbError);
			expect(parsedDb.type).toBe(PipelineErrorType.DATABASE_ERROR);
			expect(parsedDb.retryable).toBe(true);

			// Generic error
			const genericError = new Error("Something went wrong");
			const parsedGeneric = PipelineErrorHandler.parseError(genericError);
			expect(parsedGeneric.type).toBe(PipelineErrorType.STAGE_EXECUTION_ERROR);

			// String error
			const stringError = "String error message";
			const parsedString = PipelineErrorHandler.parseError(stringError);
			expect(parsedString.type).toBe(PipelineErrorType.STAGE_EXECUTION_ERROR);
			expect(parsedString.message).toBe("String error message");

			// Unknown error
			const unknownError = { weird: "object" };
			const parsedUnknown = PipelineErrorHandler.parseError(unknownError);
			expect(parsedUnknown.type).toBe(PipelineErrorType.STAGE_EXECUTION_ERROR);
			expect(parsedUnknown.message).toBe("Unknown error occurred");
		});

		it("should format errors for users correctly", () => {
			const error = PipelineErrorHandler.createError(
				PipelineErrorType.RATE_LIMIT_ERROR,
				"Rate limit exceeded",
				{ stage: 2, stageName: "Algorithm Analysis" },
			);

			const userMessage = PipelineErrorHandler.formatErrorForUser(error);
			expect(userMessage).toContain("Stage 2");
			expect(userMessage).toContain("Algorithm Analysis");
			expect(userMessage).toContain("Rate limit exceeded");
			expect(userMessage).toContain("Please wait before retrying");
		});

		it("should format errors for logging correctly", () => {
			const error = PipelineErrorHandler.createError(
				PipelineErrorType.AI_SERVICE_ERROR,
				"Service unavailable",
				{
					stage: 1,
					stageName: "Concept Extraction",
					projectId: "test-project",
					details: { statusCode: 503 },
				},
			);

			const logMessage = PipelineErrorHandler.formatErrorForLogging(error);
			expect(logMessage).toContain("[AI_SERVICE_ERROR]");
			expect(logMessage).toContain("Project: test-project");
			expect(logMessage).toContain("Stage: 1 (Concept Extraction)");
			expect(logMessage).toContain('Details: {"statusCode":503}');
			expect(logMessage).toContain("Retryable: true");
		});

		it("should provide appropriate recovery suggestions", () => {
			const rateLimitError = PipelineErrorHandler.createError(
				PipelineErrorType.RATE_LIMIT_ERROR,
				"Rate limit exceeded",
			);
			const rateLimitSuggestions =
				PipelineErrorHandler.getRecoverySuggestions(rateLimitError);
			expect(rateLimitSuggestions).toContain(
				"Wait for the rate limit to reset",
			);
			expect(rateLimitSuggestions).toContain(
				"Consider upgrading your API plan for higher limits",
			);

			const configError = PipelineErrorHandler.createError(
				PipelineErrorType.CONFIGURATION_ERROR,
				"API key missing",
			);
			const configSuggestions =
				PipelineErrorHandler.getRecoverySuggestions(configError);
			expect(configSuggestions).toContain(
				"Check your API keys in the environment configuration",
			);

			const aiError = PipelineErrorHandler.createError(
				PipelineErrorType.AI_SERVICE_ERROR,
				"Service error",
			);
			const aiSuggestions =
				PipelineErrorHandler.getRecoverySuggestions(aiError);
			expect(aiSuggestions).toContain(
				"This error is retryable - the system will automatically retry",
			);
		});

		it("should calculate retry delays correctly", () => {
			const aiError = PipelineErrorHandler.createError(
				PipelineErrorType.AI_SERVICE_ERROR,
				"Service error",
			);

			// Test exponential backoff
			const delay1 = PipelineErrorHandler.getSuggestedRetryDelay(aiError, 1);
			const delay2 = PipelineErrorHandler.getSuggestedRetryDelay(aiError, 2);
			const delay3 = PipelineErrorHandler.getSuggestedRetryDelay(aiError, 3);

			expect(delay2).toBeGreaterThan(delay1);
			expect(delay3).toBeGreaterThan(delay2);

			// Test rate limit delay
			const rateLimitError = PipelineErrorHandler.createError(
				PipelineErrorType.RATE_LIMIT_ERROR,
				"Rate limit",
			);
			const rateLimitDelay = PipelineErrorHandler.getSuggestedRetryDelay(
				rateLimitError,
				1,
			);
			expect(rateLimitDelay).toBe(60000); // 1 minute

			// Test database error (linear backoff: baseDelay * (attempt + 1))
			const dbError = PipelineErrorHandler.createError(
				PipelineErrorType.DATABASE_ERROR,
				"DB error",
			);
			const dbDelay1 = PipelineErrorHandler.getSuggestedRetryDelay(dbError, 1);
			const dbDelay2 = PipelineErrorHandler.getSuggestedRetryDelay(dbError, 2);
			expect(dbDelay1).toBe(1000 * (1 + 1)); // 2000
			expect(dbDelay2).toBe(1000 * (2 + 1)); // 3000
		});

		it("should identify immediate failure conditions", () => {
			const configError = PipelineErrorHandler.createError(
				PipelineErrorType.CONFIGURATION_ERROR,
				"API key missing",
			);
			expect(PipelineErrorHandler.shouldFailImmediately(configError)).toBe(
				true,
			);

			const rateLimitError = PipelineErrorHandler.createError(
				PipelineErrorType.RATE_LIMIT_ERROR,
				"Rate limit exceeded",
			);
			expect(PipelineErrorHandler.shouldFailImmediately(rateLimitError)).toBe(
				true,
			);

			const aiError = PipelineErrorHandler.createError(
				PipelineErrorType.AI_SERVICE_ERROR,
				"Temporary service error",
			);
			expect(PipelineErrorHandler.shouldFailImmediately(aiError)).toBe(false);

			const customNonRetryable = PipelineErrorHandler.createError(
				PipelineErrorType.AI_SERVICE_ERROR,
				"Custom error",
				{ retryable: false },
			);
			expect(
				PipelineErrorHandler.shouldFailImmediately(customNonRetryable),
			).toBe(true);
		});
	});
});
