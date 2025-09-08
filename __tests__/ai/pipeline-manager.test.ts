import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ProjectStatus, StageStatus } from "@prisma/client";
import { PipelineContextFactory } from "~/lib/ai/pipeline-context";
import {
	PipelineErrorHandler,
	PipelineErrorType,
} from "~/lib/ai/pipeline-errors";
import {
	PipelineStageUtils,
	PipelineStatusUtils,
	PipelineTimingUtils,
	PipelineValidationUtils,
} from "~/lib/ai/pipeline-utils";
import type { PipelineContext, PipelineStage } from "~/types/ai";

describe("Pipeline Core Components", () => {
	describe("PipelineStageUtils", () => {
		it("should get stage definition by ID", () => {
			const stage1 = PipelineStageUtils.getStageDefinition(1);
			expect(stage1).toEqual({
				id: 1,
				name: "Concept Extraction",
				description: "Extract research concepts and objectives",
			});

			const stage6 = PipelineStageUtils.getStageDefinition(6);
			expect(stage6).toEqual({
				id: 6,
				name: "Documentation Generation",
				description: "Create documentation and setup instructions",
			});
		});

		it("should validate stage IDs", () => {
			expect(PipelineStageUtils.isValidStageId(1)).toBe(true);
			expect(PipelineStageUtils.isValidStageId(6)).toBe(true);
			expect(PipelineStageUtils.isValidStageId(0)).toBe(false);
			expect(PipelineStageUtils.isValidStageId(7)).toBe(false);
		});

		it("should get next and previous stage IDs", () => {
			expect(PipelineStageUtils.getNextStageId(1)).toBe(2);
			expect(PipelineStageUtils.getNextStageId(6)).toBeNull();
			expect(PipelineStageUtils.getPreviousStageId(2)).toBe(1);
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
			const allPending: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "pending" },
				{ id: 2, name: "Stage 2", status: "pending" },
			];
			expect(PipelineStatusUtils.determineProjectStatus(allPending)).toBe(
				ProjectStatus.UPLOADED,
			);

			const someCompleted: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "pending" },
			];
			expect(PipelineStatusUtils.determineProjectStatus(someCompleted)).toBe(
				ProjectStatus.PROCESSING,
			);

			const allCompleted: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "completed" },
			];
			expect(PipelineStatusUtils.determineProjectStatus(allCompleted)).toBe(
				ProjectStatus.COMPLETED,
			);

			const hasError: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "error" },
			];
			expect(PipelineStatusUtils.determineProjectStatus(hasError)).toBe(
				ProjectStatus.ERROR,
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
		});

		it("should get pipeline summary", () => {
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
		it("should calculate stage duration", () => {
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
			const stage: PipelineStage = {
				id: 1,
				name: "Test Stage",
				status: "processing",
				startTime: new Date(),
			};

			const duration = PipelineTimingUtils.calculateStageDuration(stage);
			expect(duration).toBeNull();
		});

		it("should format duration correctly", () => {
			expect(PipelineTimingUtils.formatDuration(5000)).toBe("5s");
			expect(PipelineTimingUtils.formatDuration(65000)).toBe("1m 5s");
			expect(PipelineTimingUtils.formatDuration(3665000)).toBe("1h 1m 5s");
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
		});
	});

	describe("PipelineValidationUtils", () => {
		it("should validate valid context", () => {
			const validContext: PipelineContext = {
				projectId: "test-project-id",
				paperContent:
					"This is a valid paper content with sufficient length to pass validation checks and requirements.",
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

		it("should validate stage transitions", () => {
			const validTransition = PipelineValidationUtils.validateStageTransition(
				"pending",
				"processing",
			);
			expect(validTransition.valid).toBe(true);

			const invalidTransition = PipelineValidationUtils.validateStageTransition(
				"completed",
				"processing",
			);
			expect(invalidTransition.valid).toBe(false);
			expect(invalidTransition.reason).toContain("Invalid transition");
		});

		it("should check if pipeline can be started", () => {
			const pendingStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "pending" },
				{ id: 2, name: "Stage 2", status: "pending" },
			];

			const canStart = PipelineValidationUtils.canStartPipeline(pendingStages);
			expect(canStart.canStart).toBe(true);

			const processingStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "processing" },
				{ id: 2, name: "Stage 2", status: "pending" },
			];

			const cannotStart =
				PipelineValidationUtils.canStartPipeline(processingStages);
			expect(cannotStart.canStart).toBe(false);
			expect(cannotStart.reason).toContain("already running");
		});

		it("should check if pipeline can be retried", () => {
			const errorStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "error" },
			];

			const canRetry = PipelineValidationUtils.canRetryPipeline(errorStages);
			expect(canRetry.canRetry).toBe(true);

			const noErrorStages: PipelineStage[] = [
				{ id: 1, name: "Stage 1", status: "completed" },
				{ id: 2, name: "Stage 2", status: "completed" },
			];

			const cannotRetry =
				PipelineValidationUtils.canRetryPipeline(noErrorStages);
			expect(cannotRetry.canRetry).toBe(false);
			expect(cannotRetry.reason).toContain("No failed stages");
		});
	});

	describe("PipelineContextFactory", () => {
		it("should create minimal context", () => {
			const context = PipelineContextFactory.createMinimal(
				"test-project-id",
				"Test paper content for pipeline processing",
				"test.pdf",
				1024000,
			);

			expect(context.projectId).toBe("test-project-id");
			expect(context.paperContent).toBe(
				"Test paper content for pipeline processing",
			);
			expect(context.metadata.fileName).toBe("test.pdf");
			expect(context.metadata.fileSize).toBe(1024000);
			expect(context.stages).toHaveLength(6);
			expect(context.stages[0].name).toBe("Concept Extraction");
		});

		it("should update stage in context", () => {
			const context = PipelineContextFactory.createMinimal(
				"test-id",
				"Test content",
				"test.pdf",
				1000,
			);

			const updatedContext = PipelineContextFactory.updateStageInContext(
				context,
				1,
				{ status: "completed", result: { data: "test result" } },
			);

			const stage = PipelineContextFactory.getStageFromContext(
				updatedContext,
				1,
			);
			expect(stage?.status).toBe("completed");
			expect(stage?.result).toEqual({ data: "test result" });
		});

		it("should calculate pipeline progress", () => {
			const context = PipelineContextFactory.createMinimal(
				"test-id",
				"Test content",
				"test.pdf",
				1000,
			);

			// Update some stages to completed
			let updatedContext = PipelineContextFactory.updateStageInContext(
				context,
				1,
				{ status: "completed" },
			);
			updatedContext = PipelineContextFactory.updateStageInContext(
				updatedContext,
				2,
				{ status: "completed" },
			);

			const progress =
				PipelineContextFactory.getPipelineProgress(updatedContext);
			expect(progress).toBe(33); // 2/6 * 100 rounded

			const isComplete =
				PipelineContextFactory.isPipelineComplete(updatedContext);
			expect(isComplete).toBe(false);

			const hasErrors =
				PipelineContextFactory.hasPipelineErrors(updatedContext);
			expect(hasErrors).toBe(false);
		});
	});

	describe("PipelineErrorHandler", () => {
		it("should create errors correctly", () => {
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
		});

		it("should parse different error types", () => {
			const rateLimitError = new Error("Rate limit exceeded for requests");
			const parsedRateLimit = PipelineErrorHandler.parseError(rateLimitError);
			expect(parsedRateLimit.type).toBe(PipelineErrorType.RATE_LIMIT_ERROR);
			expect(parsedRateLimit.retryable).toBe(false);

			const timeoutError = new Error("Request timed out after 30 seconds");
			const parsedTimeout = PipelineErrorHandler.parseError(timeoutError);
			expect(parsedTimeout.type).toBe(PipelineErrorType.TIMEOUT_ERROR);
			expect(parsedTimeout.retryable).toBe(true);

			const configError = new Error("API key not configured");
			const parsedConfig = PipelineErrorHandler.parseError(configError);
			expect(parsedConfig.type).toBe(PipelineErrorType.CONFIGURATION_ERROR);
			expect(parsedConfig.retryable).toBe(false);
		});

		it("should format errors for users", () => {
			const error = PipelineErrorHandler.createError(
				PipelineErrorType.RATE_LIMIT_ERROR,
				"Rate limit exceeded",
				{ stage: 2, stageName: "Algorithm Analysis" },
			);

			const userMessage = PipelineErrorHandler.formatErrorForUser(error);
			expect(userMessage).toContain("Stage 2");
			expect(userMessage).toContain("Algorithm Analysis");
			expect(userMessage).toContain("Rate limit exceeded");
		});

		it("should provide recovery suggestions", () => {
			const rateLimitError = PipelineErrorHandler.createError(
				PipelineErrorType.RATE_LIMIT_ERROR,
				"Rate limit exceeded",
			);

			const suggestions =
				PipelineErrorHandler.getRecoverySuggestions(rateLimitError);
			expect(suggestions).toContain("Wait for the rate limit to reset");
			expect(suggestions).toContain(
				"Consider upgrading your API plan for higher limits",
			);
		});

		it("should calculate retry delays", () => {
			const aiError = PipelineErrorHandler.createError(
				PipelineErrorType.AI_SERVICE_ERROR,
				"Service error",
			);

			const delay1 = PipelineErrorHandler.getSuggestedRetryDelay(aiError, 1);
			const delay2 = PipelineErrorHandler.getSuggestedRetryDelay(aiError, 2);
			expect(delay2).toBeGreaterThan(delay1);

			const rateLimitError = PipelineErrorHandler.createError(
				PipelineErrorType.RATE_LIMIT_ERROR,
				"Rate limit",
			);

			const rateLimitDelay = PipelineErrorHandler.getSuggestedRetryDelay(
				rateLimitError,
				1,
			);
			expect(rateLimitDelay).toBe(60000); // 1 minute
		});

		it("should identify non-retryable errors", () => {
			const configError = PipelineErrorHandler.createError(
				PipelineErrorType.CONFIGURATION_ERROR,
				"API key missing",
			);
			expect(PipelineErrorHandler.shouldFailImmediately(configError)).toBe(
				true,
			);

			const aiError = PipelineErrorHandler.createError(
				PipelineErrorType.AI_SERVICE_ERROR,
				"Temporary service error",
			);
			expect(PipelineErrorHandler.shouldFailImmediately(aiError)).toBe(false);
		});
	});
});
